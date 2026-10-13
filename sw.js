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
const VERSION = "b34c341e13";
const SHELL = ["/","/offline.html","/manifest.webmanifest","/icons/icon-192.png","/favicon.svg"];
const ESTATICOS = ["/static/index-CMPWeRhf.css","/static/Tienda-CdNyQIXx.css","/static/Empresa-CNHJ9gSH.css","/static/cuenta-BmM8i-O2.css","/static/Legal-D_QNvs4c.css","/static/Admin-Cjzobli5.css","/static/PaginaVivaRuta-CruuxeBS.css","/static/PaginaV2-DI07gF8U.css","/static/paginaAnimada-A5kzqUbb.css","/static/supabase-NXRyLVor.js","/static/i18n-en-BwpSgPK3.js","/static/react-rF1qNn-4.js","/static/motion-B8aVsglQ.js","/static/contenido-BxMX_2l6.js","/static/index-CEOKefsY.js","/static/Tienda-DuLHclJ7.js","/static/Empresa-C91Ydo7V.js","/static/Cuenta-J4jOZQjF.js","/static/Probador-Bu7ShP8g.js","/static/Perfiles-CYi2S7mr.js","/static/useAvatarPng-CB7abmqd.js","/static/CuentaAdulto-BDz4gF4G.js","/static/Consentimiento-D_rJ7rwJ.js","/static/Legal-CZN1hIr-.js","/static/textos-Cfg2tUSC.js","/static/Admin-DjmukE7H.js","/static/PaginaVivaRuta-BpFcez9R.js","/static/PaginaAnimada-D5JyRejl.js","/static/PaginaV2-CpfNFccZ.js","/static/paginaAnimada-D4YMXTrE.js","/static/p05-BDOb4S7U.js","/static/p14-DGLv9CzV.js","/static/p04-BDOb4S7U.js","/static/p06-DinvThI7.js","/static/p07-DinvThI7.js","/static/p01-ChcBcyZv.js","/static/p02-BycmZJWT.js","/static/p03-BML8u8Mu.js","/static/p04-OxwUGbXe.js","/static/p05-jBCuI4J0.js","/static/p06-DaoDh7A4.js","/static/p07-BlwKLHZS.js","/static/p08-Ct_D7z5V.js","/static/p09-DBu8yyOj.js","/static/p10-BYj9hA0C.js","/static/p11-DJjLQu2C.js","/static/p12-B-vvPRQs.js","/static/p13-BH3qV123.js","/static/p14-BGbqCX8E.js","/static/p15-B_uQ0BfR.js","/static/p16-BeHKNfeb.js","/static/p17-DNEsqM_-.js","/static/p18-B8Gn-V6i.js","/static/p19-C1YI6Q_a.js","/static/p20-B4JKn4J2.js","/static/p21-BCyI899O.js","/static/p22-BuHF_RMj.js","/static/p23-8dzRnfi6.js","/static/p24-DGC2_ceu.js","/static/p25-C4-07J6Z.js","/static/p26-CPP7mXAh.js","/static/p01-Drl3UryC.js","/static/p02-CBg_yEwL.js","/static/p03-B9VYuI1w.js","/static/p04-CL_KyzzR.js","/static/p05-D898I2tk.js","/static/p06-C3jyb1z8.js","/static/p07-BklxvdGz.js","/static/p08-DkW3WTff.js","/static/p09-CrCbuT7g.js","/static/p10-Bj7Zh4cL.js","/static/p11-DbVr4SNt.js","/static/p12-28qTZFM2.js","/static/p13-DrnXJ1Iw.js","/static/p14-1ejbB2d3.js","/static/p15-BpgQAwBY.js","/static/p16-ImLzqq0Z.js","/static/p17-478D6OCE.js","/static/p18-DE0vIH9Z.js","/static/p19-C6jhL1sf.js","/static/p20-Bde7nDdP.js","/static/p21-D_1ravHN.js","/static/p22-Bmo7y-Bx.js","/static/p01-CGFEd5EK.js","/static/p02-Cn_YV73U.js","/static/p03-Btre_HUF.js","/static/p04-CeGi6nub.js","/static/p05-Cg1J0LCz.js","/static/p06-BrFpOSzf.js","/static/p07-WesaW7kN.js","/static/p08-DFpi4_vx.js","/static/p09-D6dgQhjk.js","/static/p10-8dBsaSfZ.js","/static/p11-BfPtK2J5.js","/static/p12-DSdABaHW.js","/static/p13-C0FAF_dn.js","/static/p14-CSMVO2ru.js","/static/p15-BfhAGTXk.js","/static/p16-Bz296wUN.js","/static/p17-Etb1t0tQ.js","/static/p18-CITu_DdU.js","/static/p19-Ci0Gurmz.js","/static/p20-LWS_sYrp.js","/static/p21-DhqtNE0U.js","/static/p22-CsbHh8IL.js","/static/p23-CFMzP8yN.js","/static/p24-CDHpeqdh.js","/static/p25-BsIHROnX.js","/static/p26-ZzeJy-ky.js","/static/p27-C2fWv7h7.js","/static/p28-BTxRRVwm.js","/static/p29-CVkWiRU9.js","/static/p01-B4INGL1_.js","/static/p02-D1q1ZhOo.js","/static/p03-CNZxhKD3.js","/static/p04-U-GZUqvV.js","/static/p05-CoRN5l3k.js","/static/p06-CarOQftV.js","/static/p07-B0DYrvkB.js","/static/p08-cV_P1fyA.js","/static/p09-BudJdF3d.js","/static/p11-BfLPl7Pd.js","/static/p12-DVjFdD4x.js","/static/p13-CvTLwrKT.js","/static/p14-qQPnwZAV.js","/static/p15-LsxSR8we.js","/static/p16-DGZwQtWh.js","/static/p17-BAwLVWKz.js","/static/p18-2_NDtr1s.js","/static/p19-BgL7mVj7.js","/static/p20-Dp8SgZd3.js","/static/p21-BbhjWfIp.js","/static/p22-Dtd-Jt2z.js","/static/p23-rcUt68dd.js","/static/p24-BRnIlEoC.js","/static/p25-mdrooj01.js","/static/p26-DfLzzvnP.js","/static/p28-BDycx70M.js","/static/p29-Czhzf6g5.js","/static/cap1-C_PWCsLi.js"];

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
