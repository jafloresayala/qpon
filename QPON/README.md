# QPON (Web y Mobile)

## Estado

Este proyecto usa Expo Router para mobile y web.
Para publicarlo en web con buen rendimiento, NO uses `expo start --web` en produccion.

## Desarrollo

```powershell
npm install
npm run web
```

## Build Web Rapido (Produccion)

```powershell
npm run web:build
npm run web:serve
```

- `web:build` genera archivos estaticos optimizados en `dist/`.
- `web:serve` levanta una vista previa local de esos estaticos.

## Backend

El frontend espera el backend FastAPI en `EXPO_PUBLIC_API_URL`.

Ejemplo local:

```powershell
$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"
```

## Deploy recomendado

1. Build web: `npm run web:build`
2. Publicar carpeta `dist/` en Vercel, Netlify o Cloudflare Pages.
3. Backend FastAPI en Render, Fly.io o Railway.
4. Configurar variable `EXPO_PUBLIC_API_URL` apuntando al backend publico.

## Publicar en Vercel (paso a paso)

Esta carpeta ya viene preparada con:

- `vercel.json` (build y output configurados)
- `.vercelignore` (evita subir basura)
- `.env.production.example` (variable publica del backend)

### Opcion A: Desde panel web (recomendada)

1. Sube tu proyecto a GitHub.
2. En Vercel, crea un proyecto nuevo e importa el repositorio.
3. En Root Directory selecciona `QPON`.
4. En Build and Output Settings deja los valores detectados o verifica:
	- Install Command: `npm ci`
	- Build Command: `npm run web:build`
	- Output Directory: `dist`
5. En Environment Variables agrega:
	- `EXPO_PUBLIC_API_URL` = URL publica de tu backend FastAPI.
6. Haz Deploy.
7. Abre la URL generada y prueba login, registro, inventario y crear campana.

### Opcion B: CLI de Vercel

1. Instala CLI global: `npm i -g vercel`
2. Dentro de `QPON` ejecuta: `vercel`
3. Responde:
	- Set up and deploy: `Y`
	- Link to existing project: `N` (o `Y` si ya existe)
	- Project name: el que prefieras
4. Configura variable de entorno:
	- `vercel env add EXPO_PUBLIC_API_URL production`
	- Ingresa la URL publica de backend.
5. Publica en produccion:
	- `vercel --prod`

### Verificacion previa local

1. Copia `.env.production.example` a `.env.production`.
2. Reemplaza `EXPO_PUBLIC_API_URL` por tu backend publico.
3. Ejecuta:
	- `npm run web:build`
	- `npm run web:serve`
4. Abre `http://localhost:4173` y valida flujos principales.

## Optimizaciones incluidas

- Virtualizacion de inventario con `FlatList`.
- Carga diferida del visor 3D con `React.lazy`.
- Scripts de build web de produccion.
