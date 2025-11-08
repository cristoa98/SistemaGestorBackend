# Backend básico — Gestor Local

✅ **Incluye**: Usuarios (con roles), Inventario (items), Préstamos (con devolución), Solicitudes, Auth con JWT, CORS y MongoDB.

## Requisitos
- Node 20+
- MongoDB local (o Atlas).

## Pasos
1) Clonar carpeta y crear `.env` desde `.env.example`:
```
cp .env.example .env
```
2) Instalar deps:
```
npm i
```
3) Crear usuario admin:
```
npm run seed
```
4) Ejecutar:
```
npm run dev
```
API en `http://localhost:${PORT || 3000}`.

## Endpoints principales
- `GET /api/health`
- **Auth**
  - `POST /api/auth/login` `{ usuario, password }`
- **Usuarios** (admin)
  - `GET /api/users`
  - `POST /api/users`
  - `PUT /api/users/:id`
  - `DELETE /api/users/:id`
- **Items**
  - `GET /api/items`
  - `GET /api/items/:id`
  - `POST /api/items` (admin/encargado)
  - `PUT /api/items/:id` (admin/encargado)
  - `DELETE /api/items/:id` (admin)
- **Préstamos**
  - `GET /api/loans`
  - `POST /api/loans` (admin/encargado) — descuenta stock
  - `PATCH /api/loans/:id/return` (admin/encargado) — suma stock
  - `DELETE /api/loans/:id` (admin) — revierte stock pendiente
- **Solicitudes**
  - `GET /api/requests`
  - `POST /api/requests` (admin/encargado)
  - `PATCH /api/requests/:id/status` (admin/encargado)
  - `DELETE /api/requests/:id` (admin)

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

---

# 1) Visión general

* **Dominio**: Inventario (items) ↔ Préstamos (loans) ↔ Solicitudes (requests) ↔ Usuarios y Auth.
* **Objetivo**: Controlar stock, prestar/recibir materiales, y permitir flujos de aprobación simples.

**Roles** (según backend actual):

* **invitado**: solo lectura (items, loans, requests).
* **encargado**: CRUD parcial (items), crear préstamos, registrar devoluciones, crear solicitudes y cambiar su estado.
* **admin**: todo (incluye gestión de usuarios).

---

# 2) Modelo de datos y relaciones

```
User
 ├─ nombre, usuario, email, passwordHash
 └─ rol: admin|encargado|invitado

Item
 ├─ descripcion, categoria, cantidad, minimo, critico, responsable, observacion
 └─ estado (virtual): CRITICO (≤critico) | BAJO (≤minimo) | OK

Loan
 ├─ item (ref Item), persona, prestado, devuelto, fechaEntrega, fechaVence, observacion
 └─ estado: EN_CURSO | VENCIDO | COMPLETO

Request
 ├─ tipo: prestamo | devolucion | baja
 ├─ persona, item (ref Item), cantidad, observacion
 └─ estado: pendiente | aprobada | rechazada | completa
```

**Relaciones clave**

* **Item 1–N Loan** (un item puede tener muchos préstamos).
* **Item 1–N Request** (un item puede tener muchas solicitudes).
* **User** hoy no se referencia en los demás (mínimo viable). En mejoras futuras se puede agregar `createdBy/approvedBy`.

---

# 3) Reglas de negocio (estado y stock)

### 3.1 Items (estado virtual)

* `CRITICO` si `cantidad ≤ critico`
* `BAJO` si `cantidad ≤ minimo` (y > critico)
* `OK` en otro caso

### 3.2 Loans (estado dinámico)

* `COMPLETO` si `devuelto ≥ prestado`
* `VENCIDO` si `hoy > fechaVence` y aún hay pendiente (`prestado - devuelto > 0`)
* `EN_CURSO` en otro caso

> El backend recalcula y corrige el estado automáticamente al listar/actualizar.

**Impacto en stock**

* Crear préstamo: **resta** `prestado` de `Item.cantidad` (si no alcanza → 400).
* Registrar devolución: **suma** `cantidad devuelta` a `Item.cantidad`.
* Eliminar préstamo: **revierte** stock pendiente (lo no devuelto vuelve a `Item.cantidad`).

### 3.3 Requests (aprobación simple)

