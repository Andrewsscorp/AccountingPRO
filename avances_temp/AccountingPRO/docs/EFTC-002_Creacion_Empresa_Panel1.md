# ESTÁNDAR DE ESPECIFICACIÓN FUNCIONAL Y TÉCNICA (EFTC)

## 1. Información General
- **Código:** EFTC-002
- **Nombre:** CREACIÓN DE EMPRESA (Panel 1: Información General)
- **Módulo:** Configuración Inicial
- **Submódulo:** Administración de Empresas
- **Versión:** 1.0
- **Estado:** Diseño Funcional

## 2. Objetivo
Permitir registrar una nueva empresa dentro del sistema.
Este será el primer paso obligatorio del asistente de creación de empresa y tendrá como finalidad capturar la información legal, tributaria y de contacto necesaria para la parametrización inicial del sistema.

## 3. Diseño de Interfaz
Asistente de configuración (Wizard) en cuatro pasos:
1. Información General
2. Configuración Contable
3. Parámetros Fiscales
4. Resumen y Creación
El usuario no podrá acceder a los pasos posteriores hasta completar correctamente la información obligatoria del paso actual.

## 4. Componentes Visuales
- **Razón Social:** Obligatorio. Texto. Max 200.
- **Nombre Comercial:** Opcional. Texto. Max 200.
- **NIT:** Obligatorio. Numérico. Max 20.
- **Dígito de Verificación (DV):** Calculado automáticamente. No editable.
- **Tipo de Persona:** Lista (Persona Natural, Persona Jurídica).
- **Régimen Fiscal:** Lista (Régimen Ordinario, Régimen Simple, etc.).
- **Dirección:** Obligatorio.
- **Ciudad:** Lista (de municipio).
- **Departamento:** Lista (dependiente de ciudad).
- **País:** Valor inicial "Colombia". Editable.
- **Teléfono, Correo Electrónico (validado), Sitio Web:** Opcionales.
- **Representante Legal, Documento Representante:** Obligatorios.

## 5. Eventos de Usuario
- **EV-001:** Digitar NIT -> Calcular DV.
- **EV-002:** Seleccionar Tipo de Persona -> Actualizar validaciones.
- **EV-003:** Seleccionar Ciudad -> Asignar departamento.
- **EV-004:** Botón Siguiente -> Validar formulario y guardar borrador.
- **EV-005:** Botón Cancelar -> Cerrar asistente.

## 6. Reglas de Negocio
- RN-001: NIT único.
- RN-002 a RN-004: Campos obligatorios y DV automático.
- RN-005: Empresa asociada al usuario creador.
- RN-006: Estado inicial ACTIVA (al crearse en paso 4).

## 8. Proceso Interno Backend
Al pulsar Siguiente NO se crea la empresa. Queda almacenada temporalmente en sesión (BORRADOR).

## 9. Modelo de Datos
- **Tabla empresas:** id, nit, dv, razon_social, nombre_comercial, tipo_persona, regimen_fiscal, direccion, ciudad_id, departamento_id, pais_id, telefono, correo, sitio_web, representante_legal, documento_representante, estado, fecha_creacion, usuario_creacion

## 10. API Backend
- **Endpoint:** POST `/api/empresas/wizard/general`
- **Response:** `{"wizard_id": "uuid"}`

## 11. Seguridad y Auditoría
- **Permiso:** EMPRESA_CREAR
- **Auditoría:** EMPRESA_WIZARD_INICIADO, EMPRESA_DATOS_GENERALES_GUARDADOS, EMPRESA_CREACION_CANCELADA.
