# QPON Backend

Backend inicial para la plataforma de empresas, QR y recompensas.

## Incluye en esta primera base

- Registro y login con roles `user` y `company`
- Creacion automatica de empresa para cuentas empresariales
- Catalogo base de productos para suscripcion
- Campanas QR con limite total de redenciones
- Redencion unica por usuario
- Inventario de descuentos y mascotas con expiracion opcional
- Progreso por empresa para preparar batallas en una fase posterior

## Arranque local

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Variables de entorno opcionales

- `QPON_DATABASE_URL`: por defecto usa SQLite local en `backend/qpon.db`
- `QPON_JWT_SECRET`: secreto JWT para desarrollo
- `QPON_TOKEN_TTL_MINUTES`: duracion del token de acceso

## Endpoints iniciales

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `GET /products`
- `GET /companies`
- `POST /companies/{company_id}/subscriptions/mock-activate`
- `POST /companies/{company_id}/campaigns`
- `POST /redeem`
- `GET /inventory`
