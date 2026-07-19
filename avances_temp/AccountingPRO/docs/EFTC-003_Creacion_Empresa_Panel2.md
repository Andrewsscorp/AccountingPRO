# ESTÁNDAR DE ESPECIFICACIÓN FUNCIONAL Y TÉCNICA (EFTC)

## 1. Información General
- **Código:** EFTC-003
- **Nombre:** CREACIÓN DE EMPRESA (Panel 2: Configuración Contable)
- **Módulo:** Configuración Inicial
- **Submódulo:** Parametrización Contable
- **Versión:** 1.0
- **Estado:** Diseño Funcional

## 2. Objetivo
Permitir definir la estructura contable base de la empresa antes de su creación definitiva (marco normativo, plan de cuentas, moneda, año fiscal, centros de costos, presupuestos y sucursales).

## 3. Diseño de Interfaz
Es el Paso 2 del Asistente de Configuración.
El estado del paso 1 pasa a "Completado" y el paso 2 a "En Progreso".

## 4. Componentes Visuales
- **Marco Normativo:** Obligatorio. (Grupo 2 NIIF Pymes por defecto).
- **Plan de Cuentas:** Obligatorio. (PUC Colombia por defecto).
- **Estructura del Plan de Cuentas:** Obligatoria. Estándar (1-2-2-2-2) o Personalizada.
- **Moneda Principal:** Obligatoria. (COP por defecto).
- **Año Fiscal:** Obligatorio. (Enero - Diciembre).
- **Maneja Centros de Costos:** Sí / No (Inicial: Sí).
- **Maneja Presupuesto:** Sí / No (Inicial: Sí).
- **Maneja Sucursales:** Sí / No (Inicial: No).
- **Botones:** Anterior y Siguiente.

## 5. Eventos de Usuario
- **EV-001 al EV-007:** Cambios en los combos y switches.
- **EV-008:** Click en Anterior (Regresa al paso 1 conservando datos).
- **EV-009:** Click en Siguiente (Valida y guarda temporal, avanza al 3).

## 6. Reglas de Negocio
- RN-001 a RN-003: Todo obligatorio.
- RN-004 a RN-006: Estructura y Moneda no modificables luego de creados movimientos.
- RN-007: Generación automática del catálogo.
- RN-008 a RN-010: Habilitar submódulos según "Sí/No".

## 8. Flujo Funcional
Selección de parámetros -> Validación -> Guardado temporal -> Continuar al paso 3.

## 9. Modelo de Datos
- **Tabla:** `empresas_wizard_contable`
Campos: id, wizard_id, marco_normativo, plan_cuentas, estructura_json, moneda_principal, fecha_inicio_fiscal, fecha_fin_fiscal, maneja_centros_costos, maneja_presupuesto, maneja_sucursales, fecha_registro

## 10. API Backend
- **Endpoint:** POST `/api/empresas/wizard/configuracion-contable`
- **Request:** JSON con `wizard_id`, `marco_normativo`, `plan_cuentas`, `moneda`, `estructura`, banderas booleanas.

## 11. Seguridad y Auditoría
- **Permiso:** EMPRESA_CREAR
- **Auditoría:** CONFIG_CONTABLE_INICIADA, MODIFICADA, GUARDADA.
