package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"

	_ "modernc.org/sqlite"
	"github.com/rs/cors"
)

type Cuenta struct {
	ID            int64   `json:"id"`
	Codigo        string  `json:"codigo"`
	Nombre        string  `json:"nombre"`
	Naturaleza    string  `json:"naturaleza"`
	Nivel         int     `json:"nivel"`
	CuentaPadreId *string `json:"cuentaPadreId"`
	SaldoInicial  float64 `json:"saldoInicial"`
	Debitos       float64 `json:"debitos"`
	Creditos      float64 `json:"creditos"`
	SaldoFinal    float64 `json:"saldoFinal"`
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/fast-balance", handleFastBalance)

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})
	handler := c.Handler(mux)

	port := "8080"
	fmt.Printf("Servidor Go de reportes escuchando en http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func handleFastBalance(w http.ResponseWriter, r *http.Request) {
	tenantID := r.Header.Get("x-tenant-id")
	if tenantID == "" {
		http.Error(w, `{"success":false,"message":"Falta x-tenant-id"}`, http.StatusBadRequest)
		return
	}

	strDesde := r.URL.Query().Get("fechaDesde")
	strHasta := r.URL.Query().Get("fechaHasta")

	if strDesde == "" || strHasta == "" {
		http.Error(w, `{"success":false,"message":"Faltan fechas"}`, http.StatusBadRequest)
		return
	}

	tDesde, err := time.Parse(time.RFC3339, strDesde)
	if err != nil {
		http.Error(w, `{"success":false,"message":"FechaDesde inválida"}`, http.StatusBadRequest)
		return
	}
	tHasta, err := time.Parse(time.RFC3339, strHasta)
	if err != nil {
		http.Error(w, `{"success":false,"message":"FechaHasta inválida"}`, http.StatusBadRequest)
		return
	}

	msDesde := tDesde.UnixNano() / 1e6
	msHasta := tHasta.UnixNano() / 1e6

	globalDbPath := filepath.Join("..", "backend", "prisma", "sistema_global.db")
	if _, err := os.Stat(globalDbPath); os.IsNotExist(err) {
		http.Error(w, `{"success":false,"message":"Base de datos global no encontrada"}`, http.StatusInternalServerError)
		return
	}

	globalDb, err := sql.Open("sqlite", globalDbPath+"?mode=ro")
	if err != nil {
		http.Error(w, `{"success":false,"message":"Error abriendo DB global"}`, http.StatusInternalServerError)
		return
	}
	defer globalDb.Close()

	var nombreBd string
	err = globalDb.QueryRow("SELECT nombre_bd FROM EmpresaGlobal WHERE codigo_empresa = ?", tenantID).Scan(&nombreBd)
	if err != nil {
		fmt.Printf("Error searching tenant %s in global DB: %v\n", tenantID, err)
		http.Error(w, `{"success":false,"message":"Tenant no encontrado en DB global"}`, http.StatusNotFound)
		return
	}

	dbPath := filepath.Join("..", "backend", "prisma", nombreBd+".db")
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		http.Error(w, `{"success":false,"message":"Base de datos del tenant no encontrada"}`, http.StatusNotFound)
		return
	}

	db, err := sql.Open("sqlite", dbPath+"?mode=ro")
	if err != nil {
		http.Error(w, `{"success":false,"message":"Error abriendo DB"}`, http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// 1. Fetch Cuentas
	cuentasMap := make(map[int64]*Cuenta)
	codigoMap := make(map[string]*Cuenta)
	rows, err := db.Query("SELECT id, codigo, nombre, naturaleza, nivel, cuentaPadreId FROM PlanCuenta WHERE activa = 1")
	if err != nil {
		http.Error(w, `{"success":false,"message":"Error consultando cuentas"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var maxNivel int
	for rows.Next() {
		var c Cuenta
		var padreId sql.NullString
		if err := rows.Scan(&c.ID, &c.Codigo, &c.Nombre, &c.Naturaleza, &c.Nivel, &padreId); err != nil {
			fmt.Println("Scan error:", err)
			continue
		}
		if padreId.Valid {
			pid := padreId.String
			c.CuentaPadreId = &pid
		}
		cuentasMap[c.ID] = &c
		codigoMap[c.Codigo] = &c
		if c.Nivel > maxNivel {
			maxNivel = c.Nivel
		}
	}

	// CONCURRENCY: Fetch Initial Balances and Period Balances concurrently
	var wg sync.WaitGroup
	wg.Add(2)

	type movAgg struct {
		CuentaID int64
		Debito   float64
		Credito  float64
	}

	var iniciales []movAgg
	var periodo []movAgg
	var errInicial, errPeriodo error

	go func() {
		defer wg.Done()
		q := `
			SELECT m.cuentaId, SUM(m.debito), SUM(m.credito)
			FROM Movimiento m
			JOIN Comprobante c ON m.comprobanteId = c.id
			WHERE c.estado = 'CONTABILIZADO' AND c.fecha < ?
			GROUP BY m.cuentaId
		`
		r, err := db.Query(q, msDesde)
		if err != nil {
			errInicial = err
			return
		}
		defer r.Close()
		for r.Next() {
			var m movAgg
			var d, c sql.NullFloat64
			if err := r.Scan(&m.CuentaID, &d, &c); err == nil {
				if d.Valid { m.Debito = d.Float64 }
				if c.Valid { m.Credito = c.Float64 }
				iniciales = append(iniciales, m)
			}
		}
	}()

	go func() {
		defer wg.Done()
		q := `
			SELECT m.cuentaId, SUM(m.debito), SUM(m.credito)
			FROM Movimiento m
			JOIN Comprobante c ON m.comprobanteId = c.id
			WHERE c.estado = 'CONTABILIZADO' AND c.fecha >= ? AND c.fecha <= ?
			GROUP BY m.cuentaId
		`
		r, err := db.Query(q, msDesde, msHasta)
		if err != nil {
			errPeriodo = err
			return
		}
		defer r.Close()
		for r.Next() {
			var m movAgg
			var d, c sql.NullFloat64
			if err := r.Scan(&m.CuentaID, &d, &c); err == nil {
				if d.Valid { m.Debito = d.Float64 }
				if c.Valid { m.Credito = c.Float64 }
				periodo = append(periodo, m)
			}
		}
	}()

	wg.Wait()
	
	fmt.Printf("Iniciales: %d, Periodo: %d, msDesde: %d, msHasta: %d\n", len(iniciales), len(periodo), msDesde, msHasta)

	if errInicial != nil || errPeriodo != nil {
		http.Error(w, `{"success":false,"message":"Error calculando movimientos concurrentes"}`, http.StatusInternalServerError)
		return
	}

	// Map sums to accounts
	for _, m := range iniciales {
		if c, ok := cuentasMap[m.CuentaID]; ok {
			if c.Naturaleza == "DEBITO" {
				c.SaldoInicial = m.Debito - m.Credito
			} else {
				c.SaldoInicial = m.Credito - m.Debito
			}
		}
	}

	for _, m := range periodo {
		if c, ok := cuentasMap[m.CuentaID]; ok {
			c.Debitos = m.Debito
			c.Creditos = m.Credito
		}
	}

	// Roll-up hierarchy
	for nivel := maxNivel; nivel > 1; nivel-- {
		for _, c := range cuentasMap {
			if c.Nivel == nivel && c.CuentaPadreId != nil {
				if padre, ok := codigoMap[*c.CuentaPadreId]; ok {
					padre.SaldoInicial += c.SaldoInicial
					padre.Debitos += c.Debitos
					padre.Creditos += c.Creditos
				}
			}
		}
	}

	// Final balances and prepare response array
	var result []*Cuenta
	for _, c := range cuentasMap {
		if c.Naturaleza == "DEBITO" {
			c.SaldoFinal = c.SaldoInicial + c.Debitos - c.Creditos
		} else {
			c.SaldoFinal = c.SaldoInicial + c.Creditos - c.Debitos
		}
		result = append(result, c)
	}

	// Sort by Code
	sort.Slice(result, func(i, j int) bool {
		return result[i].Codigo < result[j].Codigo
	})

	response := map[string]interface{}{
		"success": true,
		"data":    result,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
