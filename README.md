# Sistema de Gestión Logística de Transferencias de Inventario — Backend

## Descripción

Sistema backend que expone una API REST para digitalizar y gestionar el ciclo completo de transferencias de inventario entre almacenes y tiendas. Resuelve la falta de trazabilidad durante el proceso de tranferir productos.

## Objetivo general

Desarrollar una API REST modular y segura con NestJS que gestione el ciclo completo de transferencias de inventario, con autenticación por roles, seguimiento GPS, verificación por código QR y notificaciones push.

## Objetivos específicos 

- Implementar autenticación JWT con control de acceso basado en roles (Admin, Transportista, Encargado Almacén Origen, Encargado Almacén Destino).
- Desarrollar los endpoints CRUD del módulo de transferencias con validación de estados y transiciones permitidas.
- Integrar el registro y consulta de coordenadas GPS para el seguimiento en tiempo real del transportista durante el tránsito.
- Generar y validar códigos QR asociados a cada transferencia para la verificación de carga en origen y recepción en destino.
- Implementar el envío de notificaciones push mediante Firebase Cloud Messaging a los actores involucrados en cada etapa.
- Persistir todos los datos en MySQL garantizando integridad referencial entre transferencias, productos, usuarios y registros de ubicación.

## Alcance (qué incluye / qué NO incluye)

**Incluye:**
- Módulo de Autenticación y Roles (login diferenciado por perfil, JWT, guards)
- Módulo de Gestión de Transferencias (CRUD, ciclo de estados)
- Módulo de Asignación de Camion (consulta y selección de vehículos disponibles)
- Módulo de Seguimiento GPS 
- Módulo de Verificación QR 
- Módulo de Notificaciones Push 

**No incluye (por ahora):**
- Geocercas automáticas para detección de llegada/salida
- Integración con sistemas ERP externos

## Stack tecnológico

- Backend: NestJS + TypeScript
- Base de datos: MySQL
- ORM: TypeORM
- Autenticación: JWT (Passport + jsonwebtoken)
- Notificaciones push: Firebase Admin SDK (FCM)
- Códigos QR: qrcode (generación) + jsqr (validación)
- Control de versiones: Git + GitHub
- Testing: Postman

## Arquitectura (resumen simple)

```
Cliente Web (React) ─────┐
                         ├──▶  API REST NestJS  ──▶  MySQL
Cliente Móvil (Flutter) ─┘          │
                                     └──▶  Firebase Cloud Messaging
```

Cada módulo sigue el patrón de capas de NestJS: **Controller** (recibe la petición) → **Service** (aplica la lógica de negocio) → **Repository / TypeORM** (lee o escribe en MySQL).

## Endpoints core (prefijo `api/v1`)

### Autenticación
- `POST /auth/login` — inicia sesión y devuelve un JWT

### Transferencias
- `POST /transfers` — crea una nueva transferencia (valida stock de origen)
- `GET /transfers` — lista transferencias (filtradas según el rol)
- `PATCH /transfers/:id` — actualiza una transferencia
- `PATCH /transfers/:id/assign` — asigna vehículo y conductor
- `PATCH /transfers/:id/start-preparation` — inicia preparación (encargado origen)
- `PATCH /transfers/:id/start-transit` — inicia tránsito (requiere QR verificado)
- `PATCH /transfers/:id/arrive-destination` — marca llegada (transportista asignado)
- `PATCH /transfers/:id/complete` — confirma recepción con cantidades recibidas; registra discrepancias y actualiza inventario de origen y destino
- `PATCH /transfers/:id/cancel` — cancela con razón
- `DELETE /transfers/:id` — elimina (solo pendientes/canceladas)

### Verificación QR
- `GET /transfers/:id/qr` — genera/devuelve el QR firmado (HMAC) de la transferencia
- `POST /transfers/:id/verify-qr` — valida el QR escaneado en origen o destino (en destino NO completa: la recepción se confirma con `/complete`)

### Seguimiento GPS
- `POST /transfers/:id/tracking` — registra coordenada GPS (solo transportista asignado, en tránsito)
- `GET /transfers/:id/tracking` — historial de tracking
- `GET /transfers/:id/tracking/latest` — última ubicación

### Inventario
- `GET /warehouses/:id/inventory` — stock por almacén
- `PATCH /warehouses/:id/inventory` — ajuste manual de stock (admin, deja movimiento AJUSTE)

## Cómo ejecutar el proyecto (local)

1. Clonar repositorio
```bash
git clone https://github.com/1119alex/proyecto-especialidad.git
cd backend
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con los valores correspondientes
```

4. Ejecutar migraciones
```bash
npm run migration:run
```

5. Iniciar el servidor
```bash
npm run start:dev
# Disponible en http://localhost:3000
```

## Variables de entorno (ejemplo)

```env
PORT=3000

# PostgreSQL (en Railway se usa DATABASE_URL automáticamente)
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=inventory_transfer
DB_USERNAME=postgres
DB_PASSWORD=secret

JWT_SECRET=cambiar_por_clave_segura
JWT_EXPIRES_IN=8h

# Firma HMAC de los códigos QR (si no se define se usa JWT_SECRET)
QR_SECRET=cambiar_por_otra_clave

# Orígenes permitidos en producción (separados por coma)
CORS_ORIGIN=https://tu-frontend.vercel.app

FIREBASE_PROJECT_ID=tu_proyecto_firebase
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tu_proyecto.iam.gserviceaccount.com
```

## Equipo y roles

- Alexander Mamani: Backend + Frontend Web + Mobile
