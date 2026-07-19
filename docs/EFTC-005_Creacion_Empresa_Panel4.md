# ESTÁNDAR DE ESPECIFICACIÓN FUNCIONAL Y TÉCNICA (EFTC)

## 1. Información General
- **Código:** EFTC-005
- **Nombre:** CREACIÓN DE EMPRESA (Panel 4: Resumen y Creación Definitiva)
- **Módulo:** Configuración Inicial
- **Submódulo:** Resumen de Configuración
- **Versión:** 1.0
- **Estado:** Diseño Funcional

## 2. Objetivo
Permitir al usuario revisar toda la información registrada durante el asistente de creación de empresa antes de ejecutar la creación definitiva de la base empresarial.

## 3. Diseño de Interfaz
Es el Paso 4 del Asistente de Configuración.

## 4. Componentes Visuales
- **Panel Información General:** Mostrar datos registrados en Panel 1 (Solo lectura).
- **Panel Configuración Contable:** Mostrar datos registrados en Panel 2 (Solo lectura).
- **Panel Parámetros Fiscales:** Mostrar datos registrados en Panel 3 (Solo lectura).
- **Panel Logotipo:** Opcional. Permite arrastrar o seleccionar archivo (PNG, JPG, SVG). Max 10MB.
- **Vista Previa:** Simulación visual del encabezado empresarial.
- **Lista de Verificación:** Indicadores de estado completado.
- **Botones:** Anterior y Finalizar y Crear Empresa.

## 5. Eventos de Usuario
- **EV-001 al EV-004:** Cargar/eliminar logo.
- **EV-005:** Click en Anterior (Regresa al paso 3).
- **EV-006:** Click en Finalizar y Crear Empresa (Valida, crea en BD y redirige).

## 6. Reglas de Negocio
- RN-001: La creación será irreversible en estructura base.
- RN-008: Empresa inicia en estado ACTIVA.

## 8. Flujo Funcional
Consolidación de resumen -> Carga opcional de logo -> Confirmación -> Creación en Backend -> Redirección a lista de empresas.

## 11. Procesos Backend
Transacción que incluye la inserción en tablas: empresas, configuracion_contable, configuracion_fiscal, catalogos, etc.

## 13. API Backend
- **Endpoint:** POST `/api/empresas/crear`
