# El sabor de Yeli · Sistema de caja (GitHub + Vercel)

Varios usuarios, varios equipos, **los mismos datos** a través del servidor de Vercel.

```
yeli-caja/
├── index.html     ← la aplicación (pantalla)
├── sw.js          ← service worker (abre la app rápido; NUNCA guarda datos)
├── package.json   ← dependencia: @upstash/redis
├── vercel.json
├── api/
│   ├── login.js   ← valida usuario y contraseña, entrega la sesión
│   └── state.js   ← lee y guarda los datos según el rol
└── lib/
    ├── crypto.js  ← contraseñas cifradas y firma de sesión
    ├── db.js      ← conexión a la base de datos y datos iniciales
    ├── auth.js    ← verifica sesión y si el usuario está bloqueado
    └── seed.js    ← menú inicial
```

## Paso 1 · GitHub
1. Crea un repositorio en https://github.com (ej. `yeli-caja`).
2. Sube **todo el contenido de esta carpeta** (con las carpetas `api` y `lib`). Opción **uploading an existing file**.

## Paso 2 · Vercel
1. En https://vercel.com entra con GitHub → **Add New → Project** → elige el repositorio.
2. Framework Preset: **Other**. Pulsa **Deploy** (la primera vez aún no funcionará el login; falta el paso 3).

## Paso 3 · Base de datos (dentro de Vercel, gratis)
1. En tu proyecto: pestaña **Storage → Create Database → Upstash (Redis)** → plan gratuito → **Connect Project**.
   Vercel agrega solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
2. **Settings → Environment Variables** → agrega:
   - `AUTH_SECRET` = una frase larga al azar (mínimo 32 caracteres). **Obligatoria.**
   - `OWNER_PASSWORD` = contraseña inicial del presidente (opcional; si no, será `dueno123`).
3. **Deployments → ⋯ → Redeploy** para que tome las variables.

## Paso 4 · Primer ingreso
La primera vez que alguien entra se crean estos usuarios:

| Usuario | Contraseña | Rol |
|---|---|---|
| presidente | `OWNER_PASSWORD` o `dueno123` | Presidente |
| admin | admin123 | Administrador |
| vendedor | vende123 | Vendedor |

Entra como `presidente` → **Usuarios** y cambia las contraseñas. Las contraseñas se guardan cifradas en el servidor.

## Cómo funciona
- Cada cambio se guarda en el servidor y los demás equipos lo ven en unos 5 segundos.
- El bloqueo de usuarios vale en **todos** los equipos: el usuario bloqueado ve *"Usuario bloqueado. Comuníquese con su servidor para renovar el pago."* y su sesión se cierra sola.
- Los permisos se validan en el servidor: el vendedor no recibe fondo, ganancias, compras ni usuarios, aunque abra la consola del navegador.
- Fondo y Ganancias: presidente y administrador.

## Límites de esta versión
- Necesita internet para vender (no hay cola sin conexión).
- Si dos equipos editan el mismo registro a la vez, gana el último en guardar.
- El historial completo se descarga en cada actualización; con muchos meses de ventas conviene archivar o pasar a una base SQL.
- Plan gratuito de Upstash: límite de comandos diarios; para un negocio pequeño suele alcanzar.
