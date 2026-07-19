import { Request, Response } from 'express';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import ExcelJS from 'exceljs';


// ==========================================
// DESCARGAR PLANTILLA OFICIAL (IMP-001)
// ==========================================
export const descargarPlantilla = async (req: Request, res: Response) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Movimientos');

    // Columnas Mínimas y Recomendadas
    sheet.columns = [
      { header: 'Fecha (DD/MM/AAAA)', key: 'fecha', width: 20 },
      { header: 'Documento', key: 'documento', width: 15 },
      { header: 'TipoDocumento', key: 'tipoDocumento', width: 15 },
      { header: 'Cuenta', key: 'cuenta', width: 15 },
      { header: 'Tercero (NIT)', key: 'tercero', width: 15 },
      { header: 'CentroCosto', key: 'centroCosto', width: 15 },
      { header: 'Concepto', key: 'concepto', width: 30 },
      { header: 'Debito', key: 'debito', width: 15 },
      { header: 'Credito', key: 'credito', width: 15 },
      { header: 'Sucursal', key: 'sucursal', width: 15 },
      { header: 'Proyecto', key: 'proyecto', width: 15 },
      { header: 'Observacion', key: 'observacion', width: 30 }
    ];

    // Estilizar cabeceras
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' } // Indigo color
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="plantilla_movimientos.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error('Error generando plantilla:', error);
    res.status(500).json({ error: 'Error interno generando la plantilla' });
  }
};

// ==========================================
// SUBIR Y PREPROCESAR ARCHIVO (IMP-001)
// ==========================================
export const subirArchivo = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const tenantId = req.headers['x-tenant-id'] as string;
    const usuarioId = req.headers['x-user-id'] as string || 'Sistema';

    // Leer el archivo con ExcelJS (Solo para contar filas rápido y extraer cabeceras)
    const ext = req.file.originalname.split('.').pop()?.toLowerCase();
    const workbook = new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet;

    if (ext === 'csv') {
      worksheet = await workbook.csv.readFile(req.file.path);
    } else {
      await workbook.xlsx.readFile(req.file.path);
      worksheet = workbook.worksheets[0];
    }
    
    const headers: string[] = [];
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell((cell, colNumber) => {
      headers.push(cell.value?.toString() || `Columna ${colNumber}`);
    });

    const totalFilas = Math.max(0, worksheet.rowCount - 1); // Menos cabecera

    // Extraer hasta 5 filas de previsualización
    const previewData: any[] = [];
    for (let i = 2; i <= Math.min(6, worksheet.rowCount); i++) {
      const row = worksheet.getRow(i);
      const rowData: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1] || `Columna ${colNumber}`;
        rowData[header] = cell.value;
      });
      previewData.push(rowData);
    }

    const prisma = (req as any).tenantPrisma;

    // Guardar registro de la importación en estado PENDIENTE
    const importacion = await prisma.importacionJob.create({
      data: {
        archivo: req.file.filename,
        usuarioId: usuarioId,
        estado: 'PENDIENTE',
        totalRegistros: totalFilas
      }
    });

    return res.status(200).json({
      message: 'Archivo subido y registrado correctamente',
      importacionId: importacion.id,
      totalRegistros: totalFilas,
      archivo: req.file.filename,
      columns: headers,
      previewData
    });
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    return res.status(500).json({ error: 'Error interno procesando el archivo' });
  }
};

