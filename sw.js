/* Service worker de Crea tu Empresa.
 * PLANTILLA: en `vite build` el plugin cte:service-worker (vite.config.ts) reemplaza
 * VERSION / SHELL / ESTATICOS. En desarrollo NO se registra.
 *
 * Política (prudente a propósito):
 *  - Solo GET del MISMO origen + Google Fonts. Supabase (REST, RPC, Auth, Realtime) y cualquier
 *    otro origen NUNCA pasan por acá: el SW ni siquiera llama a respondWith.
 *  - Navegación: red primero; sin red => shell cacheado (el libro sigue andando) o offline.html
 *    para las pantallas que sí o sí necesitan internet (misiones, tienda, cuenta, empresa).
 *  - /static/* (JS/CSS con hash): caché primero; cache NO versionado para que una pestaña vieja
 *    pueda seguir cargando sus chunks después de un deploy.
 *  - /assets/* (páginas del libro, personajes): caché primero + actualización en segundo plano,
 *    con tope de entradas. Solo se guardan las que el chico ya vio.
 *  - Páginas de los capítulos 2 a 6 (C-01): NO se cachean. Vienen de Supabase Storage con URL
 *    firmada (otro origen => el SW no las toca; el token de la URL vence en 1 h, así que guardarlas
 *    por URL no sirve, y guardarlas por ruta lógica dejaría el libro pago en el Cache Storage del
 *    dispositivo, legible por cualquier otra cuenta que use ese navegador sin pasar por la política
 *    del bucket). Por defensa, cualquier /assets/cap[2-6]new/ del mismo origen tampoco se guarda y
 *    se purga lo que hubiera quedado de builds viejos. Costo: esas páginas necesitan internet.
 */
const VERSION = "0965231d41";
const SHELL = ["/","/offline.html","/manifest.webmanifest","/icons/icon-192.png","/favicon.svg"];
const ESTATICOS = ["/static/index-CrKnGeQb.css","/static/Tienda-sg3fqz35.css","/static/Empresa-CNHJ9gSH.css","/static/cuenta-BmM8i-O2.css","/static/Legal-D_QNvs4c.css","/static/Admin-Cjzobli5.css","/static/supabase-NXRyLVor.js","/static/react-B4E2Ce9m.js","/static/motion-D8SN4pYN.js","/static/contenido-CfOx1PU9.js","/static/index-Bshx5TMI.js","/static/Tienda-C_TktOA-.js","/static/Empresa-DJmAuxAt.js","/static/Cuenta-DpSajXBX.js","/static/Probador-ChZx2qIj.js","/static/Perfiles-DaMRzwu0.js","/static/useAvatarPng-GJ8DwbjJ.js","/static/CuentaAdulto-sjhKA2y4.js","/static/Consentimiento-BV_KShQs.js","/static/Legal-CIuaOqkR.js","/static/textos-DKnQ7em8.js","/static/Admin-aONUPODP.js"];

const C_SHELL = `cte-shell-${VERSION}`;
const C_STATIC = 'cte-static';
const C_IMG = 'cte-img-v1';
const C_FONTS = 'cte-fonts-v1';
const TOPES = { [C_STATIC]: 80, [C_IMG]: 400, [C_FONTS]: 30 };
const NECESITAN_RED = /^\/(leccion\/[^/]+\/mision|tienda|cuenta|empresa|reset)(\/|$)/;
const LIBRO_PROTEGIDO = /^\/assets\/cap[2-6]new\//;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(C_SHELL);
      await shell.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })));
      const st = await caches.open(C_STATIC);
      await st.addAll(ESTATICOS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const vivos = new Set([C_SHELL, C_STATIC, C_IMG, C_FONTS]);
      for (const k of await caches.keys()) if (k.startsWith('cte-') && !vivos.has(k)) await caches.delete(k);
      await recortar(C_STATIC);
      const img = await caches.open(C_IMG);
      for (const r of await img.keys()) if (LIBRO_PROTEGIDO.test(new URL(r.url).pathname)) await img.delete(r);
      await self.clients.claim();
    })(),
  );
});

async function recortar(nombre) {
  const c = await caches.open(nombre);
  const claves = await c.keys();
  const tope = TOPES[nombre] ?? 100;
  for (let i = 0; i < claves.length - tope; i++) await c.delete(claves[i]);
}

const cacheable = (r) => r && r.ok && r.status === 200 && (r.type === 'basic' || r.type === 'cors');

async function cachePrimero(req, nombre, revalidar) {
  const c = await caches.open(nombre);
  const hit = await c.match(req);
  const red = fetch(req)
    .then(async (r) => {
      if (cacheable(r)) {
        await c.put(req, r.clone());
        void recortar(nombre);
      }
      return r;
    })
    .catch(() => null);
  if (hit) {
    if (revalidar) void red;
    return hit;
  }
  return (await red) ?? Response.error();
}

async function navegacion(event) {
  const url = new URL(event.request.url);
  try {
    // Pages responde 404.html (= la app) en rutas profundas: se devuelve tal cual.
    return await fetch(event.request);
  } catch {
    const shell = await caches.open(C_SHELL);
    if (NECESITAN_RED.test(url.pathname)) return (await shell.match('/offline.html')) ?? Response.error();
    return (await shell.match('/')) ?? (await shell.match('/offline.html')) ?? Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cachePrimero(req, C_FONTS, url.origin === 'https://fonts.googleapis.com'));
    return;
  }
  if (url.origin !== self.location.origin) return; // Supabase y todo lo demás: directo a la red.
  if (req.headers.has('range')) return; // audio con rangos: que lo maneje el navegador.

  if (req.mode === 'navigate') {
    event.respondWith(navegacion(event));
    return;
  }
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(cachePrimero(req, C_STATIC, false));
    return;
  }
  if (LIBRO_PROTEGIDO.test(url.pathname)) return; // nunca al Cache Storage (ver arriba).
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cachePrimero(req, C_IMG, true));
    return;
  }
  if (SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(req).then((r) => r ?? fetch(req)));
  }
});