* Estados: `pendiente → aprobada|rechazada → completa`
* **Backend actual**: la solicitud **no** mueve stock por sí sola (es un **pre-flujo**).

  * Si apruebas una **Request de tipo `prestamo`**, operativamente debes **crear el Loan**.
  * Si apruebas una **Request de `devolucion`**, operativamente debes **hacer PATCH /loans/:id/return**.
  * Si apruebas una **Request de `baja`**, operativamente debes **restar stock al Item**.
* Esto deja la orquestación al front (mínimo viable, sin automatismos peligrosos).

---

# 4) Matriz de permisos (resumen)

| Recurso/Acción                    | invitado | encargado | admin |
| --------------------------------- | :------: | :-------: | :---: |
| Login (POST /auth/login)          |     ✅    |     ✅     |   ✅   |
| Listar Items/Loans/Requests       |     ✅    |     ✅     |   ✅   |
| Crear/Editar/Eliminar Item        |     ❌    |     ✅*    |   ✅   |
| Crear Loan / Registrar devolución |     ❌    |     ✅     |   ✅   |
| Eliminar Loan                     |     ❌    |     ❌     |   ✅   |
| Crear Request                     |     ❌    |     ✅     |   ✅   |
| Cambiar estado Request            |     ❌    |     ✅     |   ✅   |
| ABM Usuarios                      |     ❌    |     ❌     |   ✅   |

* Encargado puede **crear/editar** items; **eliminar** solo admin.

---

# 5) Flujos operativos (paso a paso)

## 5.1 Autenticación

1. Front envía `POST /api/auth/login` con `{ usuario, password }`.
2. Backend retorna `{ token, user }`.
3. El front guarda el **JWT** y lo envía en `Authorization: Bearer <token>` para acciones protegidas.
4. En UI: mostrar/ocultar botones según `user.rol`.

---

## 5.2 Gestión de Inventario

**Alta de item (admin/encargado):**

1. `POST /api/items` con `{ descripcion, categoria, cantidad, minimo, critico, ... }`
2. UI vuelve a listar `GET /api/items`.

**Edición (admin/encargado):**

1. `PUT /api/items/:id` con campos a actualizar.

**Baja manual (admin)** (si no usas Requests):

1. `PUT /api/items/:id` ajustando `cantidad` hacia abajo.

**Visual de stock:**

* El front usa `item.estado` para pintar: **OK/BAJO/CRITICO**.

---

## 5.3 Préstamo (creación)

1. Usuario (encargado/admin) elige un `Item` con stock suficiente.
2. `POST /api/loans` con `{ item, persona, prestado, fechaVence, observacion }`.
3. Backend valida stock y **descuenta** `prestado` de `Item.cantidad`.
4. UI actualiza lista de préstamos e inventario.

**Errores comunes**:

* Stock insuficiente → 400.
* `item` inexistente → 404.

---

## 5.4 Devolución (parcial o total)

1. `PATCH /api/loans/:id/return` con `{ cantidad, observacion }` (si omites cantidad, se asume 0).
2. Backend:

   * Suma a `devuelto` (hasta lo pendiente).
   * **Restaura al stock** del Item la cantidad devuelta.
   * Recalcula el estado del préstamo.
3. UI refresca Loans e Items.

---

## 5.5 Cancelar/Eliminar un préstamo (solo admin)

1. `DELETE /api/loans/:id`
2. Backend:

   * Calcula pendiente = `prestado - devuelto`.
   * Si hay pendiente, **lo devuelve a stock**.
   * Borra el Loan.
3. UI refresca Loans e Items.

---

## 5.6 Solicitudes (flujo de aprobación simple)

**Crear solicitud (encargado/admin):**

1. `POST /api/requests` con `{ tipo, persona, item, cantidad, observacion }` → queda en `pendiente`.

**Revisar y aprobar/rechazar (encargado/admin):**

1. `PATCH /api/requests/:id/status` con `{ estado: "aprobada"|"rechazada"|"completa" }`.

**Acción operativa posterior (hecha hoy desde el front):**

* Si `tipo = "prestamo"` y `aprobada` → **crear Loan** con los datos acordados.
* Si `tipo = "devolucion"` y `aprobada` → **PATCH /loans/:id/return** por la `cantidad`.
* Si `tipo = "baja"` y `aprobada` → **PUT /items/:id** restando `cantidad`.

