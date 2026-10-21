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
const VERSION = "25e965d866";
const SHELL = ["/","/offline.html","/manifest.webmanifest","/icons/icon-192.png","/favicon.svg"];
const ESTATICOS = ["/static/index-C7NtEa_t.css","/static/Tienda-CdNyQIXx.css","/static/Empresa-CNHJ9gSH.css","/static/cuenta-BmM8i-O2.css","/static/Legal-D_QNvs4c.css","/static/Admin-Cjzobli5.css","/static/PaginaVivaRuta-CruuxeBS.css","/static/PaginaV2-BF1AWxrj.css","/static/paginaAnimada-A5kzqUbb.css","/static/T1-tn0RQdqM.css","/static/T2-C8OT-uqd.css","/static/T7-j4ciLEnA.css","/static/C5-CE76uyam.css","/static/C6A-CTn5ybGu.css","/static/C6B-DAUZdYfQ.css","/static/supabase-NXRyLVor.js","/static/i18n-en-C_UeWkIz.js","/static/react-rF1qNn-4.js","/static/motion-B8aVsglQ.js","/static/contenido-CE5ylTLR.js","/static/viva2-cap1-B0DqH3C8.js","/static/viva2-cap2-BEKu5GGT.js","/static/viva2-cap3-DE8oFcd_.js","/static/viva2-cap4-BqRIWM3i.js","/static/viva2-cap5-Cze5BCao.js","/static/viva2-cap6-6vBbvpfH.js","/static/index-CVU8THG1.js","/static/Tienda-DzqDpT88.js","/static/Empresa-DxrTYEmL.js","/static/Cuenta-QXOOpMWK.js","/static/Probador-BstrDcxZ.js","/static/Perfiles-jqS5Yaae.js","/static/useAvatarPng-Bw37COyc.js","/static/CuentaAdulto-V0OcBZ1O.js","/static/Consentimiento-DYGrINmN.js","/static/Legal-aQLt1_LZ.js","/static/textos-Cfg2tUSC.js","/static/Admin-BtsQFgaZ.js","/static/PaginaVivaRuta-DOEXp_w5.js","/static/PaginaAnimada-BVyUq5Rl.js","/static/PaginaV2-DA2SxvHS.js","/static/paginaAnimada-D4YMXTrE.js","/static/p01-ChcBcyZv.js","/static/p02-BycmZJWT.js","/static/p03-BML8u8Mu.js","/static/p04-OxwUGbXe.js","/static/p05-jBCuI4J0.js","/static/p06-DaoDh7A4.js","/static/p07-BlwKLHZS.js","/static/p08-Ct_D7z5V.js","/static/p09-DBu8yyOj.js","/static/p10-BYj9hA0C.js","/static/p11-DJjLQu2C.js","/static/p12-B-vvPRQs.js","/static/p13-BH3qV123.js","/static/p14-BGbqCX8E.js","/static/p15-B_uQ0BfR.js","/static/p16-BeHKNfeb.js","/static/p17-DNEsqM_-.js","/static/p18-B8Gn-V6i.js","/static/p19-C1YI6Q_a.js","/static/p20-B4JKn4J2.js","/static/p21-BCyI899O.js","/static/p22-BuHF_RMj.js","/static/p23-8dzRnfi6.js","/static/p24-DGC2_ceu.js","/static/p25-C4-07J6Z.js","/static/p26-CPP7mXAh.js","/static/p01-Drl3UryC.js","/static/p02-CBg_yEwL.js","/static/p03-B9VYuI1w.js","/static/p04-CL_KyzzR.js","/static/p05-D898I2tk.js","/static/p06-C3jyb1z8.js","/static/p07-BklxvdGz.js","/static/p08-DkW3WTff.js","/static/p09-CrCbuT7g.js","/static/p10-Bj7Zh4cL.js","/static/p11-DbVr4SNt.js","/static/p12-28qTZFM2.js","/static/p13-DrnXJ1Iw.js","/static/p14-1ejbB2d3.js","/static/p15-BpgQAwBY.js","/static/p16-ImLzqq0Z.js","/static/p17-478D6OCE.js","/static/p18-DE0vIH9Z.js","/static/p19-C6jhL1sf.js","/static/p20-Bde7nDdP.js","/static/p21-D_1ravHN.js","/static/p22-Bmo7y-Bx.js","/static/T1-BEnv5exG.js","/static/T2-cGg0ZGEx.js","/static/T3-BEnv5exG.js","/static/T4-BEnv5exG.js","/static/T5-BEnv5exG.js","/static/T6-BEnv5exG.js","/static/T7-BzXpQP97.js","/static/T8-BEnv5exG.js","/static/T9-BEnv5exG.js","/static/C5-CLp3uQKK.js","/static/C6A-CCi4RN2L.js","/static/C6B-DL9iM4d-.js","/static/cap1-CRiCGTwe.js","/static/cap1-CrwgG3b9.js"];

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
