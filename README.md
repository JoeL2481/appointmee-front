# AppointMee Frontend

Frontend de AppointMee migrado a Angular 22. El backend Spring Boot se mantiene en el repositorio separado `AppointMee`.

## Requisitos

- Node.js compatible con Angular 22
- npm 11
- Backend disponible en `http://localhost:8080`

## Desarrollo

```bash
npm ci
npm start
```

La aplicación queda disponible en `http://localhost:4200`. `proxy.conf.json` reenvía al backend las rutas `/usuarios`, `/sucursales`, `/servicios`, `/turnos`, `/solicitudes-empleador`, `/solicitudes-empleado` y `/pagos`.

## Verificación

```bash
npm test -- --watch=false
npm run build
```

## Arquitectura

```text
src/app/
├── common/       # Guards e interceptores
├── components/   # Componentes visuales reutilizables
├── models/       # Contratos TypeScript de la API
├── pages/        # Componentes lazy que representan rutas
├── services/     # Estado, almacenamiento y acceso HTTP
├── app.config.ts
└── app.routes.ts
```

La aplicación utiliza componentes standalone, Signals, formularios reactivos, rutas lazy, `HttpClient`, interceptores funcionales, guardas por rol y detección de cambios `OnPush`.

## Compatibilidad

- Se conserva el token JWT bajo `localStorage["token"]`.
- Los requests mantienen las rutas, payloads y enums del backend existente.
- La API se consume en el mismo origen en producción.
- No se incorporaron librerías de UI.

## Integración pendiente del backend

Para desplegar la SPA, Spring o el proxy de producción debe servir el build Angular y redirigir las rutas que no sean API a `index.html`. También permanecen bloqueos del backend existente en recuperación de cuenta, eliminación de servicios, IDs de categorías y respuesta de creación de turnos.