// ==========================================
// GENERAR VISTA PREVIA Y VALIDAR (IMP-004)
// ==========================================
export const generarVistaPrevia = async (req: Request, res: Response): Promise<any> => {
  try {
    const { importacionId, mappings } = req.body;
    const prisma = (req as any).tenantPrisma;

    const importacion = await prisma.importacionJob.findUnique({
      where: { id: importacionId }
    });

    if (!importacion) {
      return res.status(404).json({ error: 'Importación no encontrada' });
    }

    const filePath = `./uploads/importaciones/${importacion.archivo}`;
    const ext = importacion.archivo.split('.').pop()?.toLowerCase();
    const workbook = new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet;

    if (ext === 'csv') {
      worksheet = await workbook.csv.readFile(filePath);
    } else {
      await workbook.xlsx.readFile(filePath);
      worksheet = workbook.worksheets[0];
    }

    const headers: string[] = [];
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell((cell, colNumber) => {
      headers.push(cell.value?.toString() || `Columna ${colNumber}`);
    });

    let totalDebito = 0;
    let totalCredito = 0;
    const previewRows: any[] = [];
    let validRecords = 0;
    let warningRecords = 0;
    let errorRecords = 0;

    const totalFilas = Math.max(0, worksheet.rowCount - 1);

    // Mapeo inverso: de campo ERP a nombre de columna en archivo
    const reverseMap: Record<string, string> = {};
    for (const [fileCol, erpField] of Object.entries(mappings)) {
      if (erpField) {
        reverseMap[erpField as string] = fileCol;
      }
    }

    // 1. Recolectar códigos únicos para validación cruzada con la BD
    const cuentasRequeridas = new Set<string>();
    const tercerosRequeridos = new Set<string>();
    const centrosRequeridos = new Set<string>();
    const docNumbersPorTipo = new Map<string, Set<number>>();
    
    const MAX_FILAS_PREVIEW = Math.min(totalFilas + 1, 1000);
    
    for (let i = 2; i <= MAX_FILAS_PREVIEW; i++) {
      const row = worksheet.getRow(i);
      const rowData: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1] || `Columna ${colNumber}`;
        rowData[header] = cell.value;
      });

      const getVal = (erpField: string) => {
        const fileColName = reverseMap[erpField];
        if (!fileColName) return null;
        let val = rowData[fileColName];
        if (typeof val === 'object' && val !== null && val.result) return val.result;
        if (typeof val === 'object' && val !== null && val.text) return val.text;
        return val ? val.toString().trim() : null;
      };

      const cuenta = getVal('cuenta_codigo');
      if (cuenta) cuentasRequeridas.add(cuenta);

      const tercero = getVal('tercero_documento');
      if (tercero) tercerosRequeridos.add(tercero);

      const centro = getVal('centro_costo_codigo');
      if (centro) centrosRequeridos.add(centro);

      // Usar mapeado o config fallback si no está en excel
      const tipoDoc = getVal('tipo_documento')?.toUpperCase() || req.body.config?.comprobante?.toUpperCase() || 'CC';
      const numDocStr = getVal('numero_documento');
      if (numDocStr) {
        const numDoc = parseInt(numDocStr, 10);
        if (!isNaN(numDoc)) {
          if (!docNumbersPorTipo.has(tipoDoc)) {
            docNumbersPorTipo.set(tipoDoc, new Set());
          }
          docNumbersPorTipo.get(tipoDoc)!.add(numDoc);
        }
      }
    }

    // 2. Consultar BD del Tenant para ver cuáles existen realmente
    const cuentasValidas = await prisma.planCuenta.findMany({
      where: { codigo: { in: Array.from(cuentasRequeridas) } },
      select: { codigo: true }
    });
    const cuentasValidasSet = new Set(cuentasValidas.map((c: any) => c.codigo));

    const tercerosValidos = await prisma.tercero.findMany({
      where: { identificacion: { in: Array.from(tercerosRequeridos) } },
      select: { identificacion: true }
    });
    const tercerosValidosSet = new Set(tercerosValidos.map((t: any) => t.identificacion));

    const centrosValidos = await prisma.centroCosto.findMany({
      where: { codigo: { in: Array.from(centrosRequeridos) } },
      select: { codigo: true }
    });
    const centrosValidosSet = new Set(centrosValidos.map((c: any) => c.codigo));

    // Obtener Tipos de Documento requeridos para ver si existen y buscar comprobantes repetidos
    const tiposDocs = Array.from(docNumbersPorTipo.keys());
    const tiposDocValidos = await prisma.tipoDocumento.findMany({
      where: { codigo: { in: tiposDocs } },
      select: { id: true, codigo: true }
    });
    const tiposDocMap = new Map(tiposDocValidos.map((t: any) => [t.codigo, t.id]));

    // Consultar Comprobantes existentes para detectar si el número ya fue usado
    const comprobantesExistentesSet = new Set<string>(); // guarda: "tipoId-numero"
    for (const [tipoDocCode, numeros] of docNumbersPorTipo.entries()) {
      const tipoId = tiposDocMap.get(tipoDocCode);
      if (tipoId) {
        const usados = await prisma.comprobante.findMany({
          where: {
            tipoDocumentoId: tipoId,
            numero: { in: Array.from(numeros) }
          },
          select: { numero: true }
        });
        usados.forEach((c: any) => {
          comprobantesExistentesSet.add(`${tipoId}-${c.numero}`);
        });
      }
    }

    // 3. Evaluar filas y calcular totales
    for (let i = 2; i <= MAX_FILAS_PREVIEW; i++) {
      const row = worksheet.getRow(i);
      const rowData: Record<string, any> = {};
      
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1] || `Columna ${colNumber}`;
        rowData[header] = cell.value;
      });

      const getVal = (erpField: string) => {
        const fileColName = reverseMap[erpField];
        if (!fileColName) return null;
        let val = rowData[fileColName];
        if (val instanceof Date) return val.toLocaleDateString();
        if (typeof val === 'object' && val !== null && val.result) return val.result;
        if (typeof val === 'object' && val !== null && val.text) return val.text;
        return val ? val.toString().trim() : null;
      };

      const cuentaVal = getVal('cuenta_codigo');
      const terceroVal = getVal('tercero_documento');
      const centroVal = getVal('centro_costo_codigo');
      const tipoDocVal = getVal('tipo_documento')?.toUpperCase() || req.body.config?.comprobante?.toUpperCase() || 'CC';
      const numDocStr = getVal('numero_documento');

      const debitoVal = parseFloat(getVal('debito')) || 0;
      const creditoVal = parseFloat(getVal('credito')) || 0;

      totalDebito += debitoVal;
      totalCredito += creditoVal;

      let estado = 'valido';
      let observacion = '';

      if (!cuentaVal) { 
        estado = 'error'; 
        observacion = 'Cuenta requerida'; 
      } else if (!cuentasValidasSet.has(cuentaVal)) {
        estado = 'error';
        observacion = `La cuenta ${cuentaVal} no existe`;
      } else if (terceroVal && !tercerosValidosSet.has(terceroVal)) {
        estado = 'error';
        observacion = `El tercero ${terceroVal} no existe`;
      } else if (centroVal && !centrosValidosSet.has(centroVal)) {
        estado = 'error';
        observacion = `Centro de Costo ${centroVal} no existe`;
      } else if (!tiposDocMap.has(tipoDocVal)) {
        estado = 'error';
        observacion = `Tipo Documento ${tipoDocVal} no existe`;
      } else if (!numDocStr) {
        estado = 'error';
        observacion = `El número de documento es requerido en el Excel`;
      } else {
        const numDoc = parseInt(numDocStr, 10);
        if (isNaN(numDoc)) {
          estado = 'error';
          observacion = `El número de documento debe ser válido`;
        } else {
          const tipoId = tiposDocMap.get(tipoDocVal);
          if (comprobantesExistentesSet.has(`${tipoId}-${numDoc}`)) {
            estado = 'error';
            observacion = `El documento ${tipoDocVal}-${numDoc} YA EXISTE (usado)`;
          }
        }
      }

      if (estado === 'error') {
        errorRecords++;
      } else {
        validRecords++;
      }

      // Mostrar filas de preview, priorizando mostrar las que tienen error si son pocas, o las primeras
      if (previewRows.length < 50 || estado === 'error') {
        if (previewRows.length < 100) { // límite duro de filas para no saturar memoria del front
          previewRows.push({
            fila: i - 1,
            fecha: getVal('fecha_movimiento'),
            documento: getVal('numero_documento'),
            cuenta: cuentaVal,
            concepto: getVal('concepto'),
            tercero: getVal('tercero_documento'),
            centroCosto: getVal('centro_costo_codigo'),
            debito: debitoVal,
            credito: creditoVal,
            estado: estado,
            observacion: observacion
          });
        }
      }
    }

    return res.status(200).json({
      totalDebito,
      totalCredito,
      diferencia: Math.abs(totalDebito - totalCredito),
      totalRecords: totalFilas,
      validRecords: validRecords,
      warningRecords: 0,
      errorRecords: errorRecords,
      previewRows
    });
  } catch (error) {
    console.error('Error generando vista previa:', error);
    return res.status(500).json({ error: 'Error interno generando vista previa' });
  }
};

import { ImportacionService } from '../../services/contabilidad/importaciones.service';

// ==========================================
// CONFIRMAR E IMPORTAR (IMP-005)
// ==========================================
export const confirmarImportacion = async (req: Request, res: Response): Promise<any> => {
  try {
    const { importacionId, config, mappings } = req.body;
    const tenantPrisma = (req as any).tenantPrisma;
    const usuarioId = req.headers['x-user-id'] as string || 'Administrador';

    if (!mappings || Object.keys(mappings).length === 0) {
      return res.status(400).json({ error: 'No se recibieron los mapeos de columnas' });
    }

    const resultado = await ImportacionService.confirmarImportacion(
      tenantPrisma,
      importacionId,
      config,
      mappings,
      usuarioId
    );

    return res.status(200).json({
      success: true,
      message: 'Importación ejecutada correctamente',
      data: resultado
    });
  } catch (error: any) {
    console.error('Error confirmando importación:', error);
    return res.status(500).json({ error: error.message || 'Error interno ejecutando importación' });
  }
};
