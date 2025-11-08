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
