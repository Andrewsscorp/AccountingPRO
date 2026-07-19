# ESTÁNDAR DE ESPECIFICACIÓN FUNCIONAL Y TÉCNICA (EFTC)

## 1. Información General
- **Código:** EFTC-001
- **Nombre:** Inicio de Sesión
- **Módulo:** Seguridad
- **Versión:** 1.0
- **Estado:** Diseño / Desarrollo

## 2. Objetivo
Descripción funcional del propósito de la ventana o proceso.
- **¿Para qué existe?:** Para autenticar a los usuarios legítimos del sistema contable.
- **¿Qué problema resuelve?:** Protege la información financiera evitando el acceso no autorizado.
- **¿Quién la utiliza?:** Todos los usuarios del sistema (Administrador, Contador, Auxiliar Contable, Tesorería, Auditor).

## 3. Diseño de Interfaz
- **Distribución de componentes:** Tarjeta centrada en pantalla con fondo claro. Logo y título en la parte superior. Formulario de credenciales en el centro. Botón de ingreso en la parte inferior. Pie de página con versión y copyright.
- **Orden visual:** Logo -> Título -> Usuario -> Contraseña -> Botón Ingresar.
- **Comportamiento responsive:** La tarjeta se adapta al ancho de dispositivos móviles manteniendo márgenes.
- **Diseño de formularios:** Campos con bordes suaves, iconos a la derecha.

## 4. Componentes Visuales
- **Campo Usuario:**
  - Tipo: Texto
  - Longitud: 50 caracteres
  - Obligatorio: Sí
- **Campo Contraseña:**
  - Tipo: Password
  - Longitud: 100 caracteres
  - Obligatorio: Sí
- **Botón Ingresar:**
  - Acción: Validar credenciales.

## 5. Eventos de Usuario
- **EV-001:** Click en Ingresar.
- **EV-002:** Presionar Enter.
- **EV-003:** Presionar CTRL+A.

## 6. Reglas de Negocio
- **RN-001:** El usuario debe estar activo.
- **RN-002:** El usuario debe tener al menos un rol asignado.
- **RN-003:** El usuario debe estar asociado a una empresa.

## 7. Validaciones
- **VAL-001:** Usuario obligatorio.
- **VAL-002:** Contraseña obligatoria.
- **VAL-003:** Credenciales válidas.

## 8. Flujo Funcional
Usuario ingresa credenciales ↓ Sistema valida usuario ↓ Sistema valida contraseña ↓ Sistema valida estado ↓ Sistema obtiene empresas ↓ Dashboard o Selección de Empresa

## 9. Modelo de Datos
- **Tabla usuarios:** id, usuario, nombre, email, password_hash, activo, fecha_creacion, ultimo_acceso
- **Tabla roles:** id, nombre, descripcion
- **Tabla usuarios_roles:** usuario_id, rol_id, empresa_id
- **Tabla sesiones:** id, usuario_id, token, fecha_inicio, fecha_expiracion, ip, dispositivo

## 10. API Backend
- **Endpoint:** POST `/api/auth/login`
- **Request:** `{"usuario": "ADMIN", "password": "********"}`
- **Response:** `{"token": "...", "usuario": {}, "empresas": []}`

## 11. Seguridad
- JWT, Refresh Token, Hash BCrypt, Sesiones activas, Bloqueo por intentos fallidos, Validación de permisos.

## 12. Auditoría
- **AUD-001:** Inicio de sesión exitoso.
- **AUD-002:** Intento fallido.
- **AUD-003:** Bloqueo de usuario.
- Información registrada: Usuario, Fecha, Hora, Dirección IP, Equipo, Acción, Resultado.

## 13. Casos de Error
- **ERR-001:** Usuario inexistente.
- **ERR-002:** Contraseña incorrecta.
- **ERR-003:** Usuario bloqueado.
- **ERR-004:** Error interno del servidor.

## 14. Criterios de Aceptación
- **CA-001:** Usuario válido puede ingresar.
- **CA-002:** Usuario inválido recibe mensaje.
- **CA-003:** Usuario con varias empresas visualiza selector.

## 15. Consideraciones Técnicas
- React + TypeScript, FastAPI, PostgreSQL.