**Marcar `completa`:**
Cuando la acción real se ejecutó (Loan creado, devolución aplicada, stock ajustado), puedes marcar la Request como `completa`.

> Nota: Si quisieras automatizar estas consecuencias dentro del backend (al aprobar), podemos agregar un **service** que, según el `tipo`, ejecute la operación y actualice la Request a `completa` de forma transaccional.

---

## 5.7 Gestión de usuarios (solo admin)

* **Listar**: `GET /api/users`
* **Crear**: `POST /api/users` con `{ nombre, usuario, email, password, rol, activo }`

  * Valida conflicto (409) por `usuario/email`.
* **Actualizar**: `PUT /api/users/:id` (si envías `password`, se re-hashéa).
* **Eliminar**: `DELETE /api/users/:id`

---

# 6) Casos de uso típicos

1. **Entrega de equipos a un alumno**

   * Encargado crea **Request (prestamo)** → Admin/Encargado **aprueba** → se **crea Loan** → stock baja.

2. **Devolución parcial**

   * Encargado registra `PATCH /loans/:id/return { cantidad: X }` → stock sube X → Loan puede quedar EN_CURSO/VENCIDO/COMPLETO.

3. **Reposición y control de stock**

   * Se edita el Item para subir la `cantidad`. La UI muestra `estado` OK/BAJO/CRITICO para priorizar compras.

4. **Baja por daño**

   * Request `tipo=baja` → aprobar → ajustar `Item.cantidad` en PUT.

5. **Préstamo vencido**

   * Un Loan con pendiente y `fechaVence` pasada aparece `VENCIDO`. La UI puede filtrar y notificar.

6. **Alta de nuevo personal**

   * Admin crea usuario con rol correspondiente (p. ej., encargado para bodega).

---

# 7) “Cómo debe usarse” desde el front (patrón general)

* **Config**: `VITE_API_URL=http://localhost:3000/api`

* **Auth**: Hacer login una vez; guardar `{ token, user }`.

* **Headers protegidos**:

  ```js
  const headers = token
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    : { "Content-Type": "application/json" };
  ```

* **Control de UI por rol**:

  * Si `user.rol === "invitado"`: oculta acciones de mutación.
  * Si `encargado`: muestra crear/editar items, crear loans, devoluciones, requests, cambiar estado de requests.
  * Si `admin`: todo.

* **Secuencia de pantalla**:

  * Inventario: `GET /items` (filtros por `categoria` si quieres).
  * Crear préstamo: formulario → `POST /loans` → notifica stock restante.
  * Devolución: modal en loan → `PATCH /loans/:id/return`.
  * Solicitudes: tablero Kanban por `estado` (pendiente/aprobada/rechazada/completa) y botón “Ejecutar acción” que llama al endpoint operativo correspondiente.
  * Usuarios (solo admin): grid con ABM completo.

---

# 8) Edge cases y decisiones ya resueltas

* **Integridad de stock**:

  * Prestamos descuentan; devoluciones/elim. préstamo reponen.
  * El backend limita la devolución a lo pendiente (no se puede devolver más de lo prestado).

* **Estados calculados**:

  * Loans se recalculan para mantener `VENCIDO`/`COMPLETO` coherente.

* **Errores comunes**:

  * 400: datos inválidos (falta item/persona/fechaVence, stock insuficiente…).
  * 401: sin token.
  * 403: sin rol suficiente.
  * 404: id inexistente.
  * 409: usuario/email duplicado.

* **Requests no ejecutan stock automáticamente** (MVP seguro). Te evita “doble descuento” por error del front.

---

# 9) Mejoras sugeridas (cuando quieras)

* **Automatizar Requests**: al aprobar, que el backend cree Loan/ajuste stock y marque `completa`.
* **Trazabilidad**: `createdBy/updatedBy`, `approvalBy`, e historial en `AuditLog`.
* **Paginación y búsqueda** en `GET /items`, `GET /loans`, `GET /requests`.
* **Reportes**: agregaciones (stock crítico, vencidos por rango, consumo por categoría).
* **Validación** con Zod/express-validator.
* **Docker** y **tests** (Jest + supertest).

---
