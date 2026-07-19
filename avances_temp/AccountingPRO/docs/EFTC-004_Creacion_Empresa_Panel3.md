# ESTÁNDAR DE ESPECIFICACIÓN FUNCIONAL Y TÉCNICA (EFTC)

## 1. Información General
- **Código:** EFTC-004
- **Nombre:** CREACIÓN DE EMPRESA (Panel 3: Parámetros Fiscales)
- **Módulo:** Configuración Inicial
- **Submódulo:** Parametrización Fiscal y Tributaria
- **Versión:** 1.0
- **Estado:** Diseño Funcional

## 2. Objetivo
Permitir configurar los parámetros tributarios que determinarán el comportamiento fiscal de la empresa dentro del sistema.

## 3. Diseño de Interfaz
Es el Paso 3 del Asistente de Configuración.
El estado del paso 1 y 2 pasa a "Completado" y el paso 3 a "En Progreso".

## 4. Componentes Visuales
- **Responsabilidades Tributarias:** Obligatorio. (Selección múltiple).
- **Régimen Tributario:** Obligatorio. (Ordinario, Régimen Simple, etc.).
- **Actividad Económica Principal (CIIU):** Obligatorio. (Lista desplegable).
- **Obligado a Facturar Electrónicamente:** Radio (Sí / No, inicial Sí).
- **Correo Tributario:** Obligatorio. Texto (email).
- **Correo Recepción Facturas Electrónicas:** Obligatorio. Texto (email).
- **Maneja Retención en la Fuente:** Radio (Sí / No, inicial Sí).
- **Maneja Retención ICA:** Radio (Sí / No, inicial Sí).
- **Botones:** Anterior y Siguiente.

## 5. Eventos de Usuario
- **EV-001 al EV-006:** Selección de valores en los campos.
- **EV-007:** Click en Anterior (Regresa al paso 2 conservando datos).
- **EV-008:** Click en Siguiente (Valida, guarda temporal, avanza al 4).

## 6. Reglas de Negocio
- RN-001 a RN-005: Todo obligatorio.
- RN-006 a RN-008: Habilitar submódulos según respuestas.

## 8. Flujo Funcional
Selección de parámetros -> Validación -> Guardado temporal -> Continuar al paso 4.

## 9. Modelo de Datos
- **Tabla:** `empresas_wizard_fiscal`
Campos: id, wizard_id, responsabilidades_json, regimen_tributario, actividad_ciiu, facturacion_electronica, correo_tributario, correo_recepcion, retencion_fuente, retencion_ica, fecha_registro

## 10. API Backend
- **Endpoint:** POST `/api/empresas/wizard/parametros-fiscales`

## 11. Seguridad y Auditoría
- **Permiso:** EMPRESA_CREAR
- **Auditoría:** PARAMETROS_FISCALES_INICIADOS, MODIFICADOS, GUARDADOS.
