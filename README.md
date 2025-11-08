# Backend — Gestor Local

API para gestionar inventario, préstamos, solicitudes y usuarios con autenticación JWT. Incluye control de stock y roles de acceso.

---

## Características

* Usuarios con roles: `admin`, `encargado`, `invitado`
* Autenticación con JWT
* Inventario (items) con estado virtual (OK/BAJO/CRITICO)
* Préstamos con devolución parcial/total y manejo de stock
* Solicitudes (préstamo/devolución/baja) con flujo de aprobación simple
* CORS configurado para front local (`http://localhost:5173`)
* MongoDB (Mongoose), Express 5, Node 20+

---

## Requisitos

* Node.js 20+
* MongoDB (local o Atlas)

---

## Instalación

1. Copiar variables de entorno:

   ```bash
   cp .env.example .env
   ```
2. Instalar dependencias:

   ```bash
   npm i
   ```
3. Crear usuario administrador (semilla):

   ```bash
   npm run seed
   ```
4. Ejecutar en desarrollo:

   ```bash
   npm run dev
   ```

La API queda en: `http://localhost:${PORT || 3000}/api`

---

## Variables de entorno

| Variable          | Descripción                  | Ejemplo                                  |
| ----------------- | ---------------------------- | ---------------------------------------- |
| `PORT`            | Puerto del servidor          | `3000`                                   |
| `MONGODB_URI`     | Cadena de conexión a MongoDB | `mongodb://localhost:27017/gestor_local` |
| `JWT_SECRET`      | Secreto para firmar tokens   | `cambia-esto`                            |
| `FRONTEND_ORIGIN` | Origen permitido por CORS    | `http://localhost:5173`                  |

---

## Scripts

| Comando        | Descripción                              |
| -------------- | ---------------------------------------- |
| `npm run dev`  | Ejecuta la API en desarrollo (`--watch`) |
| `npm start`    | Ejecuta la API en producción             |
| `npm run seed` | Crea usuario admin por defecto           |

Usuario seed: `admin` — Password: `admin123`

---

## Arquitectura

* **Stack:** Node.js + Express 5 + Mongoose + JWT
* **Capa HTTP:** rutas REST con middlewares de autenticación/roles
* **Datos:** MongoDB con modelos `User`, `Item`, `Loan`, `Request`
* **CORS:** permitido para `FRONTEND_ORIGIN`

```
src/
├─ index.js          # arranque
├─ app.js            # app Express + middlewares + rutas
├─ config.js         # configuración/entorno
├─ db.js             # conexión a Mongo
├─ middlewares/
│  └─ auth.js        # JWT + control de roles
├─ models/
│  ├─ user.model.js
│  ├─ item.model.js
│  ├─ loan.model.js
│  └─ request.model.js
├─ controllers/
│  ├─ auth.controller.js
│  ├─ users.controller.js
│  ├─ items.controller.js
│  ├─ loans.controller.js
│  └─ requests.controller.js
└─ routes/
   ├─ auth.routes.js
   ├─ users.routes.js
   ├─ items.routes.js
   ├─ loans.routes.js
   └─ requests.routes.js
```

---

## Modelos

### User

* `nombre`, `usuario` (único), `email` (único), `passwordHash`
* `rol`: `admin` | `encargado` | `invitado`
* `activo`: boolean

### Item

* `descripcion` (requerido), `categoria`, `cantidad`, `minimo`, `critico`, `responsable`, `observacion`
* **Virtual** `estado`: `CRITICO` (`cantidad ≤ critico`) | `BAJO` (`cantidad ≤ minimo`) | `OK`

### Loan

* `item` (Ref Item), `persona`, `prestado`, `devuelto`, `fechaEntrega`, `fechaVence`, `observacion`
* `estado`: `EN_CURSO` | `VENCIDO` | `COMPLETO` (recalculado dinámicamente)

### Request

* `tipo`: `prestamo` | `devolucion` | `baja`
* `persona`, `item` (Ref Item), `cantidad`, `observacion`
* `estado`: `pendiente` | `aprobada` | `rechazada` | `completa`

---

## Permisos por rol

| Recurso/Acción                    | invitado | encargado | admin |
| --------------------------------- | :------: | :-------: | :---: |
| Login                             |     ✅    |     ✅     |   ✅   |
| Listar Items/Loans/Requests       |     ✅    |     ✅     |   ✅   |
| Crear/Editar Item                 |     ❌    |     ✅     |   ✅   |
| Eliminar Item                     |     ❌    |     ❌     |   ✅   |
| Crear Loan / Registrar devolución |     ❌    |     ✅     |   ✅   |
| Eliminar Loan                     |     ❌    |     ❌     |   ✅   |
| Crear Request                     |     ❌    |     ✅     |   ✅   |
| Cambiar estado Request            |     ❌    |     ✅     |   ✅   |
| ABM Usuarios                      |     ❌    |     ❌     |   ✅   |

---

## Endpoints

### Sistema

* `GET /api/health` → `{ ok, service, ts }`

### Auth

* `POST /api/auth/login`
  Body: `{ "usuario": "admin", "password": "admin123" }`
  Respuesta: `{ "token": "JWT", "user": { ... } }`

### Usuarios (admin)

* `GET /api/users`
* `POST /api/users`
  Body: `{ nombre, usuario, email, password, rol?, activo? }`
* `PUT /api/users/:id`
  Body: `{ nombre?, email?, rol?, activo?, password? }`
* `DELETE /api/users/:id`

### Items

* `GET /api/items` (query opcional `?categoria=...`)
* `GET /api/items/:id`
* `POST /api/items` *(admin/encargado)*
  Body: `{ descripcion, categoria?, cantidad?, minimo?, critico?, responsable?, observacion? }`
* `PUT /api/items/:id` *(admin/encargado)*
* `DELETE /api/items/:id` *(admin)*

### Préstamos

* `GET /api/loans`
* `POST /api/loans` *(admin/encargado)*
  Body: `{ item, persona, prestado, fechaVence, observacion? }`
  Efecto: **descuenta** `prestado` del stock del Item.
* `PATCH /api/loans/:id/return` *(admin/encargado)*
  Body: `{ cantidad, observacion? }`
  Efecto: **suma** `cantidad` al stock del Item.
* `DELETE /api/loans/:id` *(admin)*
  Efecto: **devuelve** al stock lo pendiente (`prestado - devuelto`).

### Solicitudes

* `GET /api/requests` (query opcional `?tipo=...&estado=...`)
* `POST /api/requests` *(admin/encargado)*
  Body: `{ tipo, persona, item, cantidad, observacion? }`
  Nota: no modifica stock automáticamente.
* `PATCH /api/requests/:id/status` *(admin/encargado)*
  Body: `{ estado: "pendiente"|"aprobada"|"rechazada"|"completa" }`
* `DELETE /api/requests/:id` *(admin)*

---

## Regla de negocio y stock

* **Crear préstamo:** descuenta `prestado` de `Item.cantidad`.
* **Devolución:** suma `cantidad` a `Item.cantidad` (límite: pendiente).
* **Eliminar préstamo:** repone al stock lo pendiente.
* **Item.estado** se deriva de `cantidad`, `minimo`, `critico`.
* **Loan.estado** se recalcula:

  * `COMPLETO` si `devuelto ≥ prestado`
  * `VENCIDO` si `hoy > fechaVence` y hay pendiente
  * `EN_CURSO` en otro caso
* **Requests** son un pre-flujo de aprobación; la acción operativa (crear loan, devolver, dar de baja) se ejecuta aparte.

---

## Ejemplos de uso (cURL)

### Health

```bash
curl http://localhost:3000/api/health
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"admin123"}'
```

### Listar items

```bash
curl http://localhost:3000/api/items
```

### Crear item (autenticado)

```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"descripcion":"Multímetro","categoria":"Laboratorio","cantidad":10,"minimo":2,"critico":1}'
```

### Crear préstamo (autenticado)

```bash
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"item":"<ITEM_ID>","persona":"Juan López","prestado":2,"fechaVence":"2025-12-31T23:59:59.000Z"}'
```

### Registrar devolución (autenticado)

```bash
curl -X PATCH http://localhost:3000/api/loans/<LOAN_ID>/return \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"cantidad":1,"observacion":"Devuelto con funda"}'
```

---

## Flujo recomendado

1. **Autenticación:** login, guardar token y datos de usuario.
2. **Inventario:** listar items, crear/editar (según rol), mostrar `estado`.
3. **Préstamos:** crear loan (valida stock), registrar devoluciones, eliminar si procede.
4. **Solicitudes:** crear, aprobar/rechazar, y ejecutar la acción operativa correspondiente.
5. **Usuarios (admin):** alta, edición (incluye cambio de contraseña), baja.

---

## Errores comunes

* `400` Datos inválidos o stock insuficiente
* `401` No autenticado (falta/expiró token)
* `403` Sin permisos para la acción
* `404` Recurso no encontrado
* `409` Conflicto (usuario/email duplicado)

---

## Roadmap

* Validaciones extendidas (Zod/express-validator)
* Paginación, búsqueda y ordenamiento en listados
* Automatización de Requests (ejecutar acción al aprobar)
* Auditoría de cambios (AuditLog)
* Reportes (stock crítico, préstamos vencidos, consumo por categoría)
* Docker y tests (Jest + supertest)


## Cómo consumir desde el frontend (ejemplos)
```js
// login
const r = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ usuario: "admin", password: "admin123" })
});
const { token } = await r.json();

// listar items
const items = await fetch(`${import.meta.env.VITE_API_URL}/items`).then(r => r.json());

// crear item (autenticado)
await fetch(`${import.meta.env.VITE_API_URL}/items`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
  body: JSON.stringify({ descripcion: "Multímetro", categoria: "Laboratorio", cantidad: 10, minimo: 2, critico: 1 })
});
```
