# Shelf Life — App Code

Complete source of the Shelf Life mobile prototype (version 1, 28 October 2026). The app is plain HTML, CSS and JavaScript with no build step. The only external pieces are Leaflet 1.9.4 (map) and Google Fonts, loaded from CDNs.

## Files

| File | Contents |
|---|---|
| `index.html` | Page shell that loads everything below |
| `style.css` | Shelf Life design system and all screen styles |
| `app.js` | The whole app: data layer, navigation, customer and employee screens, rules, monitoring |
| `leaflet.min.css` | Leaflet 1.9.4 stylesheet (BSD-2-Clause, © Volodymyr Agafonkin and contributors), image references removed |
| `geo.js` | Simplified Berlin district (CC BY Berliner Morgenpost / Amt für Statistik Berlin-Brandenburg) and postcode (public domain) boundaries |

## Run it locally

1. Create a folder and save each code block below under the file name in its heading.
2. For `geo.js`, write `const GEO = ` followed by the JSON block, then `;`.
3. Serve the folder with any static server, for example `python3 -m http.server 8000`, and open `http://localhost:8000` in a phone-sized browser window.

## Behaviour outside claude.ai

The published version uses two claude.ai artifact capabilities through `window.claude.use()`:

- **`db`**: shared database, so employee approvals reach customers on any device.
- **`sample`** with images: Claude vision analysis of product photos.

Run elsewhere, the app falls back automatically:

- Data is saved in the browser's `localStorage`. Employee and customer views share it only within the same browser.
- The AI step reports "AI analysis unavailable" and the employee fills in the survey manually. No results are invented.

To connect a real backend, replace the `DB` object in `app.js` (same `get / list / set / patch / del / on` interface) and the `sample.json(...)` call in `VIEWS.analyze`.

## Demo accounts

| Role | Email | Password | Store |
|---|---|---|---|
| Customer | alex@shelflife.demo | ShelfLife-demo1 | — |
| Customer | mira@shelflife.demo | ShelfLife-demo1 | — |
| Employee | jonas@shelflife.demo | Staff-demo1 | EDEKA Bahnhof Friedrichstraße |
| Manager | lena@shelflife.demo | Manager-demo1 | REWE Berlin Hauptbahnhof |

These are client-side test accounts. Production needs a real authentication service with server-side role checks.

---

## index.html

````html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Shelf Life</title>
<meta name="theme-color" content="#E8F8F4">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Manrope:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="leaflet.min.css">
<link rel="stylesheet" href="style.css">
<style>*,*::before,*::after{box-sizing:border-box}[hidden]{display:none!important}body{margin:0}</style>
</head>
<body>
<main id="app" aria-live="polite"></main>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
<script src="geo.js"></script>
<script src="app.js"></script>
</body>
</html>
````

## style.css

````css
/* Layout: one phone-width column, each screen is a stacked .view that slides/fades; brand ring is a masked conic gradient. */
:root{
  --bg:#E8F8F4; --forest:#145A32; --emerald:#008F65; --natural:#48B66A; --sage:#8BC9A0; --mint:#B8E8C9; --pastel:#D7F4DF;
  --ink:#123A24; --muted:#4C7A60; --line:#C7E6D6; --card:#FBFEFD; --card2:#F2FBF7; --white:#FFFFFF;
  --warm:#B9771A; --warm-bg:#FBEFD9; --hold:#A8432E; --hold-bg:#F8E1DA; --shadow:0 6px 22px rgba(20,90,50,.10); --shadow-s:0 2px 8px rgba(20,90,50,.08);
  --f-display:"Cormorant Garamond","Cormorant",Georgia,"Times New Roman",serif;
  --f-ui:"Manrope","Segoe UI",system-ui,-apple-system,sans-serif;
  --r-l:24px; --r-m:16px; --r-s:12px;
  --ring:conic-gradient(from 0deg,#145A32,#008F65,#48B66A,#8BC9A0,#B8E8C9,#D7F4DF,#B8E8C9,#8BC9A0,#48B66A,#008F65,#145A32);
  color-scheme:light;
}
html,body{height:100%}
body{background:var(--bg);color:var(--ink);font-family:var(--f-ui);font-size:15px;line-height:1.45;overflow:hidden;-webkit-tap-highlight-color:transparent}
button,input,select,textarea{font:inherit;color:inherit}
button{cursor:pointer}
:focus-visible{outline:3px solid var(--natural);outline-offset:2px}
h1,h2,h3{margin:0;text-wrap:balance}
p{margin:0}
#app{position:relative;height:100%;max-width:440px;margin:0 auto;overflow:hidden;background:var(--bg)}
@media (min-width:480px){#app{box-shadow:0 0 0 1px var(--line),0 20px 60px rgba(20,90,50,.12)}}
.view{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;background:var(--bg);
  padding-left:max(18px,env(safe-area-inset-left,0px));padding-right:max(18px,env(safe-area-inset-right,0px));padding-block:14px 32px;
  transition:transform .48s cubic-bezier(.22,.8,.24,1),opacity .48s ease;will-change:transform,opacity}
.view.enter-right{transform:translateX(100%);opacity:.4}
.view.enter-up{transform:translateY(24px);opacity:0}
.view.exit-left{transform:translateX(-28%);opacity:0}
.view.exit-right{transform:translateX(100%);opacity:.3}
.view.exit-fade{opacity:0}
.view.full{padding:0}

/* ---------- brand ring ---------- */
.ring{position:relative;border-radius:50%;background:var(--ring);
  --band:22%; --sweep:360deg; --from:0deg;
  -webkit-mask:conic-gradient(from var(--from),#000 0 var(--sweep),transparent 0),radial-gradient(farthest-side,transparent calc(100% - var(--band)),#000 calc(100% - var(--band) + .6px));
  -webkit-mask-composite:source-in;
  mask:conic-gradient(from var(--from),#000 0 var(--sweep),transparent 0),radial-gradient(farthest-side,transparent calc(100% - var(--band)),#000 calc(100% - var(--band) + .6px));
  mask-composite:intersect;
}
.ring-wrap{position:relative;display:grid;place-items:center}
.ring-wrap .rot{position:absolute;inset:0}
.ring-wrap .ring{position:absolute;inset:0}
.cap{position:absolute;border-radius:50%;transform:translate(-50%,-50%)}
.mono{position:relative;text-align:center;line-height:1;color:var(--forest)}
.mono .sl{font-family:var(--f-display);font-weight:600;letter-spacing:.02em}
.mono .name{font-family:var(--f-ui);font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--forest)}
.mini-logo{position:relative;flex:none;display:grid;place-items:center;border:0;background:none;padding:0}
.mini-logo .ring{position:absolute;inset:0;--band:24%;--from:250deg;--sweep:220deg}
.mini-logo span{font-family:var(--f-display);font-weight:700;color:var(--forest);position:relative}

/* ---------- welcome / splash ---------- */
.welcome{padding:0;display:block;overflow:hidden}
.welcome .stage{position:absolute;left:50%;top:50%;width:min(88vw,388px);aspect-ratio:1;transform:translate(-50%,-50%);transition:transform 1.15s cubic-bezier(.65,0,.25,1)}
.welcome .mono .sl{font-size:clamp(68px,22vw,104px)}
.welcome .mono .name{font-size:clamp(13px,3.8vw,17px);margin-top:10px;display:block}
.welcome .mono{opacity:0;transform:scale(.9);transition:opacity .9s ease,transform 1.1s cubic-bezier(.2,.8,.2,1)}
.welcome .mono.show{opacity:1;transform:none}
.welcome .choices{position:absolute;left:0;right:0;bottom:0;padding:0 max(24px,env(safe-area-inset-left,0px)) calc(28px + env(safe-area-inset-bottom,0px));display:grid;gap:16px}
.welcome .tagline{text-align:center;color:var(--muted);font-size:14.5px;max-width:30ch;margin:0 auto 8px;opacity:0;transform:translateY(14px);transition:all .7s ease}
.choices .btn{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .8s cubic-bezier(.2,.8,.2,1),box-shadow .2s,background .2s}
.choices.in .tagline{opacity:1;transform:none}
.choices.in .btn{opacity:1;transform:none}
.choices.in .btn.b2{transition-delay:.22s}
.skip{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:max(14px,env(safe-area-inset-right,0px));font-size:12px;color:var(--muted);background:none;border:0;padding:8px;opacity:.75}

/* ---------- buttons, inputs ---------- */
.btn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:56px;border-radius:18px;border:1.5px solid transparent;font-weight:700;font-size:16px;letter-spacing:.01em;padding:0 22px;transition:transform .15s ease,box-shadow .2s,background .2s,opacity .2s}
.btn:active{transform:scale(.975)}
.btn-primary{background:var(--emerald);color:var(--white);box-shadow:0 8px 20px rgba(0,143,101,.28)}
.btn-primary:hover{background:#007f59}
.btn-outline{background:rgba(215,244,223,.55);color:var(--forest);border-color:var(--emerald)}
.btn-ghost{background:transparent;color:var(--forest);border-color:var(--line)}
.btn-warn{background:var(--hold-bg);color:var(--hold);border-color:#E7B9AC}
.btn-sm{min-height:42px;border-radius:13px;font-size:14px;padding:0 14px}
.btn[disabled]{opacity:.45;pointer-events:none}
.icon-btn{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;border:0;background:var(--mint);color:var(--forest);flex:none;position:relative;transition:transform .15s}
.icon-btn:active{transform:scale(.92)}
.icon-btn.plain{background:transparent}
.icon-btn svg{width:22px;height:22px}
.badge-dot{position:absolute;top:4px;right:4px;min-width:18px;height:18px;border-radius:9px;background:var(--warm);color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center;padding:0 4px;border:2px solid var(--bg)}
label.fld{display:grid;gap:6px;font-size:13px;font-weight:700;color:var(--forest)}
.inp{width:100%;min-height:52px;border-radius:14px;border:1.5px solid var(--line);background:var(--white);padding:0 14px;font-size:16px;color:var(--ink);transition:border-color .2s,box-shadow .2s}
.inp:focus{outline:none;border-color:var(--emerald);box-shadow:0 0 0 4px rgba(0,143,101,.14)}
textarea.inp{padding:12px 14px;min-height:84px;resize:vertical}
select.inp{appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--forest) 50%),linear-gradient(135deg,var(--forest) 50%,transparent 50%);background-position:calc(100% - 20px) 50%,calc(100% - 14px) 50%;background-size:6px 6px;background-repeat:no-repeat;padding-right:36px}
.pw{position:relative}
.pw .inp{padding-right:72px}
.pw button{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:none;color:var(--emerald);font-weight:700;font-size:13px;padding:10px}
.link{background:none;border:0;color:var(--emerald);font-weight:700;padding:6px 0;text-decoration:underline;text-underline-offset:3px}
.err{color:var(--hold);font-size:13.5px;font-weight:600;min-height:1.2em}
.note{font-size:12.5px;color:var(--muted);line-height:1.45}
.demo-tag{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#7A5A12;background:#F7EBC9;border-radius:6px;padding:3px 7px}
.ok-tag{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--white);background:var(--emerald);border-radius:6px;padding:3px 7px}

/* ---------- headers ---------- */
.topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px}
.topbar .mid{flex:1;min-width:0;text-align:center}
.brandline{font-family:var(--f-display);font-weight:600;font-size:23px;color:var(--forest);letter-spacing:.02em;line-height:1}
.eyebrow{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.hello{font-family:var(--f-display);font-weight:600;font-size:34px;line-height:1.05;color:var(--forest)}
.sub{color:var(--muted);font-size:14px}
.pill-status{display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:var(--pastel);color:var(--forest);font-size:12px;font-weight:700;padding:5px 11px;border:1px solid var(--mint)}
.pill-status::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--natural)}
.section-h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:22px 0 10px}
.section-h h2{font-size:17px;font-weight:800;color:var(--forest);letter-spacing:-.01em}

/* ---------- chips ---------- */
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{min-height:38px;border-radius:999px;border:1.5px solid var(--sage);background:var(--mint);color:var(--forest);font-weight:700;font-size:14px;padding:0 15px;display:inline-flex;align-items:center;gap:6px;transition:all .2s}
.chip.on{background:var(--emerald);border-color:var(--emerald);color:var(--white);box-shadow:0 4px 12px rgba(0,143,101,.25)}
.chip.on::before{content:"✓";font-size:12px}
.scroll-x{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 calc(-1*max(18px,env(safe-area-inset-left,0px)));padding:2px max(18px,env(safe-area-inset-left,0px)) 6px}
.scroll-x::-webkit-scrollbar{display:none}
.scroll-x .chip{flex:none}

/* ---------- cards ---------- */
.card{background:var(--card);border-radius:var(--r-m);box-shadow:var(--shadow-s);border:1px solid rgba(184,232,201,.6)}
.pad{padding:16px}
.stack{display:grid;gap:12px}
.row{display:flex;align-items:center;gap:10px}
.between{justify-content:space-between}
.grow{flex:1;min-width:0}
.tnum{font-variant-numeric:tabular-nums}
.anim-in{animation:rise .6s cubic-bezier(.2,.8,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fade{from{opacity:0}to{opacity:1}}

/* ---------- map split ---------- */
.split{display:grid;grid-template-columns:33% 1fr;gap:8px;height:clamp(340px,52vh,520px)}
.mlist{overflow-y:auto;display:grid;align-content:start;gap:6px;padding-right:2px;scrollbar-width:thin}
.mitem{text-align:left;border:1.5px solid transparent;background:var(--card);border-radius:12px;padding:9px 9px 9px 10px;display:grid;gap:2px;box-shadow:var(--shadow-s);transition:all .2s;min-width:0}
.mitem b{font-size:12.5px;line-height:1.2;color:var(--forest);overflow-wrap:anywhere}
.mitem small{font-size:11px;color:var(--muted);line-height:1.25}
.mitem .chain{font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--emerald)}
.mitem.sel{border-color:var(--emerald);background:var(--pastel)}
.mapbox{position:relative;border-radius:18px;overflow:hidden;box-shadow:var(--shadow);border:1px solid var(--mint);background:#DDF2EA}
#map{position:absolute;inset:0;background:#DDF2EA}
.map-callout{position:absolute;left:8px;right:8px;bottom:8px;z-index:500;background:rgba(251,254,253,.97);border-radius:14px;padding:10px 12px;box-shadow:var(--shadow);font-size:12.5px;animation:rise .35s ease both}
.map-callout b{display:block;color:var(--forest);font-size:13.5px}
.map-note{position:absolute;top:8px;left:8px;right:8px;z-index:500;font-size:10.5px;color:var(--muted);background:rgba(251,254,253,.88);border-radius:8px;padding:4px 8px;pointer-events:none}
.pin{width:30px;height:38px;position:relative;transition:transform .25s}
.pin svg{width:100%;height:100%;filter:drop-shadow(0 3px 4px rgba(20,90,50,.35))}
.pin.sel{transform:scale(1.32) translateY(-4px);z-index:999}
.district-label{background:none;border:0;box-shadow:none;color:rgba(20,90,50,.5);font-weight:800;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.district-label::before{display:none}

/* leaflet look */
.leaflet-container{font-family:var(--f-ui);background:#DDF2EA}
.leaflet-tooltip.district-label{background:none;border:0;box-shadow:none;padding:0}
.leaflet-bar{border:0!important}
.leaflet-control-zoom{display:grid;border-radius:12px;overflow:hidden;box-shadow:var(--shadow-s)}
.leaflet-control-zoom a{width:34px;height:34px;display:grid;place-items:center;background:var(--card);color:var(--forest);text-decoration:none;font-weight:800;font-size:18px;border-bottom:1px solid var(--line)}
.leaflet-control-attribution{font-size:9px;background:rgba(251,254,253,.8);padding:1px 6px;color:var(--muted);border-radius:6px 0 0 0;margin:0!important}

/* ---------- products ---------- */
.pgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pcard{background:var(--card);border-radius:18px;box-shadow:var(--shadow-s);border:1px solid rgba(184,232,201,.7);overflow:hidden;display:grid;text-align:left;padding:0;transition:transform .2s;min-width:0}
.pcard:active{transform:scale(.98)}
.pcard.urgent{border-color:#EBC98A;box-shadow:0 2px 10px rgba(185,119,26,.14)}
.pimg{position:relative;aspect-ratio:4/3;max-width:100%;display:grid;place-items:center;overflow:hidden}
.pimg img{width:100%;height:100%;object-fit:cover}
.pimg svg{width:48%;height:auto}
.dbadge{position:absolute;top:8px;left:8px;border-radius:9px;padding:4px 8px;font-weight:800;font-size:12.5px;color:#fff;background:var(--emerald)}
.dbadge.l1{background:#8BC9A0;color:var(--forest)}.dbadge.l2{background:#48B66A}.dbadge.l3{background:#008F65}.dbadge.l4{background:#0B7550}.dbadge.l5{background:#145A32}
.pbody{padding:10px 11px 12px;display:grid;gap:3px}
.pbody .cat{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.pbody b{font-size:14px;color:var(--forest);line-height:1.2}
.price{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}
.price .now{font-size:19px;font-weight:800;color:var(--forest)}
.price s{color:var(--muted);font-size:12.5px}
.exp{font-size:12px;font-weight:700;color:var(--muted)}
.exp.warm{color:var(--warm)}
.srcline{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}

/* ---------- sheets ---------- */
.sheet-back{position:absolute;inset:0;background:rgba(18,58,36,.32);z-index:50;animation:fade .25s ease both}
.sheet{position:absolute;left:0;right:0;bottom:0;z-index:51;background:var(--bg);border-radius:26px 26px 0 0;max-height:88%;overflow-y:auto;padding:10px max(18px,env(safe-area-inset-left,0px)) calc(24px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 40px rgba(20,90,50,.2);animation:sheetIn .38s cubic-bezier(.2,.8,.2,1) both}
.sheet .grab{width:42px;height:5px;border-radius:3px;background:var(--sage);margin:0 auto 12px}
@keyframes sheetIn{from{transform:translateY(100%)}to{transform:none}}
.toast{position:absolute;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:90;background:var(--forest);color:#fff;border-radius:14px;padding:11px 16px;font-size:13.5px;font-weight:600;box-shadow:var(--shadow);max-width:calc(100% - 32px);animation:rise .3s ease both}
.toast.alert{background:var(--card);color:var(--ink);border:1.5px solid var(--emerald);display:grid;gap:8px;width:calc(100% - 32px)}

/* ---------- profile ---------- */
.loyal{border-radius:26px;padding:22px;color:#fff;position:relative;overflow:hidden;background:linear-gradient(140deg,#145A32 0%,#008F65 55%,#48B66A 100%);box-shadow:0 14px 34px rgba(0,143,101,.32)}
.loyal .ring{position:absolute;width:210px;height:210px;right:-70px;top:-70px;opacity:.38;--band:20%}
.loyal .pts{font-size:52px;font-weight:800;letter-spacing:-.03em;line-height:1}
.loyal .pts small{font-size:18px;font-weight:700;letter-spacing:0;margin-left:6px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.stat{background:var(--pastel);border-radius:16px;padding:12px 10px;display:grid;gap:4px;min-width:0}
.stat svg{width:22px;height:22px;color:var(--emerald)}
.stat b{font-size:18px;color:var(--forest);font-weight:800}
.stat span{font-size:11px;color:var(--muted);line-height:1.2}
.opt{display:flex;align-items:center;gap:10px;min-height:48px;border-radius:14px;border:1.5px solid var(--line);background:var(--white);padding:10px 14px;text-align:left;font-weight:600;font-size:14.5px;width:100%;transition:all .18s}
.opt::before{content:"";width:18px;height:18px;border-radius:50%;border:2px solid var(--sage);flex:none;transition:all .18s}
.opt.on{border-color:var(--emerald);background:var(--pastel)}
.opt.on::before{border:5.5px solid var(--emerald)}
.opt .ai{margin-left:auto;font-size:10px;font-weight:800;letter-spacing:.06em;color:var(--emerald);background:var(--pastel);border:1px solid var(--mint);border-radius:6px;padding:2px 6px;white-space:nowrap}
.stars{display:flex;gap:6px}
.stars button{border:0;background:none;padding:2px;width:40px;height:40px}
.stars svg{width:100%;height:100%}
.list-btn{display:flex;align-items:center;gap:12px;width:100%;min-height:56px;border:0;border-bottom:1px solid var(--line);background:none;text-align:left;font-weight:700;font-size:15px;color:var(--forest);padding:0 4px}
.list-btn svg{width:22px;height:22px;color:var(--emerald)}
.list-btn .chev{margin-left:auto;color:var(--sage)}

/* ---------- employee ---------- */
.scan-cta{display:flex;align-items:center;gap:16px;width:100%;border:0;border-radius:24px;padding:20px;text-align:left;color:#fff;background:linear-gradient(135deg,#008F65,#145A32);box-shadow:0 14px 30px rgba(0,143,101,.32);transition:transform .15s}
.scan-cta:active{transform:scale(.98)}
.scan-cta .ci{width:58px;height:58px;border-radius:18px;background:rgba(255,255,255,.16);display:grid;place-items:center;flex:none}
.scan-cta svg{width:30px;height:30px}
.scan-cta b{font-size:20px;display:block}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tile{border:0;text-align:left;background:var(--card);border-radius:18px;padding:14px;box-shadow:var(--shadow-s);display:grid;gap:2px;border-top:3px solid var(--sage)}
.tile b{font-size:28px;font-weight:800;color:var(--forest);line-height:1.1}
.tile span{font-size:12.5px;font-weight:700;color:var(--muted)}
.tile.t2{border-top-color:var(--warm)}.tile.t3{border-top-color:var(--natural)}.tile.t4{border-top-color:var(--emerald)}
.prow{display:flex;gap:12px;align-items:center;width:100%;border:0;background:var(--card);border-radius:16px;padding:10px;box-shadow:var(--shadow-s);text-align:left}
.thumb{width:58px;height:58px;border-radius:13px;overflow:hidden;flex:none;display:grid;place-items:center}
.thumb img{width:100%;height:100%;object-fit:cover}
.thumb svg{width:60%}
.prow .meta{font-size:11.5px;color:var(--muted);line-height:1.35}
.st{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;border-radius:999px;padding:3px 9px;white-space:nowrap}
.st::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor}
.st.good{background:var(--pastel);color:#16764A}
.st.monitor{background:#EAF4D4;color:#5B7A12}
.st.review{background:var(--warm-bg);color:var(--warm)}
.st.immediate{background:#FBE3CF;color:#B4561A}
.st.hold{background:var(--hold-bg);color:var(--hold)}
.st.manual{background:#E9EEF0;color:#4A5C66}
.st.active{background:var(--emerald);color:#fff}
.st.pending{background:#FFF3D6;color:#8A6410}
.clock{background:repeating-linear-gradient(-45deg,#F7EBC9 0 10px,#FAF1D7 10px 20px);border:1.5px dashed #D9B867;border-radius:18px;padding:12px 14px;display:grid;gap:10px}
.clock .row button{flex:1}

/* camera */
.cam{background:#0E2A1B;color:#E8F8F4}
.cam .topbar{color:#E8F8F4}
.cam .icon-btn{background:rgba(232,248,244,.12);color:#E8F8F4}
.viewfinder{position:relative;margin-top:16px;border-radius:28px;overflow:hidden;background:#0A1F14;aspect-ratio:3/4;max-width:100%;max-height:58vh;margin-inline:auto;width:100%}
.viewfinder video,.viewfinder img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.guide{position:absolute;inset:14% 12%;border-radius:28px;border:2.5px solid rgba(184,232,201,.9);box-shadow:0 0 0 999px rgba(10,31,20,.28)}
.guide::before,.guide::after{content:"";position:absolute;width:26px;height:26px;border:4px solid #48B66A}
.guide::before{left:-3px;top:-3px;border-right:0;border-bottom:0;border-radius:20px 0 0 0}
.guide::after{right:-3px;bottom:-3px;border-left:0;border-top:0;border-radius:0 0 20px 0}
.vf-empty{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:30px;color:#B8E8C9;font-size:13.5px}
.shutter{width:78px;height:78px;border-radius:50%;border:5px solid #E8F8F4;background:var(--emerald);display:grid;place-items:center;box-shadow:0 0 0 6px rgba(0,143,101,.35);transition:transform .15s}
.shutter:active{transform:scale(.9)}
.shutter svg{width:30px;height:30px;color:#fff}
.cam-ctrl{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-top:22px}
.cam-ctrl .side{display:grid;justify-items:center;gap:4px;font-size:11.5px;color:#B8E8C9}

/* analysis */
.scanimg{position:relative;width:min(78%,300px);aspect-ratio:1;margin:26px auto 0;border-radius:30px;overflow:hidden;box-shadow:0 18px 40px rgba(20,90,50,.25)}
.scanimg img{width:100%;height:100%;object-fit:cover}
.scanimg .beam{position:absolute;left:0;right:0;height:34%;background:linear-gradient(180deg,transparent,rgba(72,182,106,.42) 70%,rgba(184,232,201,.95));border-bottom:2px solid #D7F4DF;animation:beam 1.9s ease-in-out infinite alternate}
.scanimg .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(215,244,223,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(215,244,223,.18) 1px,transparent 1px);background-size:22px 22px}
.scanimg.done .beam,.scanimg.done .grid{display:none}
@keyframes beam{from{top:-34%}to{top:100%}}
.statusmsg{text-align:center;font-weight:700;color:var(--forest);margin-top:20px;min-height:1.5em;animation:fade .4s ease}
.obs{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:14px}
.obs dt{color:var(--muted);font-weight:700;font-size:12.5px}
.obs dd{margin:0;font-weight:600;color:var(--ink);min-width:0}
.flag{border-radius:14px;padding:12px 14px;font-size:13.5px;font-weight:600;display:flex;gap:10px;align-items:flex-start}
.flag svg{width:20px;height:20px;flex:none;margin-top:1px}
.flag.hold{background:var(--hold-bg);color:var(--hold)}
.flag.warm{background:var(--warm-bg);color:#875610}
.flag.info{background:var(--pastel);color:var(--forest)}

/* survey */
.progress{position:sticky;top:-14px;z-index:5;background:var(--bg);padding:10px 0 10px;margin-top:4px}
.bar{height:6px;border-radius:3px;background:var(--mint);overflow:hidden}
.bar i{display:block;height:100%;background:linear-gradient(90deg,#48B66A,#008F65);border-radius:3px;transition:width .4s ease}
.qcard{background:var(--card);border-radius:22px;padding:16px;box-shadow:var(--shadow-s);border:1.5px solid rgba(184,232,201,.7);display:grid;gap:10px;scroll-margin-top:70px;transition:border-color .2s}
.qcard.done{border-color:var(--sage)}
.qcard .qn{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--emerald)}
.qcard h3{font-size:16.5px;font-weight:800;color:var(--forest);line-height:1.3}
.statusbig{border-radius:22px;padding:18px;display:grid;gap:6px}
.kv{display:grid;grid-template-columns:minmax(0,42%) 1fr;gap:8px 12px;font-size:14px}
.kv dt{color:var(--muted);font-weight:700;font-size:12.5px}
.kv dd{margin:0;font-weight:600;min-width:0;overflow-wrap:anywhere}
.why{margin:0;padding-left:18px;font-size:13px;color:var(--ink);display:grid;gap:4px}
.proposal{border-radius:22px;padding:16px;background:linear-gradient(160deg,#FFFFFF,#EAF8F0);border:1.5px solid var(--sage);display:grid;gap:10px}
.proposal .big{font-size:40px;font-weight:800;color:var(--forest);line-height:1}
input[type=range]{width:100%;accent-color:var(--emerald)}
.ntf{display:flex;gap:12px;width:100%;text-align:left;border:0;background:var(--card);border-radius:16px;padding:12px;box-shadow:var(--shadow-s);align-items:flex-start}
.ntf.unread{background:var(--white);border-left:4px solid var(--emerald)}
.ntf .t{font-weight:800;color:var(--forest);font-size:14px}
.ntf .b{font-size:13px;color:var(--ink)}
.ntf .when{font-size:11px;color:var(--muted)}
.empty{text-align:center;padding:28px 16px;color:var(--muted);font-size:14px;display:grid;gap:8px;justify-items:center}
.empty svg{width:42px;height:42px;color:var(--sage)}
.skel{background:linear-gradient(90deg,var(--card2),var(--pastel),var(--card2));background-size:200% 100%;animation:sk 1.2s linear infinite;border-radius:16px}
@keyframes sk{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
.leaflet-top.leaflet-right{top:30px}.leaflet-right .leaflet-control{margin-right:8px}

````

## app.js

````javascript
"use strict";
/* ============================================================
   SHELF LIFE — prototype app (single page)
   Data: shared artifact database when available, else this browser.
   ============================================================ */

/* ---------- reference data ---------- */
// Verified store data: berlin.de "Supermarkets open on Sundays" pages (address + coordinates from each page's map metadata).
const STORES = [
  {id:"edeka-friedrichstrasse", chain:"EDEKA", name:"EDEKA Bahnhof Friedrichstraße", short:"Friedrichstraße Stn.", addr:"Friedrichstraße 142, 10117 Berlin", area:"Mitte", lat:52.5206, lon:13.3876, hours:"Mon–Fri 6–22 · Sat–Sun 8–22"},
  {id:"rewe-hauptbahnhof", chain:"REWE", name:"REWE Berlin Hauptbahnhof", short:"Hauptbahnhof", addr:"Europaplatz 1, 10559 Berlin", area:"Moabit", lat:52.5252, lon:13.3684, hours:"Mon–Sat 6–22 · Sun 8–22"},
  {id:"denns-hauptbahnhof", chain:"Denns BioMarkt", name:"Denns BioMarkt Hauptbahnhof", short:"Hauptbahnhof", addr:"Europaplatz 1, 10557 Berlin", area:"Moabit", lat:52.5257, lon:13.3685, hours:"Daily 8–22"},
  {id:"rewe-ostbahnhof", chain:"REWE", name:"REWE Ostbahnhof", short:"Ostbahnhof", addr:"Am Ostbahnhof 9, 10243 Berlin", area:"Friedrichshain", lat:52.5104, lon:13.4361, hours:"Daily 6–24"},
  {id:"penny-ostbahnhof", chain:"PENNY", name:"PENNY Ostbahnhof", short:"Ostbahnhof", addr:"Am Ostbahnhof 9, 10243 Berlin", area:"Friedrichshain", lat:52.5096, lon:13.4346, hours:"Daily 7–23"},
  {id:"denns-ostkreuz", chain:"Denns BioMarkt", name:"Denns BioMarkt Ostkreuz", short:"Ostkreuz", addr:"Sonntagstraße 37, 10245 Berlin", area:"Friedrichshain", lat:52.5040, lon:13.4689, hours:"Daily 7–22"},
  {id:"edeka-lichtenberg", chain:"EDEKA", name:"EDEKA Bahnhof Lichtenberg", short:"Lichtenberg Stn.", addr:"Weitlingstraße 22, 10317 Berlin", area:"Lichtenberg", lat:52.5092, lon:13.4971, hours:"Mon–Fri 6–22 · Sat–Sun 8–22"},
  {id:"edeka-suedkreuz", chain:"EDEKA", name:"EDEKA Bahnhof Südkreuz", short:"Südkreuz", addr:"Hildegard-Knef-Platz 1, 10829 Berlin", area:"Schöneberg", lat:52.4767, lon:13.3655, hours:"Mon–Fri 6–22 · Sat–Sun 8–22"},
  {id:"denns-zoo", chain:"Denns BioMarkt", name:"Denns BioMarkt Zoologischer Garten", short:"Zoo Station", addr:"Jebensstraße 3, 10623 Berlin", area:"Charlottenburg", lat:52.5078, lon:13.3319, hours:"Daily 8–22"},
  {id:"goasia-potsdamer", chain:"Go Asia", name:"Go Asia Potsdamer Platz", short:"Potsdamer Platz", addr:"Potsdamer Platz, 10785 Berlin", area:"Tiergarten", lat:52.5089, lon:13.3772, hours:"Mon–Sat 8–21:30 · Sun 8–20"}
];
const storeById = id => STORES.find(s => s.id === id);

// Demo accounts. A production build replaces this with the real auth backend.
const ACCOUNTS = [
  {id:"cust-alex", email:"alex@shelflife.demo", pw:"ShelfLife-demo1", role:"customer", name:"Alex Berger"},
  {id:"cust-mira", email:"mira@shelflife.demo", pw:"ShelfLife-demo1", role:"customer", name:"Mira Yilmaz"},
  {id:"staff-jonas", email:"jonas@shelflife.demo", pw:"Staff-demo1", role:"employee", name:"Jonas Krüger", storeId:"edeka-friedrichstrasse"},
  {id:"staff-lena", email:"lena@shelflife.demo", pw:"Manager-demo1", role:"manager", name:"Lena Hoffmann", storeId:"rewe-hauptbahnhof"}
];
const STAFF = r => r === "employee" || r === "manager";

const CATS = ["Fruits","Vegetables","Dairy","Meat","Bakery"];
const DEFAULT_RULES = {
  table:[{min:14,pct:2},{min:10,pct:5},{min:7,pct:10},{min:4,pct:20},{min:2,pct:30},{min:1,pct:40}],
  reviewWindow:7,           // days before the recorded date when a discount review notification fires
  noDatePct:20,             // store default for products without a reliable expiry date (employee must confirm)
  maxPct:{employee:40, manager:60},
  inspectEvery:{good:3, monitor:2, review:1, manual:1}
};
const PRODUCE = {Fruits:["Apples","Bananas","Pears","Grapes","Strawberries","Blueberries","Raspberries","Oranges","Mandarins","Lemons","Kiwis","Avocados","Mangoes","Peaches","Plums","Cherries","Melon","Pineapple"],
  Vegetables:["Tomatoes","Cucumbers","Lettuce","Carrots","Potatoes","Onions","Bell peppers","Broccoli","Cauliflower","Zucchini","Mushrooms","Spinach","Leeks","Cabbage","Radishes","Asparagus","Kohlrabi","Eggplant"]};
const catOf = name => { for (const c in PRODUCE) if (PRODUCE[c].some(p => p.toLowerCase() === String(name).toLowerCase())) return c; return null; };

// Illustrative catalogue for the customer store page until real inventory feeds exist.
const DEMO_ITEMS = [
  {n:"Organic Apples",c:"Fruits",u:"kg",p:3.49,t:"#F6D9D2",d:"Crisp Elstar apples from the Altes Land orchard region."},
  {n:"Bananas",c:"Fruits",u:"kg",p:1.79,t:"#F7EDC4",d:"Fairtrade bananas, ripe and ready to eat."},
  {n:"Strawberries",c:"Fruits",u:"500 g",p:3.49,t:"#F8D6DA",d:"Sweet strawberries in a recyclable tray."},
  {n:"Seedless Grapes",c:"Fruits",u:"500 g",p:2.99,t:"#E3EFD2",d:"Green seedless grapes."},
  {n:"Cucumbers",c:"Vegetables",u:"each",p:0.79,t:"#D7F0DC",d:"Crunchy field cucumbers."},
  {n:"Lettuce",c:"Vegetables",u:"each",p:1.19,t:"#DDF2D0",d:"Fresh butterhead lettuce."},
  {n:"Vine Tomatoes",c:"Vegetables",u:"kg",p:3.99,t:"#F7DACF",d:"Aromatic tomatoes on the vine."},
  {n:"Carrots",c:"Vegetables",u:"1 kg",p:1.29,t:"#FBE3CA",d:"Washed carrots from Brandenburg."},
  {n:"Fresh Milk 3.5%",c:"Dairy",u:"1 L",p:1.29,t:"#E5F0F5",d:"Whole milk, pasteurised."},
  {n:"Natural Yogurt",c:"Dairy",u:"500 g",p:1.49,t:"#EEF1F4",d:"Creamy natural yogurt, 3.8% fat."},
  {n:"Gouda Cheese",c:"Dairy",u:"400 g",p:3.99,t:"#F8EDC9",d:"Young Gouda, sliced."},
  {n:"Butter",c:"Dairy",u:"250 g",p:2.39,t:"#FAF0CD",d:"Sweet cream butter."},
  {n:"Chicken Breast",c:"Meat",u:"600 g",p:7.49,t:"#F7DCD6",d:"Free-range chicken breast fillets."},
  {n:"Ground Beef",c:"Meat",u:"500 g",p:5.99,t:"#F2D2CF",d:"Fresh minced beef, 20% fat."},
  {n:"Turkey Slices",c:"Meat",u:"300 g",p:4.49,t:"#F5E0D6",d:"Thinly sliced turkey breast."},
  {n:"Fresh Sausages",c:"Meat",u:"400 g",p:3.99,t:"#F3D8CC",d:"Coarse Bratwurst, ready to grill."}
];

/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const eur = n => new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(n || 0);
const clone = o => JSON.parse(JSON.stringify(o ?? null));
const uid = p => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const firstName = n => String(n || "").split(" ")[0];
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- dates (Europe/Berlin) ---------- */
const berlinISO = (d = new Date()) => new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
const addDays = (iso, n) => { const [y,m,d] = iso.split("-").map(Number); return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10); };
const diffDays = (a, b) => { const p = s => { const [y,m,d] = s.split("-").map(Number); return Date.UTC(y,m-1,d); }; return Math.round((p(b)-p(a))/864e5); };
const clockOffset = () => Number(DB.get("settings","clock")?.offset || 0);
const today = () => addDays(berlinISO(), clockOffset());
const daysLeft = iso => iso ? diffDays(today(), iso) : null;
const fmtDate = iso => iso ? new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"}) : "—";
const fmtWhen = ts => { const d = new Date(ts); return d.toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"}); };
const rules = () => ({...DEFAULT_RULES, ...(DB.get("settings","rules") || {})});
function pctForDays(d){ if (d == null || d < 1) return null; for (const r of rules().table) if (d >= r.min) return r.pct; return rules().table.at(-1).pct; }
const dLabel = d => d == null ? "No date" : d < 0 ? `Expired ${-d} day${d===-1?"":"s"} ago` : d === 0 ? "Expires today" : `Expires in ${d} day${d===1?"":"s"}`;
const discLevel = p => p >= 40 ? "l5" : p >= 30 ? "l4" : p >= 20 ? "l3" : p >= 10 ? "l2" : "l1";

/* ---------- icons ---------- */
const I = (() => {
  const s = (p, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;
  return {
    back: s('<path d="M15 5l-7 7 7 7"/>'),
    user: s('<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 19.5c1.3-3.3 4-4.8 7.2-4.8s5.9 1.5 7.2 4.8"/>'),
    gear: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    edit: s('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'),
    camera: s('<path d="M4 8h3l1.6-2.4h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.6"/>'),
    upload: s('<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 15v4h16v-4"/>'),
    flash: s('<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>'),
    bell: s('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    check: s('<path d="M5 12.5l4.2 4.2L19 7"/>'),
    leaf: s('<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19l7-7"/>'),
    coin: s('<circle cx="12" cy="12" r="8"/><path d="M14.5 9.2a3 3 0 1 0 0 5.6M8.5 11h5M8.5 13h5"/>'),
    box: s('<path d="M4 7.5L12 4l8 3.5v9L12 20l-8-3.5z"/><path d="M4 7.5L12 11l8-3.5M12 11v9"/>'),
    scale: s('<path d="M12 4v16M6 20h12M5 8h14M5 8l-2.5 6h5zM19 8l-2.5 6h5z"/>'),
    alert: s('<path d="M12 4L2.8 19.5h18.4z"/><path d="M12 10v4.2M12 17h.01"/>'),
    info: s('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    chev: s('<path d="M9 5l7 7-7 7"/>'),
    out: s('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'),
    lock: s('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
    shield: s('<path d="M12 3l7.5 3v6c0 4.3-3.2 7.7-7.5 9-4.3-1.3-7.5-4.7-7.5-9V6z"/>'),
    list: s('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
    clock: s('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    x: s('<path d="M6 6l12 12M18 6L6 18"/>'),
    retake: s('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>'),
    star: (on) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z" fill="${on ? "#008F65" : "none"}" stroke="${on ? "#008F65" : "#8BC9A0"}" stroke-width="1.6" stroke-linejoin="round"/></svg>`
  };
})();
// Category glyphs used for catalogue items that have no photo yet.
const GLYPH = {
  Fruits:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 18c-4-6-12-6-16 0-6 9-1 30 9 30 3 0 4-2 7-2s4 2 7 2c10 0 15-21 9-30-4-6-12-6-16 0z" fill="#E86A4F"/><path d="M32 18c0-5 2-9 6-11" stroke="#145A32" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M34 12c5-4 11-3 13 0-4 4-9 4-13 0z" fill="#48B66A"/></svg>',
  Vegetables:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M44 20L18 54c-2 2-6-2-4-4l30-26z" fill="#F08A2E"/><path d="M42 22c2-8 8-12 12-12-1 6-4 11-12 12zM42 22c-2-7 0-13 4-15 1 6 0 11-4 15zM42 22c6-3 12-1 15 2-5 3-10 3-15-2z" fill="#48B66A"/></svg>',
  Dairy:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M24 8h16v8l6 8v30a3 3 0 0 1-3 3H21a3 3 0 0 1-3-3V24l6-8z" fill="#FFFFFF" stroke="#8BC9A0" stroke-width="2.5"/><path d="M18 32h28v12H18z" fill="#008F65"/><path d="M24 8h16v5H24z" fill="#48B66A"/></svg>',
  Meat:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 30c0-10 9-18 20-18s18 8 18 16-6 16-16 16c-4 0-6 4-12 4s-10-8-10-18z" fill="#D9604F"/><path d="M24 30c0-5 5-9 11-9s9 4 9 8" stroke="#F8D6D0" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="36" cy="33" r="4" fill="#F8D6D0"/></svg>',
  Bakery:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 34c0-10 10-16 22-16s22 6 22 16v12H10z" fill="#D9A15A"/><path d="M22 24l-4 8M32 22v9M42 24l4 8" stroke="#FBE3CA" stroke-width="3" stroke-linecap="round"/></svg>'
};
const glyph = c => GLYPH[c] || GLYPH.Vegetables;

/* ---------- brand ring ---------- */
const RING_STOPS = ["#145A32","#008F65","#48B66A","#8BC9A0","#B8E8C9","#D7F4DF","#B8E8C9","#8BC9A0","#48B66A","#008F65","#145A32"];
const BRAND_ROT = 260; // dark forest at the left end of the open arch, pastel at the crown
const ringBg = rot => `conic-gradient(from ${rot}deg, ${RING_STOPS.join(",")})`;
function ringColorAt(deg){ // colour of the conic gradient at an angle measured from its start
  const a = ((deg % 360) + 360) % 360, seg = 360 / (RING_STOPS.length - 1), i = Math.min(Math.floor(a / seg), RING_STOPS.length - 2), t = (a - i * seg) / seg;
  const c1 = RING_STOPS[i].match(/\w\w/g).map(h => parseInt(h,16)), c2 = RING_STOPS[i+1].match(/\w\w/g).map(h => parseInt(h,16));
  return `rgb(${c1.map((v,k) => Math.round(v + (c2[k]-v)*t)).join(",")})`;
}
function capStyle(angle, rot, band){ // a round end-cap centred on the band at `angle` (clockwise from 12 o'clock)
  const r = 50 * (1 - band / 2), rad = angle * Math.PI / 180, size = band * 50;
  return `left:${50 + r * Math.sin(rad)}%;top:${50 - r * Math.cos(rad)}%;width:${size}%;height:${size}%;background:${ringColorAt(angle - rot)}`;
}
function miniLogo(px, {sweep = 200, rot = BRAND_ROT, band = .26, tag = "div", attrs = ""} = {}){
  const from = -sweep / 2;
  return `<${tag} class="mini-logo" style="width:${px}px;height:${px}px" ${attrs}>
    <div class="ring" style="--band:${band*100}%;--from:${from}deg;--sweep:${sweep}deg;background:${ringBg(rot)}"></div>
    <i class="cap" style="${capStyle(from, rot, band)}"></i><i class="cap" style="${capStyle(from + sweep, rot, band)}"></i>
    <span style="font-size:${Math.round(px * .33)}px">S.L</span></${tag}>`;
}

/* ============================================================
   DATA LAYER — artifact db (shared) or local fallback
   ============================================================ */
const COLS = ["products","offers","notifications","settings","customers"];
const DB = {
  db: null, mode: "local", data: Object.fromEntries(COLS.map(c => [c, {}])), ready: false, listeners: new Set(), q: {},
  async init(){
    let db = null;
    try { if (window.claude?.use) db = await Promise.race([window.claude.use("db"), sleep(9000).then(() => null)]); } catch { db = null; }
    if (db) {
      this.db = db; this.mode = "db";
      await Promise.all(COLS.map(c => new Promise(res => {
        let first = true; const done = () => { if (first) { first = false; res(); } };
        try {
          db.collection(c).onSnapshot(snap => {
            const o = {}; snap.docs.forEach(d => { if (d.exists) o[d.id] = d.data(); });
            this.data[c] = o; done(); this.emit(c);
          }, err => { console.warn("db", c, err?.code); done(); });
        } catch (e) { console.warn(e); done(); }
        setTimeout(done, 7000);
      })));
    } else {
      const saved = lsGet("sl_local"); if (saved) for (const c of COLS) this.data[c] = saved[c] || {};
    }
    this.ready = true; this.emit("*");
  },
  get(c, id){ return this.data[c]?.[id]; },
  list(c){ return Object.entries(this.data[c] || {}).map(([id, v]) => ({id, ...v})); },
  emit(c){ for (const fn of this.listeners) try { fn(c); } catch (e) { console.error(e); } },
  on(fn){ this.listeners.add(fn); return () => this.listeners.delete(fn); },
  saveLocal(){ if (this.mode === "local") lsSet("sl_local", this.data); },
  run(key, fn){ const p = (this.q[key] || Promise.resolve()).then(fn, fn); this.q[key] = p.catch(() => {}); return p; },
  async set(c, id, v){
    v = JSON.parse(JSON.stringify(v));
    this.data[c] = {...this.data[c], [id]: v}; this.emit(c);
    if (this.mode === "db") return this.run(c + "/" + id, () => this.db.collection(c).doc(id).set(v)).catch(e => { toast("Couldn't save: " + (e?.message || e?.code || "unknown error")); throw e; });
    this.saveLocal();
  },
  async patch(c, id, patchObj){ const cur = clone(this.get(c, id)) || {}; return this.set(c, id, deepMerge(cur, patchObj)); },
  async del(c, id){
    const o = {...this.data[c]}; delete o[id]; this.data[c] = o; this.emit(c);
    if (this.mode === "db") return this.run(c + "/" + id, () => this.db.collection(c).doc(id).delete());
    this.saveLocal();
  }
};
function deepMerge(a, b){ for (const k in b) { if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) a[k] = deepMerge(a[k], b[k]); else a[k] = b[k]; } return a; }

/* ---------- session ---------- */
const S = { session: lsGet("sl_session"), mapView: null, selStore: null, storeCat: "All", storeSort: "rec", draft: lsGet("sl_draft"), invFilter: "all" };
const me = () => ACCOUNTS.find(a => a.id === S.session?.id) || null;
const setSession = acc => { S.session = acc ? {id: acc.id, role: acc.role} : null; lsSet("sl_session", S.session); };
function customerDoc(){
  const acc = me(); if (!acc) return null;
  return DB.get("customers", acc.id) || {name: acc.name, prefs: ["Fruits","Vegetables","Dairy"], points: 1250, demoStart: 1250, awarded: {}, surveys: {}, notify: {offers: true, points: true}};
}
async function saveCustomer(patchObj){ const acc = me(); const cur = clone(customerDoc()); await DB.set("customers", acc.id, deepMerge(cur, patchObj)); }

/* ============================================================
   NAVIGATION — a stack of live views
   ============================================================ */
const app = document.getElementById("app");
const stack = [];
const GUARD = {cdash:"customer", store:"customer", profile:"customer", edash:"staff", inventory:"staff", scan:"staff", analyze:"staff", survey:"staff", assess:"staff", eproduct:"staff", notifs:"staff"};
function allowed(name){
  const need = GUARD[name]; if (!need) return true; const acc = me(); if (!acc) return false;
  return need === "customer" ? acc.role === "customer" : STAFF(acc.role);
}
function go(name, params = {}, {anim = "right", replace = false, reset = false} = {}){
  if (!allowed(name)) { setSession(null); return go("welcome", {skip: true}, {reset: true, anim: "fade"}); }
  const el = document.createElement("section"); el.className = "view"; el.dataset.view = name;
  const prev = stack.at(-1);
  const enter = anim === "up" ? "enter-up" : anim === "fade" ? "exit-fade" : anim === "none" ? "" : "enter-right";
  if (enter) el.classList.add(enter);
  app.appendChild(el);
  const ctl = VIEWS[name](el, params) || {};
  const entry = {name, params, el, ctl};
  const drop = reset ? stack.splice(0) : replace && prev ? [stack.pop()] : [];
  stack.push(entry);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (enter) el.classList.remove(enter);
    if (prev && !drop.includes(prev)) { prev.el.classList.add(anim === "right" ? "exit-left" : "exit-fade"); setTimeout(() => { prev.el.style.visibility = "hidden"; prev.el.inert = true; }, 480); }
    for (const d of drop) { d.el.classList.add("exit-fade"); setTimeout(() => destroy(d), 500); }
  }));
  return entry;
}
function destroy(entry){ try { entry.ctl.destroy?.(); } catch {} entry.el.remove(); }
function back(){
  if (stack.length < 2) return;
  const top = stack.pop(), prev = stack.at(-1);
  prev.el.style.visibility = ""; prev.el.inert = false;
  requestAnimationFrame(() => { prev.el.classList.remove("exit-left", "exit-fade"); top.el.classList.add("exit-right"); });
  setTimeout(() => destroy(top), 500);
  prev.ctl.resume?.();
}
function backTo(name){ while (stack.length > 1 && stack.at(-1).name !== name) { if (stack.at(-2).name === name) return back(); destroy(stack.splice(stack.length - 2, 1)[0]); } }
DB.on(c => { for (const e of stack) try { e.ctl.refresh?.(c); } catch (err) { console.error(err); } });

/* ---------- overlays ---------- */
function toast(msg, ms = 2600){ const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role","status"); t.textContent = msg; app.appendChild(t); setTimeout(() => t.remove(), ms); }
function sheet(html, bind){
  const back_ = document.createElement("div"); back_.className = "sheet-back";
  const sh = document.createElement("div"); sh.className = "sheet"; sh.setAttribute("role","dialog"); sh.setAttribute("aria-modal","true");
  sh.innerHTML = `<div class="grab"></div>` + html;
  const close = () => { sh.style.animation = "sheetIn .25s reverse both"; back_.style.opacity = 0; back_.style.transition = "opacity .25s"; setTimeout(() => { sh.remove(); back_.remove(); }, 240); };
  back_.onclick = close; app.append(back_, sh); bind?.(sh, close); return close;
}
const topbar = (left, mid, right) => `<header class="topbar">${left || '<span style="width:44px"></span>'}<div class="mid">${mid || ""}</div>${right || '<span style="width:44px"></span>'}</header>`;
const backBtn = (label = "Back") => `<button class="icon-btn plain" data-back aria-label="${label}">${I.back}</button>`;
function bindBack(el){ $$("[data-back]", el).forEach(b => b.onclick = back); }

/* ============================================================
   VIEWS
   ============================================================ */
const VIEWS = {};

/* ---------- 1. Splash → selection ---------- */
VIEWS.welcome = (el, {skip}) => {
  el.classList.add("welcome", "full");
  el.innerHTML = `
    <div class="stage" aria-label="Shelf Life">
      <div class="ring" id="bigRing" style="--band:24%"></div>
      <i class="cap" id="capA" hidden></i><i class="cap" id="capB" hidden></i>
      <div class="mono" style="position:absolute;inset:0;display:grid;place-content:center"><span class="sl">S.L</span><span class="name">Shelf Life</span></div>
    </div>
    ${skip ? "" : `<button class="skip" id="skipBtn">Skip intro</button>`}
    <div class="choices">
      <p class="tagline">Fresh food, fair prices, less waste across Berlin.</p>
      <button class="btn btn-primary b1" id="toCust">${I.user}<span>Customer Login</span></button>
      <button class="btn btn-outline b2" id="toStaff">${I.lock}<span>Employee Login</span></button>
    </div>`;
  const stage = $(".stage", el), ring = $("#bigRing", el), capA = $("#capA", el), capB = $("#capB", el), mono = $(".mono", el), choices = $(".choices", el);
  const band = .24; let raf, stopped = false;
  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  function draw(rot, sweep){
    ring.style.background = ringBg(rot);
    const from = -sweep / 2; ring.style.setProperty("--from", from + "deg"); ring.style.setProperty("--sweep", sweep + "deg");
    const open = sweep < 359.5; capA.hidden = capB.hidden = !open;
    if (open) { capA.style.cssText = capStyle(from, rot, band); capB.style.cssText = capStyle(from + sweep, rot, band); }
  }
  function settle(){
    const H = el.clientHeight, size = stage.clientWidth, sc = Math.min(.5, (H * .34) / size);
    const targetY = Math.max(H * .3, size * sc / 2 + 30);
    stage.style.transform = `translate(-50%, calc(-50% + ${targetY - H / 2}px)) scale(${sc})`;
    setTimeout(() => choices.classList.add("in"), 520);
    $("#skipBtn", el)?.remove();
  }
  const FINAL_SWEEP = 200;
  function finish(){ stopped = true; cancelAnimationFrame(raf); draw(BRAND_ROT, FINAL_SWEEP); mono.classList.add("show"); settle(); }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (skip || reduce) { draw(BRAND_ROT, FINAL_SWEEP); mono.classList.add("show"); stage.style.transition = "none"; settle(); requestAnimationFrame(() => stage.style.transition = ""); }
  else {
    const T_SPIN = 2600, T_OPEN = 1500, total = 720 + BRAND_ROT; // total = degrees turned during the spin
    let t0 = null, textShown = false;
    const frame = ts => {
      if (stopped) return; t0 ??= ts; const t = ts - t0;
      if (t < T_SPIN) { const k = t / T_SPIN; draw(total * (1 - Math.pow(1 - k, 3)), 360); }
      else if (t < T_SPIN + T_OPEN) {
        const k = (t - T_SPIN) / T_OPEN, e = ease(k);
        draw(total + 0 * e, 360 - (360 - FINAL_SWEEP) * e);
        if (!textShown && k > .25) { textShown = true; mono.classList.add("show"); }
      } else { draw(total, FINAL_SWEEP); setTimeout(() => !stopped && (stopped = true, settle()), 750); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    $("#skipBtn", el).onclick = finish;
  }
  $("#toCust", el).onclick = () => go("login", {role: "customer"});
  $("#toStaff", el).onclick = () => go("login", {role: "staff"});
  return {destroy(){ stopped = true; cancelAnimationFrame(raf); }};
};

/* ---------- 2. Sign in (separate customer / employee flows) ---------- */
VIEWS.login = (el, {role}) => {
  const staff = role === "staff";
  const demos = ACCOUNTS.filter(a => staff ? STAFF(a.role) : a.role === "customer");
  el.innerHTML = `
    ${topbar(backBtn("Back to login selection"), miniLogo(46))}
    <div class="stack anim-in" style="margin-top:22px;gap:6px">
      <p class="eyebrow">${staff ? "Staff access" : "Welcome back"}</p>
      <h1 class="hello">${staff ? "Employee Login" : "Customer Login"}</h1>
      <p class="sub">${staff ? "Sign in with your store account. Access to inventory tools is checked against your staff role." : "Sign in to find discounted food near you and collect loyalty points."}</p>
    </div>
    <form class="stack anim-in" id="f" novalidate style="margin-top:22px;animation-delay:.08s">
      <label class="fld" for="em">Email address<input class="inp" id="em" type="email" autocomplete="username" inputmode="email" placeholder="name@example.com" required></label>
      <label class="fld" for="pw">Password<div class="pw"><input class="inp" id="pw" type="password" autocomplete="current-password" placeholder="Your password" required><button type="button" id="eye" aria-pressed="false">Show</button></div></label>
      <p class="err" id="err" role="alert"></p>
      <button class="btn btn-primary" type="submit" id="go">Log in</button>
      <button type="button" class="link" id="forgot" style="justify-self:center">Forgot password?</button>
    </form>
    <div class="card pad stack anim-in" style="margin-top:20px;animation-delay:.16s;gap:8px">
      <div class="row between"><b style="font-size:14px;color:var(--forest)">Demo accounts</b><span class="demo-tag">Prototype</span></div>
      <p class="note">Tap an account to fill the form. These test accounts stand in for the production sign-in service.</p>
      ${demos.map(a => `<button class="opt" data-fill="${a.id}" style="font-size:13.5px"><span class="grow"><b>${esc(a.name)}</b> · ${a.role === "manager" ? "Store manager" : a.role === "employee" ? "Employee" : "Customer"}${a.storeId ? `<br><small class="note">${esc(storeById(a.storeId).name)}</small>` : ""}<br><small class="note tnum">${esc(a.email)} · ${esc(a.pw)}</small></span></button>`).join("")}
    </div>`;
  bindBack(el);
  const em = $("#em", el), pw = $("#pw", el), err = $("#err", el);
  $("#eye", el).onclick = e => { const show = pw.type === "password"; pw.type = show ? "text" : "password"; e.target.textContent = show ? "Hide" : "Show"; e.target.setAttribute("aria-pressed", show); };
  $$("[data-fill]", el).forEach(b => b.onclick = () => { const a = ACCOUNTS.find(x => x.id === b.dataset.fill); em.value = a.email; pw.value = a.pw; err.textContent = ""; });
  $("#forgot", el).onclick = () => sheet(`<h2 style="font-size:20px;color:var(--forest)">Reset your password</h2>
      <p class="sub" style="margin:8px 0 14px">Enter your account email. In the production app this sends a reset link from the authentication service.</p>
      <label class="fld" for="rem">Email address<input class="inp" id="rem" type="email" value="${esc(em.value)}"></label>
      <p class="note" id="rmsg" style="margin-top:10px"></p>
      <button class="btn btn-primary" id="rgo" style="width:100%;margin-top:12px">Send reset link</button>`, (sh, close) => {
        $("#rgo", sh).onclick = () => { const v = $("#rem", sh).value.trim(); $("#rmsg", sh).textContent = /.+@.+\..+/.test(v) ? "Password reset isn't connected in this prototype, so no email was sent. Demo account passwords are listed on the login screen." : "Enter a valid email address."; };
      });
  $("#f", el).onsubmit = async e => {
    e.preventDefault(); err.textContent = "";
    const email = em.value.trim().toLowerCase();
    if (!/.+@.+\..+/.test(email)) return err.textContent = "Enter a valid email address.";
    if (!pw.value) return err.textContent = "Enter your password.";
    const btn = $("#go", el); btn.disabled = true; btn.textContent = "Checking…"; await sleep(450);
    const acc = ACCOUNTS.find(a => a.email === email && a.pw === pw.value);
    btn.disabled = false; btn.textContent = "Log in";
    if (!acc) return err.textContent = "Email or password is incorrect.";
    if (staff && !STAFF(acc.role)) return err.textContent = "This is a customer account. It has no staff permissions. Use Customer Login instead.";
    if (!staff && STAFF(acc.role)) return err.textContent = "This is a staff account. Use Employee Login to reach store tools.";
    setSession(acc);
    go(staff ? "edash" : "cdash", {}, {reset: true, anim: "up"});
  };
};

/* ---------- 3. Customer dashboard ---------- */
VIEWS.cdash = el => {
  const acc = me();
  el.innerHTML = `
    <header class="topbar anim-in">
      <span style="width:44px"></span>
      <button class="mid" id="home" style="border:0;background:none;display:grid;justify-items:center;gap:6px" aria-label="Shelf Life home">
        <span class="brandline">Shelf Life</span>${miniLogo(46)}
      </button>
      <button class="icon-btn" id="prof" aria-label="Open profile and loyalty points">${I.user}</button>
    </header>
    <div class="anim-in" style="animation-delay:.1s;margin-top:14px">
      <h1 class="hello" id="hello"></h1>
      <p class="sub">Welcome back to Shelf Life.</p>
      <span class="pill-status" style="margin-top:8px">Logged in as Customer</span>
    </div>
    <div class="section-h anim-in" style="animation-delay:.2s"><h2>My Preferences</h2><button class="icon-btn plain" id="editPrefs" aria-label="Edit preferences" style="width:40px;height:40px">${I.edit}</button></div>
    <div class="chips anim-in" id="chips" style="animation-delay:.25s"></div>
    <button class="link anim-in" id="editPrefs2" style="animation-delay:.28s;font-size:13.5px">Edit Preferences</button>
    <div class="section-h anim-in" style="animation-delay:.32s"><h2>Supermarkets in Berlin</h2><span class="note">${STORES.length} stores</span></div>
    <div class="split">
      <div class="mlist anim-in" id="mlist" style="animation-delay:.6s" aria-label="Supermarket list"></div>
      <div class="mapbox anim-in" style="animation-delay:.4s"><div id="map" aria-label="Map of Berlin supermarkets"></div><div class="map-note">Districts &amp; postcode areas · street layer not connected</div><div id="callout"></div></div>
    </div>
    <p class="note" style="margin-top:10px">Store addresses and coordinates: berlin.de (Sunday-open supermarkets list). Tap a store to see its products and discounts.</p>`;
  $("#prof", el).onclick = () => go("profile");
  $("#home", el).onclick = () => el.scrollTo({top: 0, behavior: "smooth"});
  $("#editPrefs", el).onclick = $("#editPrefs2", el).onclick = () => openPrefs();
  function paint(){
    const c = customerDoc();
    $("#hello", el).textContent = `Hello, ${firstName(c.name || acc.name)}!`;
    $("#chips", el).innerHTML = CATS.map(k => `<button class="chip ${c.prefs.includes(k) ? "on" : ""}" data-cat="${k}" aria-pressed="${c.prefs.includes(k)}">${k}</button>`).join("");
    $$("#chips .chip", el).forEach(b => b.onclick = () => togglePref(b.dataset.cat));
  }
  paint();
  // list
  $("#mlist", el).innerHTML = STORES.map(s => `<button class="mitem" data-id="${s.id}"><span class="chain">${esc(s.chain)}</span><b>${esc(s.short)}</b><small>${esc(s.area)}</small></button>`).join("");
  $$("#mlist .mitem", el).forEach(b => b.onclick = () => select(b.dataset.id, true));
  // map
  let map = null; const markers = {};
  function buildMap(){
    if (!window.L) { $("#map", el).innerHTML = `<div class="empty" style="height:100%;align-content:center">${I.alert}<span>The map library didn't load. Check your connection and reopen the page. The store list still works.</span></div>`; return; }
    map = L.map($("#map", el), {zoomControl: true, attributionControl: true, minZoom: 10, maxZoom: 17, zoomSnap: .5, preferCanvas: false});
    map.zoomControl.setPosition("topright");
    map.attributionControl.setPrefix(false).addAttribution("Boundaries © Berliner Morgenpost (CC BY) · Stores © berlin.de");
    const canvas = L.canvas({padding: .3});
    GEO.p.forEach(f => f.r.forEach(r => L.polygon(r, {renderer: canvas, color: "#FFFFFF", weight: .8, fillColor: "#E3F5EC", fillOpacity: 1, interactive: false}).addTo(map)));
    const fills = ["#D7F4DF","#CDEEDB","#DDF5E6","#C9EBD6"];
    GEO.d.forEach((f, i) => {
      f.r.forEach(r => L.polygon(r, {color: "#8BC9A0", weight: 1.6, fill: true, fillColor: fills[i % 4], fillOpacity: .35, interactive: false}).addTo(map));
      const ring = f.r.reduce((a, b) => a.length > b.length ? a : b); const c = ring.reduce((m, p) => [m[0] + p[0]/ring.length, m[1] + p[1]/ring.length], [0,0]);
      L.tooltip({permanent: true, direction: "center", className: "district-label", interactive: false}).setLatLng(c).setContent(esc(f.n)).addTo(map);
    });
    STORES.forEach(s => {
      const icon = L.divIcon({className: "", iconSize: [30,38], iconAnchor: [15,37], html: `<div class="pin" data-pin="${s.id}" title="${esc(s.name)}"><svg viewBox="0 0 30 38"><path d="M15 37C15 37 2 22.5 2 14a13 13 0 0 1 26 0c0 8.5-13 23-13 23z" fill="#008F65" stroke="#fff" stroke-width="2"/><circle cx="15" cy="14" r="5.2" fill="#D7F4DF"/></svg></div>`});
      markers[s.id] = L.marker([s.lat, s.lon], {icon, keyboard: true, title: s.name}).addTo(map).on("click", () => select(s.id, false));
    });
    const v = S.mapView; if (v) map.setView(v.c, v.z, {animate: false}); else map.setView([52.512, 13.405], 12, {animate: false});
    map.on("moveend", () => { S.mapView = {c: map.getCenter(), z: map.getZoom()}; });
    if (S.selStore) markSel(S.selStore);
    setTimeout(() => map.invalidateSize(), 600);
  }
  function markSel(id){
    $$(".pin", el).forEach(p => p.classList.toggle("sel", p.dataset.pin === id));
    Object.entries(markers).forEach(([k, m]) => m.setZIndexOffset(k === id ? 1000 : 0));
    $$("#mlist .mitem", el).forEach(b => { b.classList.toggle("sel", b.dataset.id === id); b.setAttribute("aria-current", b.dataset.id === id); });
    const s = storeById(id);
    $("#callout", el).innerHTML = s ? `<div class="map-callout"><b>${esc(s.name)}</b>${esc(s.addr)}<br><span class="note">${esc(s.hours)}</span></div>` : "";
  }
  let navT;
  function select(id, fromList){
    S.selStore = id; markSel(id);
    const s = storeById(id);
    if (map) map.flyTo([s.lat, s.lon], Math.max(map.getZoom(), 14), {duration: .55});
    if (!fromList) $(`#mlist [data-id="${id}"]`, el)?.scrollIntoView({block: "nearest", behavior: "smooth"});
    clearTimeout(navT); navT = setTimeout(() => go("store", {id}), 700);
  }
  setTimeout(buildMap, 50);
  return {
    refresh(c){ if (c === "customers" || c === "*") paint(); },
    resume(){ setTimeout(() => map?.invalidateSize(), 60); paint(); },
    destroy(){ map?.remove(); }
  };
};
async function togglePref(cat){
  const c = customerDoc(); const set = new Set(c.prefs); set.has(cat) ? set.delete(cat) : set.add(cat);
  await saveCustomer({prefs: [...set]});
}
function openPrefs(){
  const c = customerDoc(); let sel = new Set(c.prefs);
  const desc = {Fruits:"Apples, berries, citrus and more", Vegetables:"Salad, roots and seasonal greens", Dairy:"Milk, yogurt, cheese and butter", Meat:"Poultry, beef and sausages", Bakery:"Bread and pastries"};
  sheet(`<h2 style="font-size:21px;color:var(--forest)">Food preferences</h2>
    <p class="sub" style="margin:6px 0 14px">We show matching products first on every supermarket page.</p>
    <div class="stack" id="pl" style="gap:8px"></div>
    <button class="btn btn-primary" id="ps" style="width:100%;margin-top:16px">Save preferences</button>`, (sh, close) => {
      const paint = () => { $("#pl", sh).innerHTML = CATS.map(k => `<button class="opt ${sel.has(k) ? "on" : ""}" data-k="${k}" aria-pressed="${sel.has(k)}"><span class="grow"><b>${k}</b><br><small class="note">${desc[k]}</small></span></button>`).join(""); $$("#pl .opt", sh).forEach(b => b.onclick = () => { sel.has(b.dataset.k) ? sel.delete(b.dataset.k) : sel.add(b.dataset.k); paint(); }); };
      paint();
      $("#ps", sh).onclick = async () => { await saveCustomer({prefs: [...sel]}); close(); toast("Preferences saved"); };
    });
}

/* ---------- 4. Supermarket details & discounts ---------- */
function demoCatalog(storeId){
  const t = today(), r = rng(hash(storeId + "|" + t));
  const items = DEMO_ITEMS.filter(() => r() > .25);
  return items.map((it, i) => {
    const days = 1 + Math.floor(r() * 16), pct = pctForDays(days) || 0;
    return {id: `demo-${i}`, demo: true, name: it.n, category: it.c, unit: it.u, price: it.p, pct, newPrice: +(it.p * (1 - pct/100)).toFixed(2), date: addDays(t, days), dateType: "bestbefore", tint: it.t, desc: it.d, stock: 3 + Math.floor(r() * 18)};
  });
}
function storeOffers(storeId){
  const t = today();
  return DB.list("offers").filter(o => o.storeId === storeId && o.active && !(o.date && o.date < t && o.dateType !== "none")).map(o => ({...o, approved: true}));
}
VIEWS.store = (el, {id}) => {
  const s = storeById(id), acc = me();
  el.innerHTML = `
    ${topbar(backBtn("Back to map"), "", `<div class="row" style="gap:8px">${miniLogo(38)}<b style="color:var(--forest);font-size:14px">${esc(firstName(customerDoc().name || acc.name))}</b></div>`)}
    <div class="anim-in" style="margin-top:8px">
      <p class="eyebrow">${esc(s.chain)} · ${esc(s.area)}</p>
      <h1 class="hello" style="font-size:31px">${esc(s.name)}</h1>
      <p class="sub">${esc(s.addr)}</p><p class="note">${esc(s.hours)}</p>
    </div>
    <div class="section-h anim-in" style="animation-delay:.08s"><h2>Based on Your Preferences</h2>
      <label class="note" for="sort" style="display:flex;align-items:center;gap:6px"><span class="sr" style="position:absolute;left:-9999px">Sort products</span>
        <select class="inp" id="sort" style="min-height:38px;font-size:13px;width:auto;padding-left:10px">
          <option value="rec">Recommended for You</option><option value="disc">Highest Discount</option><option value="exp">Expiring Soon</option><option value="price">Lowest Price</option></select></label></div>
    <div class="scroll-x anim-in" id="cats" style="animation-delay:.12s"></div>
    <div id="legend" class="note" style="margin:6px 0 12px"></div>
    <div class="pgrid" id="grid"></div>`;
  bindBack(el);
  const sortSel = $("#sort", el); sortSel.value = S.storeSort; sortSel.onchange = () => { S.storeSort = sortSel.value; paint(); };
  function paint(){
    const prefs = customerDoc().prefs;
    $("#cats", el).innerHTML = ["All", ...CATS.filter(c => c !== "Bakery")].map(c => `<button class="chip ${S.storeCat === c ? "on" : ""}" data-c="${c}" aria-pressed="${S.storeCat === c}">${c}</button>`).join("");
    $$("#cats .chip", el).forEach(b => b.onclick = () => { S.storeCat = b.dataset.c; paint(); });
    const approved = storeOffers(id), demo = demoCatalog(id);
    let all = [...approved, ...demo].filter(p => S.storeCat === "All" || p.category === S.storeCat);
    const dl = p => daysLeft(p.date) ?? 99, pref = p => prefs.includes(p.category) ? 1 : 0;
    const sorts = {
      rec: (a, b) => pref(b) - pref(a) || (b.approved ? 1 : 0) - (a.approved ? 1 : 0) || b.pct - a.pct || dl(a) - dl(b),
      disc: (a, b) => b.pct - a.pct, exp: (a, b) => dl(a) - dl(b), price: (a, b) => a.newPrice - b.newPrice
    };
    all.sort(sorts[S.storeSort]);
    $("#legend", el).innerHTML = `<span class="ok-tag">Store-approved</span> discounts were confirmed by store staff in Shelf Life. <span class="demo-tag">Demo</span> items are illustrative sample data, not real offers from ${esc(s.chain)}.`;
    $("#grid", el).innerHTML = all.length ? all.map((p, i) => card(p, i)).join("") : `<div class="empty" style="grid-column:1/-1">${I.box}<span>No products in this category yet.</span></div>`;
    $$("#grid .pcard", el).forEach(b => b.onclick = () => productSheet(all.find(p => p.id === b.dataset.id), s));
  }
  function card(p, i){
    const d = daysLeft(p.date), urgent = d != null && d <= 3, pref = customerDoc().prefs.includes(p.category);
    return `<button class="pcard anim-in ${urgent ? "urgent" : ""}" data-id="${esc(p.id)}" style="animation-delay:${Math.min(i, 8) * .04}s">
      <div class="pimg" style="background:${p.photo ? "#0E2A1B" : (p.tint || "var(--pastel)")}">${p.photo ? `<img src="${p.photo}" alt="">` : glyph(p.category)}${p.pct ? `<span class="dbadge ${discLevel(p.pct)}">${p.pct}% OFF</span>` : ""}</div>
      <div class="pbody"><span class="cat">${esc(p.category)}${pref ? " · For you" : ""}</span><b>${esc(p.name)}</b>
        <div class="price"><span class="now tnum">${eur(p.newPrice)}</span>${p.pct ? `<s class="tnum">${eur(p.price)}</s>` : ""}</div>
        <span class="note">per ${esc(p.unit)}</span>
        <span class="exp ${urgent ? "warm" : ""}">${dLabel(d)} · ${fmtDate(p.date)}</span>
        <div class="srcline">${p.approved ? '<span class="ok-tag">Store-approved</span>' : '<span class="demo-tag">Demo</span>'}</div></div></button>`;
  }
  paint();
  return {refresh(c){ if (["offers","customers","settings","*"].includes(c)) paint(); }};
};
function productSheet(p, s){
  const d = daysLeft(p.date);
  sheet(`<div class="pimg" style="border-radius:20px;background:${p.photo ? "#0E2A1B" : (p.tint || "var(--pastel)")};aspect-ratio:16/9">${p.photo ? `<img src="${p.photo}" alt="Photo of ${esc(p.name)}">` : glyph(p.category)}${p.pct ? `<span class="dbadge ${discLevel(p.pct)}">${p.pct}% OFF</span>` : ""}</div>
    <div class="stack" style="margin-top:14px;gap:6px">
      <div class="row between"><span class="eyebrow">${esc(p.category)}</span>${p.approved ? '<span class="ok-tag">Store-approved</span>' : '<span class="demo-tag">Demo data</span>'}</div>
      <h2 style="font-family:var(--f-display);font-size:30px;color:var(--forest);font-weight:600">${esc(p.name)}</h2>
      <p class="sub">${esc(s.name)}</p>
      <div class="price" style="margin-top:6px"><span class="now tnum" style="font-size:28px">${eur(p.newPrice)}</span>${p.pct ? `<s class="tnum">${eur(p.price)}</s><span class="dbadge ${discLevel(p.pct)}" style="position:static">${p.pct}% OFF</span>` : ""}<span class="note">per ${esc(p.unit)}</span></div>
      <dl class="kv" style="margin-top:10px">
        <dt>${p.dateType === "useby" ? "Use by" : p.dateType === "bestbefore" ? "Best before" : "Review date"}</dt><dd>${fmtDate(p.date)} · ${dLabel(d)}</dd>
        <dt>Availability</dt><dd>${p.stock ? `${p.stock} in stock (sample)` : p.qty ? `${p.qty} ${esc(p.qtyUnit || "")} reduced` : "Ask in store"}</dd>
        <dt>About</dt><dd>${esc(p.desc || (p.approved ? "Checked by store staff and reduced to help avoid food waste." : ""))}</dd>
      </dl>
      ${p.approved ? "" : `<p class="note" style="margin-top:8px">Sample product for the prototype. Discount follows the illustrative schedule; it is not a real promotion.</p>`}
    </div>`);
}

/* ---------- 5. Customer profile & loyalty ---------- */
VIEWS.profile = el => {
  const acc = me();
  el.innerHTML = `
    ${topbar(backBtn("Back to dashboard"), "", `<div class="row" style="gap:6px"><button class="icon-btn plain" id="gear" aria-label="Account settings">${I.gear}</button>${miniLogo(40)}</div>`)}
    <div class="anim-in" style="margin-top:6px"><h1 class="hello" id="hello"></h1><p class="sub">Your Shelf Life Profile</p></div>
    <div class="loyal anim-in" style="margin-top:18px;animation-delay:.1s">
      <div class="ring" style="--band:22%;background:${ringBg(0)};-webkit-mask:radial-gradient(farthest-side,transparent 78%,#000 78.4%);mask:radial-gradient(farthest-side,transparent 78%,#000 78.4%)"></div>
      <p style="font-weight:700;opacity:.9;font-size:14px">Your Loyalty Points</p>
      <p class="pts tnum" id="pts" style="margin:8px 0 10px"></p>
      <p style="font-family:var(--f-display);font-size:19px;font-style:italic;opacity:.95">Every sustainable choice makes a difference.</p>
      <p id="ptnote" style="font-size:11.5px;opacity:.8;margin-top:10px"></p>
    </div>
    <details class="card pad anim-in" style="margin-top:10px;animation-delay:.14s"><summary style="font-weight:700;color:var(--forest);cursor:pointer">How you earn points</summary>
      <ul class="why" style="margin-top:8px"><li>+10 for an eligible purchase of discounted food (needs verified till receipts, not yet connected)</li><li>+5 for each feedback survey, once per survey</li><li>+20 for a sustainability milestone (10 products saved)</li></ul></details>
    <div class="section-h anim-in" style="animation-delay:.2s"><h2>Your Impact</h2><span class="demo-tag">Example figures</span></div>
    <div class="stats anim-in" style="animation-delay:.24s">
      <div class="stat">${I.box}<b class="tnum">18</b><span>Products saved</span></div>
      <div class="stat">${I.coin}<b class="tnum">€24.50</b><span>Money saved</span></div>
      <div class="stat">${I.leaf}<b class="tnum">4.2 kg</b><span>Est. food waste avoided</span></div>
    </div>
    <p class="note" style="margin-top:6px">Illustrative values until purchases are linked to your account.</p>
    <div class="section-h anim-in" style="animation-delay:.3s"><h2>Help Us Improve Shelf Life</h2></div>
    <div class="stack anim-in" id="surveys" style="animation-delay:.34s"></div>`;
  bindBack(el);
  $("#gear", el).onclick = customerSettings;
  const local = {s1: null, s2: 0, s2t: "", s3: null, s3m: null};
  function paint(){
    const c = customerDoc();
    $("#hello", el).textContent = `Hello, ${firstName(c.name || acc.name)}!`;
    $("#pts", el).innerHTML = `${(c.points || 0).toLocaleString("en-GB")}<small>Points</small>`;
    $("#ptnote", el).textContent = c.demoStart ? `Includes a ${c.demoStart.toLocaleString("en-GB")}-point demo starting balance.` : "";
    const done = c.surveys || {};
    const opts = (name, list, cur) => list.map(o => `<button class="opt ${cur === o ? "on" : ""}" data-s="${name}" data-v="${esc(o)}" aria-pressed="${cur === o}">${esc(o)}</button>`).join("");
    const doneCard = (title, txt) => `<div class="card pad stack" style="gap:6px"><div class="row between"><b style="color:var(--forest)">${title}</b><span class="ok-tag">${I.check.replace('<svg','<svg style="width:12px;height:12px"')} Sent</span></div><p class="note">${txt}</p></div>`;
    $("#surveys", el).innerHTML = [
      done.s1 ? doneCard("Application experience", `You answered “${esc(done.s1.answer)}”. Thank you!`) :
      `<div class="card pad stack"><p class="eyebrow">Survey 1 · Application experience</p><b style="color:var(--forest)">Was Shelf Life helpful?</b>${opts("s1", ["Yes, definitely!","Somewhat","Not really"], local.s1)}<button class="btn btn-primary btn-sm" data-submit="s1" ${local.s1 ? "" : "disabled"}>Submit · +5 points</button></div>`,
      done.s2 ? doneCard("AI recommendations", `You rated ${done.s2.stars} of 5 stars.`) :
      `<div class="card pad stack"><p class="eyebrow">Survey 2 · AI recommendations</p><b style="color:var(--forest)">Were Shelf Life's AI recommendations relevant to your preferences?</b>
        <div class="stars" role="radiogroup" aria-label="Rating">${[1,2,3,4,5].map(n => `<button data-star="${n}" role="radio" aria-checked="${local.s2 === n}" aria-label="${n} star${n > 1 ? "s" : ""}">${I.star(n <= local.s2)}</button>`).join("")}</div>
        <label class="fld" for="s2t">How could we improve our recommendations? <span class="note">(optional)</span><textarea class="inp" id="s2t" maxlength="500">${esc(local.s2t)}</textarea></label>
        <button class="btn btn-primary btn-sm" data-submit="s2" ${local.s2 ? "" : "disabled"}>Submit · +5 points</button></div>`,
      done.s3 ? doneCard("Sustainability contribution", `You answered “${esc(done.s3.answer)}”${done.s3.motive ? ` · motivated by ${esc(done.s3.motive.toLowerCase())}` : ""}.`) :
      `<div class="card pad stack"><p class="eyebrow">Survey 3 · Sustainability contribution</p><b style="color:var(--forest)">Has Shelf Life helped you make more sustainable shopping choices?</b>${opts("s3", ["Yes, significantly","A little","Not yet"], local.s3)}
        <b style="color:var(--forest);margin-top:4px">What motivates you most to use Shelf Life? <span class="note">(optional)</span></b>${opts("s3m", ["Saving money","Reducing food waste","Finding discounted products","Supporting sustainability"], local.s3m)}
        <button class="btn btn-primary btn-sm" data-submit="s3" ${local.s3 ? "" : "disabled"}>Submit · +5 points</button></div>`
    ].join("");
    $$("[data-s]", el).forEach(b => b.onclick = () => { local[b.dataset.s] = local[b.dataset.s] === b.dataset.v && b.dataset.s === "s3m" ? null : b.dataset.v; paint(); });
    $$("[data-star]", el).forEach(b => b.onclick = () => { local.s2t = $("#s2t", el)?.value || ""; local.s2 = +b.dataset.star; paint(); });
    $("#s2t", el)?.addEventListener("input", e => local.s2t = e.target.value);
    $$("[data-submit]", el).forEach(b => b.onclick = () => submit(b.dataset.submit, b));
  }
  async function submit(k, btn){
    btn.disabled = true;
    const c = customerDoc(); if (c.surveys?.[k]) return;
    const at = new Date().toISOString();
    const resp = k === "s1" ? {answer: local.s1, at} : k === "s2" ? {stars: local.s2, text: ($("#s2t", el)?.value || "").trim(), at} : {answer: local.s3, motive: local.s3m, at};
    const award = !c.awarded?.["survey_" + k];
    await saveCustomer({surveys: {[k]: resp}, awarded: {["survey_" + k]: true}, points: (c.points || 0) + (award ? 5 : 0)});
    toast(award ? "Thanks! +5 loyalty points added" : "Thanks for your feedback");
  }
  paint();
  return {refresh(c){ if (c === "customers" || c === "*") paint(); }};
};
function customerSettings(){
  const acc = me();
  sheet(`<h2 style="font-size:21px;color:var(--forest);margin-bottom:6px">Account settings</h2>
    <button class="list-btn" data-a="info">${I.user}Personal Information<span class="chev">${I.chev}</span></button>
    <button class="list-btn" data-a="prefs">${I.leaf}Food Preferences<span class="chev">${I.chev}</span></button>
    <button class="list-btn" data-a="notif">${I.bell}Notification Settings<span class="chev">${I.chev}</span></button>
    <button class="list-btn" data-a="priv">${I.shield}Privacy &amp; Data<span class="chev">${I.chev}</span></button>
    <button class="list-btn" data-a="out" style="color:var(--hold);border:0">${I.out}Log Out</button>`, (sh, close) => {
      $$("[data-a]", sh).forEach(b => b.onclick = () => {
        const a = b.dataset.a; close();
        setTimeout(() => {
          if (a === "prefs") openPrefs();
          if (a === "out") logout();
          if (a === "info") sheet(`<h2 style="font-size:20px;color:var(--forest)">Personal Information</h2>
            <div class="stack" style="margin-top:12px"><label class="fld" for="nm">Display name<input class="inp" id="nm" value="${esc(customerDoc().name)}" maxlength="60"></label>
            <label class="fld">Email<input class="inp" value="${esc(acc.email)}" disabled></label><button class="btn btn-primary" id="sv">Save</button></div>`, (s2, c2) => {
              $("#sv", s2).onclick = async () => { const v = $("#nm", s2).value.trim(); if (!v) return; await saveCustomer({name: v}); c2(); toast("Name updated"); };
            });
          if (a === "notif") { const n = customerDoc().notify || {}; sheet(`<h2 style="font-size:20px;color:var(--forest)">Notification Settings</h2>
            <div class="stack" style="margin-top:12px">${[["offers","New discounts at my favourite stores"],["points","Loyalty point updates"]].map(([k, l]) => `<button class="opt ${n[k] ? "on" : ""}" data-n="${k}">${l}</button>`).join("")}
            <p class="note">Saved to your account. Delivery of customer alerts arrives with the mobile release.</p></div>`, s2 => {
              $$("[data-n]", s2).forEach(b => b.onclick = async () => { const cur = customerDoc().notify || {}; const v = !cur[b.dataset.n]; b.classList.toggle("on", v); await saveCustomer({notify: {[b.dataset.n]: v}}); });
            }); }
          if (a === "priv") sheet(`<h2 style="font-size:20px;color:var(--forest)">Privacy &amp; Data</h2>
            <p class="sub" style="margin:10px 0">Shelf Life stores your display name, food preferences, loyalty points and survey answers with your account. Store staff never see your survey answers, and you never see store-internal inspection data.</p>
            <p class="note">${DB.mode === "db" ? "This prototype keeps data in the page's shared database, which everyone with access to this prototype can read." : "This prototype is keeping data only in this browser."}</p>
            <button class="btn btn-warn" id="clr" style="width:100%;margin-top:14px">Delete my survey answers</button>`, (s2, c2) => {
              $("#clr", s2).onclick = async () => { const c = clone(customerDoc()); c.surveys = {}; await DB.set("customers", acc.id, c); c2(); toast("Survey answers deleted. Points already earned are kept."); };
            });
        }, 260);
      });
    });
}
function logout(){ setSession(null); go("welcome", {skip: true}, {reset: true, anim: "fade"}); }

/* ============================================================
   EMPLOYEE EXPERIENCE
   ============================================================ */
const STATUS = {
  good:{label:"Good Condition", cls:"good"}, monitor:{label:"Monitor Closely", cls:"monitor"}, review:{label:"Review for Discount", cls:"review"},
  immediate:{label:"Requires Immediate Inspection", cls:"immediate"}, hold:{label:"Hold — Not Approved for Sale", cls:"hold"}, manual:{label:"Manual Review Required", cls:"manual"}
};
const Q = {
  q2:[["excellent","Excellent — no visible imperfections"],["good","Good — minor cosmetic imperfections"],["fair","Fair — visible bruising or discoloration"],["poor","Poor — significant damage or deterioration"],["unsafe","Unsafe or suspicious — possible mold or spoilage"]],
  q3:[["firm","Firm and fresh"],["slightly","Slightly softer than usual"],["soft","Noticeably soft or overripe"],["very","Very soft, leaking or deteriorating"],["na","Not assessed"]],
  q4:[["none","No unusual smell or signs"],["slight","Slightly unusual smell"],["strong","Strong unpleasant smell"],["serious","Visible mold, leaking or other serious signs"],["na","Not assessed"]],
  q5:[["useby","Printed use-by date"],["bestbefore","Printed best-before date"],["harvest","Harvest or packing date"],["delivery","Delivery or stock-entry date"],["none","No reliable date available"]],
  q6:[["fridge","Properly refrigerated"],["room","Properly stored at room temperature"],["produce","Stored under controlled produce conditions"],["inconsistent","Storage conditions may have been inconsistent"],["unknown","Storage history unknown"]]
};
const qLabel = (q, v) => (Q[q].find(o => o[0] === v) || [, "—"])[1];
const myStore = () => storeById(me()?.storeId);
const myProducts = () => DB.list("products").filter(p => p.storeId === me()?.storeId && !p.removed);

/* Transparent rule set: combines AI flags, employee answers and dates. Returns status + the reasons shown on screen. */
function evaluate({condition, texture, smell, dateType, date, storage, excursion, aiMold}){
  const R = [], t = today(), expiry = ["useby","bestbefore"].includes(dateType) && date;
  const d = expiry ? diffDays(t, date) : null;
  let status = "good";
  const bump = (s, why) => { const order = ["good","monitor","manual","review","immediate","hold"]; if (order.indexOf(s) > order.indexOf(status)) status = s; R.push(why); };
  if (condition === "unsafe") bump("hold", "Employee reported possible mold or spoilage → hold from sale.");
  if (smell === "serious") bump("hold", "Visible mold, leaking or serious spoilage signs → hold from sale.");
  if (dateType === "useby" && d != null && d < 0) bump("hold", "Use-by date has passed → must not be sold.");
  if (smell === "strong") bump("immediate", "Strong unpleasant smell → immediate inspection, not offered for sale.");
  if (aiMold) bump("immediate", "AI flagged possible mold → a person must inspect before any sale.");
  if (condition === "poor" || texture === "very") bump("immediate", "Significant deterioration reported → immediate inspection.");
  if (dateType === "bestbefore" && d != null && d < 0) bump("immediate", "Best-before date has passed → inspect before deciding on sale.");
  if (expiry && d != null && d >= 0 && d <= rules().reviewWindow) bump("review", `${d} day${d === 1 ? "" : "s"} until the recorded date (store review window: ${rules().reviewWindow} days).`);
  if (condition === "fair" || texture === "soft") bump("review", "Visible bruising or softness → candidate for a discount.");
  if (smell === "slight") bump("monitor", "Slightly unusual smell → check again soon.");
  if (texture === "slightly") bump("monitor", "Slightly softer than usual → monitor.");
  if (["inconsistent","unknown"].includes(storage) || excursion) bump("monitor", "Storage history is uncertain → shorter inspection interval.");
  if (!expiry) {
    if (texture === "na" && smell === "na") bump("manual", "No reliable expiry date and texture/smell not assessed → manual review required.");
    else R.push("No reliable expiry date → follows a manual inspection schedule, no countdown discount.");
  }
  if (!R.length) R.push("No issues reported and the recorded date is outside the review window.");
  const every = rules().inspectEvery;
  const nextIn = status === "hold" || status === "immediate" ? 0 : every[status] ?? 2;
  let next = addDays(t, nextIn);
  if (expiry && d != null && d > 0) { const ws = addDays(date, -rules().reviewWindow); const cand = ws < t ? t : ws; if (cand < next) next = cand; }
  const priority = {good:"Normal", monitor:"Elevated", manual:"Elevated", review:"High", immediate:"Urgent", hold:"Urgent"}[status];
  return {status, reasons: R, next, priority, daysToDate: d};
}
/* Discount suggestion from configurable rules. null = not eligible (with reason). */
function suggestDiscount(p){
  const t = today();
  if (["hold","immediate"].includes(p.status)) return {pct: null, reason: p.status === "hold" ? "Product is on hold and cannot be offered for sale." : "Needs an immediate inspection before any discount."};
  const expiry = ["useby","bestbefore"].includes(p.dateType) && p.date; const d = expiry ? diffDays(t, p.date) : null;
  if (expiry && d < 1) return {pct: null, reason: p.dateType === "useby" ? "Use-by date reached. Withdraw from sale." : "Best-before date reached. Inspect and decide manually; no automatic discount."};
  if (expiry) {
    const pct = pctForDays(d), cond = p.condition === "fair" ? ", with visible imperfections confirmed by the employee" : p.condition === "good" ? ", with minor cosmetic imperfections confirmed by the employee" : "";
    return {pct, reason: `${d} day${d === 1 ? "" : "s"} before the recorded ${p.dateType === "useby" ? "use-by" : "best-before"} date${cond}.`, d};
  }
  if (["fair","good"].includes(p.condition) && ["review","monitor"].includes(p.status)) return {pct: rules().noDatePct, reason: "No reliable expiry date. Store default for produce with visible imperfections, after employee inspection."};
  return {pct: null, reason: "No reliable expiry date and no condition issue. Keep inspecting on schedule."};
}

/* ---------- monitoring & notifications (runs whenever staff have the app open) ---------- */
let checking = false;
async function runChecks({manual = false} = {}){
  const acc = me(); if (!acc || !STAFF(acc.role) || !DB.ready || checking) return 0;
  checking = true; let created = 0;
  try {
    const t = today(), s = myStore();
    for (const p of myProducts()) {
      const sug = suggestDiscount(p), events = [];
      if (p.dateType === "useby" && p.date && p.date < t && p.status !== "hold") {
        await DB.patch("products", p.id, {status: "hold", statusReason: "Use-by date passed", updatedAt: Date.now()});
        if (p.live) { await DB.patch("products", p.id, {live: null}); await deactivateOffer(p.id); }
        events.push({k: `withdraw-${p.date}`, title: "Remove from sale", body: `${p.name} at ${s.name} passed its use-by date (${fmtDate(p.date)}). It has been put on hold and hidden from customers.`});
      }
      if (p.dateType === "bestbefore" && p.date && p.date < t && !["hold","immediate"].includes(p.status)) {
        await DB.patch("products", p.id, {status: "immediate", statusReason: "Best-before date passed — inspect before deciding on sale", discount: {state: "none", pct: 0}, live: null, nextReview: t, updatedAt: Date.now()});
        if (p.live) await deactivateOffer(p.id);
        events.push({k: `bb-passed-${p.date}`, title: "Inspection needed", body: `${p.name} at ${s.name} passed its best-before date (${fmtDate(p.date)}). Its discount is paused until you inspect it.`});
      }
      if (sug.pct && sug.pct > (p.live?.pct || 0) && p.discount?.state !== "pending") {
        const d = sug.d; const inWindow = d == null || d <= rules().reviewWindow;
        if (inWindow && !(p.discount?.state === "rejected" && p.discount.rejectedUntil && p.discount.rejectedUntil > t)) {
          await DB.patch("products", p.id, {discount: {state: "pending", pct: sug.pct, suggestedPct: sug.pct, reason: sug.reason, at: Date.now(), atDate: t}, status: p.status === "good" || p.status === "monitor" ? "review" : p.status});
          events.push({k: `disc-${sug.pct}-${p.date || t}`, title: "Discount review", body: `Your ${p.name.toLowerCase()} at ${s.name} are approaching their recorded date. Shelf Life suggests ${sug.pct}% off to reduce food waste.`});
        }
      }
      if (p.nextReview && p.nextReview <= t && p.status !== "hold") events.push({k: `review-${p.nextReview}`, title: "Freshness review due", body: `${p.name} at ${s.name} is due for its scheduled quality inspection.`});
      if (p.discount?.state === "pending" && p.discount.atDate && p.discount.atDate < t) events.push({k: `remind-${t}`, title: "Reminder: discount awaiting approval", body: `${p.name}: a ${p.discount.pct}% discount proposal is still waiting for your decision.`});
      for (const e of events) {
        const id = `${p.id}--${e.k}`.replace(/[^\w\-.~:@+]/g, "_");
        if (DB.get("notifications", id)) continue;   // de-duplicate
        await DB.set("notifications", id, {storeId: p.storeId, productId: p.id, title: e.title, body: e.body, read: false, createdAt: Date.now(), forDate: t});
        created++; announce(e, p.id);
      }
    }
  } finally { checking = false; }
  if (manual) toast(created ? `${created} new alert${created > 1 ? "s" : ""}` : "Checked — nothing new to review");
  return created;
}
function announce(e, pid){
  try { if ("Notification" in window && Notification.permission === "granted") new Notification("Shelf Life — Product Alert", {body: e.body}); } catch {}
  const t = document.createElement("div"); t.className = "toast alert"; t.setAttribute("role","alert");
  t.innerHTML = `<b style="color:var(--forest)">Shelf Life — Product Alert</b><span style="font-size:13px">${esc(e.body)}</span><button class="btn btn-primary btn-sm">Review Product</button>`;
  $("button", t).onclick = () => { t.remove(); openNotifProduct(pid); };
  app.appendChild(t); setTimeout(() => t.remove(), 7000);
}
function openNotifProduct(pid){
  DB.list("notifications").filter(n => n.productId === pid && !n.read).forEach(n => DB.patch("notifications", n.id, {read: true}));
  go("eproduct", {id: pid});
}
async function deactivateOffer(pid){ const o = DB.get("offers", pid); if (o) await DB.set("offers", pid, {...clone(o), active: false, endedAt: Date.now()}); }
setInterval(() => runChecks(), 60000);

const thumbHTML = p => `<div class="thumb" style="background:${p.photo ? "#0E2A1B" : "var(--pastel)"}">${p.photo ? `<img src="${p.photo}" alt="">` : glyph(p.category)}</div>`;
const statusPill = s => `<span class="st ${STATUS[s]?.cls || "manual"}">${STATUS[s]?.label || s}</span>`;
const discPill = p => (p.live ? `<span class="st active">${p.live.pct}% live</span>` : "") + (p.discount?.state === "pending" ? `<span class="st pending">${p.discount.pct}% pending</span>` : "");
function prodRow(p){
  return `<button class="prow" data-p="${p.id}">${thumbHTML(p)}<div class="grow" style="display:grid;gap:3px"><b style="color:var(--forest);font-size:14.5px">${esc(p.name)}${p.example ? ' <span class="demo-tag">Example</span>' : ""}</b>
    <div class="row" style="gap:5px;flex-wrap:wrap">${statusPill(p.status)}${discPill(p)}</div>
    <span class="meta">Added ${fmtDate((new Date(p.createdAt || Date.now())).toISOString().slice(0,10))} · Next review ${fmtDate(p.nextReview)}${p.date ? ` · ${p.dateType === "useby" ? "Use by" : p.dateType === "bestbefore" ? "Best before" : "Dated"} ${fmtDate(p.date)}` : ""}</span></div></button>`;
}

/* ---------- Employee dashboard ---------- */
VIEWS.edash = el => {
  const acc = me(), s = myStore();
  el.innerHTML = `
    <header class="topbar">${miniLogo(44)}<div class="mid"></div>
      <div class="row" style="gap:8px"><button class="icon-btn" id="bell" aria-label="Notifications">${I.bell}<span class="badge-dot" id="unread" hidden></span></button><button class="icon-btn" id="gear" aria-label="Profile and settings">${I.user}</button></div></header>
    <div class="anim-in" style="margin-top:10px"><h1 class="hello">Hello, ${esc(firstName(acc.name))}!</h1>
      <p class="sub">Employee Dashboard · <b style="color:var(--forest)">${esc(s.name)}</b></p>
      <span class="pill-status" style="margin-top:8px">${acc.role === "manager" ? "Store manager" : "Employee"} · approvals up to ${rules().maxPct[acc.role]}%</span></div>
    <button class="scan-cta anim-in" id="scan" style="margin-top:18px;animation-delay:.08s"><span class="ci">${I.camera}</span><span><b>Scan a Product</b><span style="opacity:.85;font-size:13.5px">Photo → AI check → freshness survey</span></span></button>
    <div class="tiles anim-in" id="tiles" style="margin-top:14px;animation-delay:.14s"></div>
    <div class="clock anim-in" style="margin-top:14px;animation-delay:.2s">
      <div class="row between"><b style="font-size:13.5px;color:#6B4E0E">Demo clock · test mode</b><span class="tnum" id="clk" style="font-size:13px;font-weight:700;color:#6B4E0E"></span></div>
      <p style="font-size:12px;color:#6B4E0E">Moves Shelf Life's date forward for everyone using this prototype, so reviews and discount alerts can be tested without waiting days.</p>
      <div class="row"><button class="btn btn-ghost btn-sm" data-adv="1">+1 day</button><button class="btn btn-ghost btn-sm" data-adv="3">+3 days</button><button class="btn btn-ghost btn-sm" data-adv="0">Reset</button></div>
      <button class="btn btn-sm btn-outline" id="check">Run review check now</button>
    </div>
    <div id="push" style="margin-top:10px"></div>
    <div class="section-h"><h2>Recently scanned</h2><button class="link" id="all" style="font-size:13.5px">All products</button></div>
    <div class="stack" id="recent"></div>`;
  $("#scan", el).onclick = () => { S.draft = null; lsSet("sl_draft", null); go("scan"); };
  $("#bell", el).onclick = () => go("notifs");
  $("#gear", el).onclick = staffSettings;
  $("#all", el).onclick = () => { S.invFilter = "all"; go("inventory"); };
  $("#check", el).onclick = () => runChecks({manual: true});
  $$("[data-adv]", el).forEach(b => b.onclick = async () => { const n = +b.dataset.adv; await DB.set("settings", "clock", {offset: n === 0 ? 0 : clockOffset() + n, at: Date.now()}); toast(n ? `Demo clock moved to ${fmtDate(today())}` : "Demo clock reset to today"); runChecks(); });
  function paint(){
    const ps = myProducts(), t = today();
    const soon = ps.filter(p => ["review","immediate","manual"].includes(p.status) || (p.date && diffDays(t, p.date) <= rules().reviewWindow && p.status !== "hold"));
    const tiles = [["all","Products Monitored", ps.length,""],["soon","Expiring Soon", soon.length,"t2"],["pending","Pending Discounts", ps.filter(p => p.discount?.state === "pending").length,"t3"],["active","Active Discounts", ps.filter(p => p.live).length,"t4"]];
    $("#tiles", el).innerHTML = tiles.map(([k, l, n, c]) => `<button class="tile ${c}" data-f="${k}"><b class="tnum">${DB.ready ? n : "–"}</b><span>${l}</span></button>`).join("");
    $$("#tiles .tile", el).forEach(b => b.onclick = () => { S.invFilter = b.dataset.f; go("inventory"); });
    $("#clk", el).textContent = `${fmtDate(t)}${clockOffset() ? ` (+${clockOffset()} d)` : ""}`;
    const unread = DB.list("notifications").filter(n => n.storeId === acc.storeId && !n.read).length;
    $("#unread", el).hidden = !unread; $("#unread", el).textContent = unread;
    const recent = [...ps].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 6);
    $("#recent", el).innerHTML = !DB.ready ? `<div class="skel" style="height:78px"></div><div class="skel" style="height:78px"></div>` :
      recent.length ? recent.map(prodRow).join("") : `<div class="empty card">${I.camera}<b style="color:var(--forest)">No products monitored yet</b><span>Tap “Scan a Product” to photograph your first batch. It will appear here with its next review date.</span></div>`;
    $$("#recent .prow", el).forEach(b => b.onclick = () => go("eproduct", {id: b.dataset.p}));
    const push = $("#push", el);
    const perm = "Notification" in window ? Notification.permission : "unsupported";
    push.innerHTML = perm === "default" ? `<button class="btn btn-ghost btn-sm" id="pushBtn" style="width:100%">${I.bell} Allow push alerts on this device</button>` :
      `<p class="note">${perm === "granted" ? "Push alerts are on for this device." : "Push alerts aren't available in this view, so alerts appear in the app (bell icon)."}</p>`;
    $("#pushBtn", el)?.addEventListener("click", async () => { try { await Notification.requestPermission(); } catch {} paint(); });
  }
  paint(); if (DB.ready) runChecks();
  return {refresh(c){ paint(); if (c === "*") runChecks(); }, resume: paint};
};
function staffSettings(){
  const acc = me(), r = rules();
  sheet(`<h2 style="font-size:21px;color:var(--forest)">${esc(acc.name)}</h2><p class="sub">${acc.role === "manager" ? "Store manager" : "Employee"} · ${esc(myStore().name)}</p><p class="note">${esc(acc.email)}</p>
    <div class="card pad" style="margin-top:14px"><b style="color:var(--forest)">Store discount rules</b><span class="demo-tag" style="margin-left:6px">Demo values</span>
      <dl class="kv" style="margin-top:10px">${r.table.map((x, i) => `<dt>${i === 0 ? `${x.min}+ days` : x.min === r.table[i-1].min - 1 ? `${x.min} day${x.min > 1 ? "s" : ""}` : `${x.min}–${r.table[i-1].min - 1} days`}</dt><dd class="tnum">${x.pct}%</dd>`).join("")}
      <dt>Review window</dt><dd>${r.reviewWindow} days before the date</dd><dt>No-date default</dt><dd>${r.noDatePct}% after inspection</dd><dt>Your approval limit</dt><dd>${r.maxPct[acc.role]}%</dd></dl>
      <p class="note" style="margin-top:8px">Percentages are prototype values, set per supermarket. They don't decide food safety or legal sale eligibility.</p></div>
    <button class="list-btn" id="notifs">${I.bell}Notification history<span class="chev">${I.chev}</span></button>
    <button class="list-btn" id="out" style="color:var(--hold);border:0">${I.out}Log Out</button>`, (sh, close) => {
      $("#out", sh).onclick = () => { close(); logout(); };
      $("#notifs", sh).onclick = () => { close(); go("notifs"); };
    });
}

/* ---------- Inventory / monitoring dashboard ---------- */
VIEWS.inventory = el => {
  const F = [["all","All Products"],["good","Good Condition"],["soon","Review Soon"],["discount","Discount Recommended"],["active","Active Discount"],["hold","Hold / Remove From Sale"]];
  el.innerHTML = `${topbar(backBtn(), `<b style="color:var(--forest)">Monitored inventory</b>`)}
    <p class="sub" style="text-align:center">${esc(myStore().name)}</p>
    <div class="scroll-x" id="f" style="margin-top:12px"></div><div class="stack" id="l" style="margin-top:10px"></div>`;
  bindBack(el);
  if (S.invFilter === "pending") S.invFilter = "discount";
  function paint(){
    const t = today(), ps = myProducts();
    const test = {all: () => true, good: p => p.status === "good", soon: p => ["monitor","review","immediate","manual"].includes(p.status) || (p.nextReview && p.nextReview <= addDays(t, 1)),
      discount: p => p.discount?.state === "pending" || (p.status === "review" && !p.live), active: p => !!p.live, hold: p => ["hold"].includes(p.status) || p.status === "immediate"};
    $("#f", el).innerHTML = F.map(([k, l]) => `<button class="chip ${S.invFilter === k ? "on" : ""}" data-k="${k}">${l} <span class="tnum" style="opacity:.75">${ps.filter(test[k]).length}</span></button>`).join("");
    $$("#f .chip", el).forEach(b => b.onclick = () => { S.invFilter = b.dataset.k; paint(); });
    const list = ps.filter(test[S.invFilter] || test.all).sort((a, b) => (a.nextReview || "9").localeCompare(b.nextReview || "9"));
    $("#l", el).innerHTML = list.length ? list.map(prodRow).join("") : `<div class="empty card">${I.list}<span>No products in this group.</span></div>`;
    $$("#l .prow", el).forEach(b => b.onclick = () => go("eproduct", {id: b.dataset.p}));
  }
  paint(); return {refresh: paint};
};

/* ---------- Camera ---------- */
VIEWS.scan = el => {
  el.classList.add("cam");
  el.innerHTML = `${topbar(backBtn(), "", miniLogo(38))}
    <h1 style="font-size:22px;font-weight:800;text-align:center;margin-top:6px">Take a photo of the product</h1>
    <p style="text-align:center;font-size:13.5px;color:#B8E8C9;margin:6px auto 0;max-width:34ch">Place the fruit or vegetable in the center of the frame for the best AI analysis.</p>
    <div class="viewfinder" id="vf"><video id="vid" playsinline muted hidden></video><img id="prev" alt="Captured product photo" hidden><div class="guide" id="guide"></div><div class="vf-empty" id="vfmsg">Starting camera…</div></div>
    <div class="cam-ctrl" id="ctrl"></div>
    <input type="file" id="fCam" accept="image/*" capture="environment" hidden><input type="file" id="fUp" accept="image/*" hidden>`;
  bindBack(el);
  const vid = $("#vid", el), prev = $("#prev", el), msg = $("#vfmsg", el); let stream = null, torch = false, photo = null;
  const side = (id, icon, label, extra = "") => `<div class="side"><button class="icon-btn" id="${id}" aria-label="${label}" ${extra}>${icon}</button><span>${label}</span></div>`;
  function controls(){
    $("#ctrl", el).innerHTML = photo
      ? `${side("retake", I.retake, "Retake")}<button class="shutter" id="use" aria-label="Use this photo">${I.check}</button>${side("up2", I.upload, "Upload")}`
      : `${side("up", I.upload, "Upload")}<button class="shutter" id="shoot" aria-label="Take photo">${I.camera}</button>${side("flash", I.flash, stream ? (torch ? "Flash on" : "Flash") : "Flash", stream ? "" : "disabled")}`;
    $("#up", el)?.addEventListener("click", () => $("#fUp", el).click());
    $("#up2", el)?.addEventListener("click", () => $("#fUp", el).click());
    $("#retake", el)?.addEventListener("click", () => { photo = null; prev.hidden = true; $("#guide", el).hidden = false; if (stream) vid.hidden = false; else msg.hidden = false; controls(); });
    $("#use", el)?.addEventListener("click", usePhoto);
    $("#flash", el)?.addEventListener("click", async () => { try { torch = !torch; await stream.getVideoTracks()[0].applyConstraints({advanced: [{torch}]}); } catch { torch = false; toast("Flash isn't supported on this camera"); } controls(); });
    $("#shoot", el)?.addEventListener("click", () => {
      if (stream && vid.videoWidth) { const c = document.createElement("canvas"); c.width = vid.videoWidth; c.height = vid.videoHeight; c.getContext("2d").drawImage(vid, 0, 0); c.toBlob(b => setPhoto(b), "image/jpeg", .92); }
      else $("#fCam", el).click();
    });
  }
  async function setPhoto(blob){
    if (!blob || !/^image\//.test(blob.type)) return toast("Choose an image file (JPEG, PNG, HEIC or WebP).");
    try { photo = await prepImages(blob); } catch { return toast("This image couldn't be read. Try another photo."); }
    prev.src = photo.thumb; prev.hidden = false; vid.hidden = true; msg.hidden = true; $("#guide", el).hidden = true; controls();
  }
  $("#fCam", el).onchange = e => setPhoto(e.target.files[0]);
  $("#fUp", el).onchange = e => setPhoto(e.target.files[0]);
  function usePhoto(){
    S.draft = {photo: photo.thumb, ai: null, aiStatus: "pending", answers: {q1: {}, q6: {}}, startedAt: Date.now()};
    S.aiBlob = photo.blob; lsSet("sl_draft", S.draft); stop(); go("analyze", {}, {replace: true});
  }
  function stop(){ stream?.getTracks().forEach(t => t.stop()); stream = null; }
  (async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw 0;
      stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: {ideal: "environment"}, width: {ideal: 1600}}, audio: false});
      vid.srcObject = stream; await vid.play(); vid.hidden = false; msg.hidden = true;
    } catch {
      stream = null;
      msg.innerHTML = `<span>Live preview isn't available here.<br><b style="color:#fff">Tap the green button</b> to open your phone's camera, or upload a photo.</span>`;
    }
    controls();
  })();
  controls();
  return {destroy: stop};
};
async function prepImages(file){
  const bmp = await createImageBitmap(file).catch(() => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); }));
  const draw = (max, q) => { const sc = Math.min(1, max / Math.max(bmp.width, bmp.height)); const c = document.createElement("canvas"); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); return c; };
  const big = draw(1280, .86); const blob = await new Promise(r => big.toBlob(r, "image/jpeg", .86));
  const thumb = draw(420, .78).toDataURL("image/jpeg", .78);
  return {blob, thumb};
}

/* ---------- AI analysis ---------- */
const AI_PROMPT = `You are the visual-inspection assistant inside Shelf Life, a supermarket food-waste app. A store employee photographed one product (usually a fruit or vegetable).
Describe ONLY what is visible in the photo. Never estimate an expiry date, remaining shelf life, internal freshness, taste, or microbial/food safety — a photo cannot show those.
Return JSON only, with exactly these keys:
{"identified": boolean, "product": string (common English plural name, e.g. "Apples"; "" if unknown), "category": "Fruits"|"Vegetables"|"Dairy"|"Meat"|"Bakery"|"Other",
 "confidence": "high"|"moderate"|"low", "visible_color": string (short), "bruising": "none"|"minor"|"moderate"|"severe"|"unclear",
 "discoloration": "none"|"minor"|"moderate"|"severe"|"unclear", "surface_damage": "none"|"minor"|"moderate"|"severe"|"unclear",
 "possible_mold": boolean, "deterioration_notes": string (one short sentence), "image_quality": "good"|"fair"|"poor", "image_quality_note": string (short, "" if good),
 "observation": string (one plain sentence summarising visible condition), "suggested_condition": "excellent"|"good"|"fair"|"poor"|"unsafe"}
If the image does not show food or is too unclear, set identified false and confidence low.`;
VIEWS.analyze = el => {
  const dr = S.draft;
  if (!dr) { setTimeout(() => go("edash", {}, {reset: true}), 0); return {}; }
  el.innerHTML = `${topbar(backBtn(), `<b style="color:var(--forest)">AI Product Analysis</b>`)}
    <div class="scanimg" id="si"><img src="${dr.photo}" alt="Product photo being analysed"><div class="grid"></div><div class="beam"></div></div>
    <p class="statusmsg" id="msg" aria-live="polite">Identifying the product...</p><div id="res" class="stack" style="margin-top:16px"></div>`;
  bindBack(el);
  const msgs = ["Identifying the product...","Analyzing visible characteristics...","Checking for signs of deterioration...","Preparing your freshness assessment..."];
  let i = 0, alive = true; const tick = setInterval(() => { i = (i + 1) % msgs.length; const m = $("#msg", el); if (m) { m.textContent = msgs[i]; m.style.animation = "none"; m.offsetHeight; m.style.animation = ""; } }, 1100);
  (async () => {
    const started = Date.now(); let ai = null, status = "unavailable", detail = "";
    try {
      const sample = window.claude?.use ? await Promise.race([window.claude.use("sample"), sleep(8000).then(() => null)]) : null;
      const lim = sample ? await sample.limits().catch(() => null) : null;
      if (sample && lim?.images && S.aiBlob) {
        ai = await sample.json(AI_PROMPT + "\nReturn the JSON object now.", {images: [S.aiBlob], modelTier: "default", cache: false});
        status = ai && typeof ai === "object" ? "ok" : "error";
      } else detail = !S.aiBlob ? "The photo is no longer in memory (the page was reloaded). Retake it to run the analysis." : "";
    } catch (e) { status = "error"; detail = e?.code === "not_granted" ? "Claude access was declined for this page." : e?.code === "rate_limited" ? "Too many analysis requests. Wait a minute and retake the photo." : ""; ai = null; }
    await sleep(Math.max(0, 3400 - (Date.now() - started)));
    if (!alive) return; clearInterval(tick);
    dr.ai = status === "ok" ? ai : null; dr.aiStatus = status;
    if (dr.ai) { const name = dr.ai.identified && dr.ai.product ? dr.ai.product : ""; dr.answers.q1 = {name, category: CATS.includes(dr.ai.category) ? dr.ai.category : (catOf(name) || "Fruits"), confirmed: false}; }
    lsSet("sl_draft", dr); show(detail);
  })();
  function show(detail){
    $("#si", el).classList.add("done"); $("#msg", el).textContent = dr.aiStatus === "ok" ? "Analysis complete" : "No AI result";
    const a = dr.ai;
    $("#res", el).innerHTML = a ? `
      <div class="card pad stack">
        <div class="row between"><b style="color:var(--forest)">AI visual observations</b><span class="st ${a.confidence === "high" ? "good" : a.confidence === "moderate" ? "review" : "hold"}">Confidence: ${esc(a.confidence)}</span></div>
        <dl class="obs"><dt>Product identified</dt><dd>${esc(a.identified && a.product ? a.product : "Not identified")}</dd><dt>Category</dt><dd>${esc(a.category)}</dd>
          <dt>Visible appearance</dt><dd>${esc(a.visible_color)}</dd><dt>Bruising</dt><dd>${esc(a.bruising)}</dd><dt>Discoloration</dt><dd>${esc(a.discoloration)}</dd><dt>Surface damage</dt><dd>${esc(a.surface_damage)}</dd>
          <dt>Possible mold</dt><dd>${a.possible_mold ? "Yes — flagged" : "None visible"}</dd><dt>Image quality</dt><dd>${esc(a.image_quality)}${a.image_quality_note ? ` · ${esc(a.image_quality_note)}` : ""}</dd></dl>
        <p style="font-size:14px"><b>AI observation:</b> ${esc(a.observation)}</p>
        <p class="note">Visual observations only. The photo can't show expiry dates, internal freshness or food safety; the employee survey and printed dates decide those.</p>
      </div>
      ${a.possible_mold || a.suggested_condition === "unsafe" ? `<div class="flag hold">${I.alert}<span>Possible mold or unsafe deterioration was seen. The product will be flagged for manual inspection and won't be offered for discounted sale automatically.</span></div>` : ""}
      ${!a.identified || a.confidence === "low" ? `<div class="flag warm">${I.info}<span>The product couldn't be identified with confidence. Please confirm or correct it in Question 1.</span></div>` : ""}
      ${a.image_quality === "poor" ? `<div class="flag warm">${I.camera}<span>Image quality is poor. Consider retaking the photo in better light.</span></div>` : ""}`
    : `<div class="card pad stack"><div class="row between"><b style="color:var(--forest)">AI analysis unavailable</b><span class="demo-tag">No AI result</span></div>
        <p class="sub">${esc(detail) || "Image analysis needs Claude access for this page, which isn't available in this view."} No observations were generated, so nothing here is guessed. You'll identify the product and record its condition in the survey.</p></div>`;
    $("#res", el).insertAdjacentHTML("beforeend", `<button class="btn btn-primary" id="cont">Continue to Freshness Survey</button><button class="btn btn-ghost" id="re">${I.retake} Retake photo</button>`);
    $("#cont", el).onclick = () => go("survey", {}, {replace: true});
    $("#re", el).onclick = () => go("scan", {}, {replace: true});
  }
  return {destroy(){ alive = false; clearInterval(tick); }};
};

/* ---------- Six-question freshness survey ---------- */
VIEWS.survey = el => {
  const dr = S.draft; if (!dr) { setTimeout(() => go("edash", {}, {reset: true}), 0); return {}; }
  const A = dr.answers; A.q1 ||= {}; A.q6 ||= {};
  const ai = dr.ai, aiCond = ai?.suggested_condition, aiName = ai?.identified && ai?.product ? ai.product : "";
  const all = [...PRODUCE.Fruits, ...PRODUCE.Vegetables];
  const opts = (q, cur, aiPick) => Q[q].map(([v, l]) => `<button class="opt ${cur === v ? "on" : ""}" data-q="${q}" data-v="${v}" aria-pressed="${cur === v}">${esc(l)}${aiPick === v ? '<span class="ai">AI suggests</span>' : ""}</button>`).join("");
  el.innerHTML = `${topbar(backBtn(), `<b style="color:var(--forest)">Product Freshness Check</b>`)}
    <div class="row" style="gap:14px;margin-top:6px"><div class="thumb" style="width:76px;height:76px;border-radius:18px"><img src="${dr.photo}" alt=""></div>
      <div class="grow"><p class="eyebrow">${ai ? "AI identified" : "Photo"}</p><b style="font-size:19px;color:var(--forest)">${esc(aiName || "Product to confirm")}</b><p class="note">Help Shelf Life assess the product's condition and determine when it may need a discount.</p></div></div>
    <div class="progress"><div class="row between" style="margin-bottom:6px"><b id="qlbl" style="font-size:13px;color:var(--forest)"></b><span class="note tnum" id="qcount"></span></div><div class="bar"><i id="qbar"></i></div></div>
    <div class="stack" style="gap:14px" id="qs">
      <section class="qcard" id="c1"><p class="qn">Question 1 of 6</p><h3>What product are you assessing?</h3>
        ${aiName ? `<button class="opt ${A.q1.confirmed ? "on" : ""}" id="conf">Confirm “${esc(aiName)}”<span class="ai">AI suggestion</span></button>` : `<p class="note">${ai ? "The AI couldn't identify the product." : "No AI identification."} Search or type the product name.</p>`}
        <label class="fld" for="pname">${aiName ? "Or choose / type another product" : "Product name"}<input class="inp" id="pname" list="plist" autocomplete="off" placeholder="Search fruits and vegetables" value="${esc(A.q1.name || "")}"></label>
        <datalist id="plist">${all.map(n => `<option value="${n}">`).join("")}</datalist>
        <label class="fld" for="pcat">Category<select class="inp" id="pcat">${CATS.map(c => `<option ${A.q1.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></label>
        <label class="fld" for="batch">Inventory or batch reference <span class="note">(optional)</span><input class="inp" id="batch" placeholder="e.g. LOT 2410-A" value="${esc(A.q1.batch || "")}"></label></section>
      <section class="qcard" id="c2"><p class="qn">Question 2 of 6</p><h3>How would you describe the product's visible condition?</h3>${ai ? `<p class="note">The AI suggestion is a starting point. Your answer is what counts.</p>` : ""}<div class="stack" style="gap:8px">${opts("q2", A.q2, aiCond)}</div></section>
      <section class="qcard" id="c3"><p class="qn">Question 3 of 6</p><h3>How does the product feel when inspected?</h3><p class="note">Normal firmness depends on the product: ripe avocados or peaches are naturally softer than apples or carrots.</p><div class="stack" style="gap:8px">${opts("q3", A.q3)}</div></section>
      <section class="qcard" id="c4"><p class="qn">Question 4 of 6</p><h3>Have you noticed any unusual smell or signs of spoilage?</h3><div class="stack" style="gap:8px">${opts("q4", A.q4)}</div><div id="q4flag"></div></section>
      <section class="qcard" id="c5"><p class="qn">Question 5 of 6</p><h3>What date information is available for this product?</h3><p class="note">Use-by and best-before dates mean different things: food past its use-by date must not be sold; best-before is a quality date.</p>
        <div class="stack" style="gap:8px">${opts("q5", A.q5?.type)}</div><label class="fld" for="dt" id="dtl">Date<input class="inp" type="date" id="dt" value="${esc(A.q5?.date || "")}"></label></section>
      <section class="qcard" id="c6"><p class="qn">Question 6 of 6</p><h3>How has the product been stored?</h3><div class="stack" style="gap:8px">${opts("q6", A.q6.storage)}</div>
        <div class="row" style="gap:10px;align-items:end"><label class="fld grow" for="tmp">Storage temperature °C <span class="note">(optional)</span><input class="inp" id="tmp" type="number" inputmode="decimal" step="0.5" value="${esc(A.q6.temp ?? "")}"></label></div>
        <button class="opt ${A.q6.excursion ? "on" : ""}" id="exc">Report a known temperature excursion</button></section>
    </div>
    <p class="err" id="err" style="margin-top:12px" role="alert"></p>
    <button class="btn btn-primary" id="gen" style="width:100%;margin-top:6px">Generate Product Assessment</button>`;
  bindBack(el);
  const save = () => lsSet("sl_draft", dr);
  const answered = () => [!!(A.q1.name || "").trim(), !!A.q2, !!A.q3, !!A.q4, !!A.q5?.type && (A.q5.type === "none" || !!A.q5.date), !!A.q6.storage];
  function progress(){
    const a = answered(), n = a.filter(Boolean).length, nextQ = a.indexOf(false);
    $("#qbar", el).style.width = (n / 6 * 100) + "%"; $("#qcount", el).textContent = `${n}/6 answered`;
    $("#qlbl", el).textContent = nextQ < 0 ? "All 6 questions answered" : `Question ${nextQ + 1} of 6`;
    a.forEach((v, i) => $("#c" + (i + 1), el).classList.toggle("done", v));
    const dt = $("#dt", el), none = A.q5?.type === "none"; dt.disabled = none || !A.q5?.type; $("#dtl", el).style.opacity = none ? .4 : 1;
    $("#q4flag", el).innerHTML = ["strong","serious"].includes(A.q4) ? `<div class="flag hold">${I.alert}<span>This product will be flagged for immediate review and won't be offered for discounted sale automatically.</span></div>` : "";
    save();
  }
  $$("[data-q]", el).forEach(b => b.onclick = () => {
    const q = b.dataset.q, v = b.dataset.v;
    if (q === "q5") A.q5 = {...(A.q5 || {}), type: v}; else if (q === "q6") A.q6.storage = v; else A[q] = v;
    $$(`[data-q="${q}"]`, el).forEach(x => { const on = x.dataset.v === v; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
    progress();
    const card = b.closest(".qcard"), nxt = card.nextElementSibling;
    if (nxt && !["c5","c6"].includes(card.id)) setTimeout(() => nxt.scrollIntoView({behavior: "smooth", block: "start"}), 220);
  });
  $("#conf", el)?.addEventListener("click", () => { A.q1.confirmed = true; A.q1.name = aiName; $("#pname", el).value = aiName; if (catOf(aiName)) { A.q1.category = catOf(aiName); $("#pcat", el).value = A.q1.category; } $("#conf", el).classList.add("on"); progress(); });
  $("#pname", el).oninput = e => { A.q1.name = e.target.value; A.q1.confirmed = aiName && e.target.value.trim().toLowerCase() === aiName.toLowerCase(); $("#conf", el)?.classList.toggle("on", !!A.q1.confirmed); const c = catOf(e.target.value.trim()); if (c) { A.q1.category = c; $("#pcat", el).value = c; } progress(); };
  $("#pcat", el).onchange = e => { A.q1.category = e.target.value; save(); };
  if (!A.q1.category) A.q1.category = $("#pcat", el).value;
  $("#batch", el).oninput = e => { A.q1.batch = e.target.value; save(); };
  $("#dt", el).oninput = e => { A.q5 = {...(A.q5 || {}), date: e.target.value}; progress(); };
  $("#tmp", el).oninput = e => { A.q6.temp = e.target.value === "" ? null : +e.target.value; save(); };
  $("#exc", el).onclick = e => { A.q6.excursion = !A.q6.excursion; e.currentTarget.classList.toggle("on", A.q6.excursion); save(); };
  $("#gen", el).onclick = () => {
    const a = answered(), miss = a.indexOf(false);
    if (miss >= 0) { $("#err", el).textContent = miss === 4 && A.q5?.type ? "Enter the date for Question 5, or choose “No reliable date available”." : `Please answer Question ${miss + 1} before generating the assessment.`; $("#c" + (miss + 1), el).scrollIntoView({behavior: "smooth", block: "start"}); return; }
    $("#err", el).textContent = ""; go("assess", {}, {replace: false});
  };
  progress();
};

/* ---------- Assessment & product record ---------- */
VIEWS.assess = el => {
  const dr = S.draft; if (!dr?.answers?.q5) { setTimeout(() => go("edash", {}, {reset: true}), 0); return {}; }
  const A = dr.answers, ai = dr.ai;
  const ev = evaluate({condition: A.q2, texture: A.q3, smell: A.q4, dateType: A.q5.type, date: A.q5.date, storage: A.q6.storage, excursion: A.q6.excursion, aiMold: !!ai?.possible_mold});
  const st = STATUS[ev.status];
  const bg = {good:"var(--pastel)", monitor:"#EAF4D4", review:"var(--warm-bg)", immediate:"#FBE3CF", hold:"var(--hold-bg)", manual:"#E9EEF0"}[ev.status];
  const preview = suggestDiscount({status: ev.status, dateType: A.q5.type, date: A.q5.date, condition: A.q2});
  const discountTxt = ["hold","immediate"].includes(ev.status) ? "Not eligible until inspected and cleared." : ev.status === "review" && preview.pct ? `${preview.pct}% suggested (needs your approval after saving)` : "No immediate discount required.";
  const units = ["kg","each","pack","500 g","1 L","box"];
  el.innerHTML = `${topbar(backBtn("Back to survey"), `<b style="color:var(--forest)">Product Assessment</b>`)}
    <div class="statusbig anim-in" style="background:${bg};margin-top:8px"><p class="eyebrow">Freshness status</p><div class="row" style="gap:10px"><span class="st ${st.cls}" style="font-size:13px;padding:6px 12px">${st.label}</span></div>
      <p style="font-size:13.5px">Review priority: <b>${ev.priority}</b> · Next recommended inspection: <b>${ev.next === today() ? "today" : fmtDate(ev.next)}</b></p></div>
    <div class="card pad anim-in" style="margin-top:12px;animation-delay:.06s"><dl class="kv">
      <dt>Product</dt><dd>${esc(A.q1.name)} · ${esc(A.q1.category)}</dd>
      <dt>AI observation</dt><dd>${ai ? esc(ai.observation) + ` <span class="note">(${esc(ai.confidence)} confidence)</span>` : '<span class="note">No AI result</span>'}</dd>
      <dt>Employee assessment</dt><dd>${esc(qLabel("q2", A.q2))}</dd><dt>Texture</dt><dd>${esc(qLabel("q3", A.q3))}</dd><dt>Smell / spoilage</dt><dd>${esc(qLabel("q4", A.q4))}</dd>
      <dt>Date</dt><dd>${esc(qLabel("q5", A.q5.type))}${A.q5.date ? ` · ${fmtDate(A.q5.date)}` : ""}</dd>
      <dt>Storage</dt><dd>${esc(qLabel("q6", A.q6.storage))}${A.q6.temp != null ? ` · ${A.q6.temp} °C` : ""}${A.q6.excursion ? " · excursion reported" : ""}</dd>
      <dt>Discount</dt><dd>${discountTxt}</dd></dl></div>
    <details class="card pad anim-in" style="margin-top:10px;animation-delay:.1s" open><summary style="font-weight:700;color:var(--forest);cursor:pointer">Why this status</summary><ul class="why" style="margin-top:8px">${ev.reasons.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
      <p class="note" style="margin-top:8px">Statuses come from the store's configurable rules, not from AI certainty.</p></details>
    <div class="section-h"><h2>Confirm product record</h2></div>
    <form class="card pad stack" id="rec" novalidate>
      <div class="row" style="gap:12px"><div class="thumb" style="width:70px;height:70px"><img src="${dr.photo}" alt="Product photo"></div><label class="fld grow" for="rn">Product name<input class="inp" id="rn" value="${esc(A.q1.name)}" required></label></div>
      <div class="row" style="gap:10px"><label class="fld grow" for="rq">Quantity<input class="inp" id="rq" type="number" inputmode="decimal" min="0" step="0.1" placeholder="e.g. 12"></label>
        <label class="fld" for="ru" style="width:42%">Unit<select class="inp" id="ru">${units.map(u => `<option>${u}</option>`).join("")}</select></label></div>
      <label class="fld" for="rb">Batch / inventory reference<input class="inp" id="rb" value="${esc(A.q1.batch || "")}"></label>
      <label class="fld" for="rp">Original selling price (€ per unit)<input class="inp" id="rp" type="number" inputmode="decimal" min="0" step="0.01" placeholder="e.g. 2.50"></label>
      <label class="fld" for="rd">${A.q5.type === "none" ? "Relevant date (none recorded)" : esc(qLabel("q5", A.q5.type))}<input class="inp" id="rd" type="date" value="${esc(A.q5.date || "")}" ${A.q5.type === "none" ? "disabled" : ""}></label>
      <label class="fld">Storage conditions<input class="inp" value="${esc(qLabel("q6", A.q6.storage))}" disabled></label>
      <label class="fld" for="rn2">Next inspection date<input class="inp" id="rn2" type="date" value="${ev.next}" min="${today()}"></label>
      <p class="err" id="err" role="alert"></p>
      <button class="btn btn-primary" type="submit" id="sv">${I.check} Save &amp; Monitor Product</button></form>`;
  bindBack(el);
  $("#rec", el).onsubmit = async e => {
    e.preventDefault(); const err = $("#err", el);
    const name = $("#rn", el).value.trim(), qty = +$("#rq", el).value, price = +$("#rp", el).value, date = $("#rd", el).value || null, next = $("#rn2", el).value || ev.next;
    if (!name) return err.textContent = "Enter the product name.";
    if (!(qty > 0)) return err.textContent = "Enter the quantity in this batch.";
    if (!(price > 0)) return err.textContent = "Enter the original selling price.";
    if (A.q5.type !== "none" && !date) return err.textContent = "Enter the recorded date.";
    const acc = me(), id = uid("p");
    const final = evaluate({condition: A.q2, texture: A.q3, smell: A.q4, dateType: A.q5.type, date, storage: A.q6.storage, excursion: A.q6.excursion, aiMold: !!ai?.possible_mold});
    const doc = {storeId: acc.storeId, name, category: A.q1.category, photo: dr.photo, batch: $("#rb", el).value.trim(), qty, unit: $("#ru", el).value, price,
      dateType: A.q5.type, date, storage: A.q6.storage, temp: A.q6.temp ?? null, excursion: !!A.q6.excursion,
      ai: ai ? {product: ai.product || "", identified: !!ai.identified, confidence: ai.confidence, observation: ai.observation, bruising: ai.bruising, discoloration: ai.discoloration, surface_damage: ai.surface_damage, possible_mold: !!ai.possible_mold, image_quality: ai.image_quality} : null,
      aiStatus: dr.aiStatus, identityConfirmed: !!A.q1.confirmed, survey: {q2: A.q2, q3: A.q3, q4: A.q4, q5: A.q5.type, q6: A.q6.storage}, condition: A.q2,
      status: final.status, statusReason: final.reasons[0], priority: final.priority, nextReview: next,
      inspections: [{at: Date.now(), date: today(), by: acc.id, byName: acc.name, condition: A.q2, status: final.status, note: "Initial scan and freshness survey"}],
      discount: {state: "none"}, createdAt: Date.now(), createdBy: acc.id, updatedAt: Date.now(), removed: false};
    $("#sv", el).disabled = true;
    try { await DB.set("products", id, doc); } catch { $("#sv", el).disabled = false; return; }
    S.draft = null; S.aiBlob = null; lsSet("sl_draft", null);
    toast(`${name} saved and now monitored`);
    backTo("edash"); setTimeout(() => runChecks(), 600);
  };
};

/* ---------- Product review (from notification or list) ---------- */
VIEWS.eproduct = (el, {id}) => {
  el.innerHTML = `${topbar(backBtn(), `<b style="color:var(--forest)">Product Review</b>`, miniLogo(38))}<div id="body"></div>`;
  bindBack(el);
  function paint(){
    const p = DB.get("products", id) ? {id, ...DB.get("products", id)} : null, acc = me();
    if (!p) return $("#body", el).innerHTML = `<div class="empty">${I.box}<span>This product is no longer in your store's inventory.</span></div>`;
    if (p.storeId !== acc.storeId) return $("#body", el).innerHTML = `<div class="empty">${I.lock}<span>You can only manage products for ${esc(myStore().name)}.</span></div>`;
    const s = storeById(p.storeId), sug = suggestDiscount(p), d = daysLeft(p.date), last = (p.inspections || []).at(-1), max = rules().maxPct[acc.role];
    const pend = p.discount?.state === "pending", active = !!p.live;
    const pct = pend ? p.discount.pct : sug.pct;
    const blocked = ["hold","immediate"].includes(p.status) || (p.dateType === "useby" && d != null && d < 1);
    $("#body", el).innerHTML = `
      <div class="pimg" style="border-radius:22px;margin-top:8px;background:${p.photo ? "#0E2A1B" : "var(--pastel)"};aspect-ratio:16/10">${p.photo ? `<img src="${p.photo}" alt="Photo of ${esc(p.name)}">` : glyph(p.category)}</div>
      <div class="row between" style="margin-top:14px;align-items:flex-start"><div><h1 class="hello" style="font-size:30px">${esc(p.name)}</h1><p class="sub">${esc(s.name)}</p></div>${statusPill(p.status)}</div>
      <div class="card pad" style="margin-top:12px"><dl class="kv">
        <dt>Quantity / batch</dt><dd>${p.qty} ${esc(p.unit)}${p.batch ? ` · ${esc(p.batch)}` : ""}</dd><dt>Original price</dt><dd class="tnum">${eur(p.price)} / ${esc(p.unit)}</dd>
        <dt>Recorded date</dt><dd>${esc(qLabel("q5", p.dateType))}${p.date ? ` · ${fmtDate(p.date)} (${dLabel(d).toLowerCase()})` : ""}</dd>
        <dt>Storage</dt><dd>${esc(qLabel("q6", p.storage))}${p.temp != null ? ` · ${p.temp} °C` : ""}${p.excursion ? " · excursion reported" : ""}</dd>
        <dt>Last inspection</dt><dd>${last ? `${fmtWhen(last.at)} by ${esc(last.byName || "staff")} · ${esc(qLabel("q2", last.condition))}` : "—"}</dd>
        <dt>Next review</dt><dd>${fmtDate(p.nextReview)}</dd>
        <dt>AI observation</dt><dd>${p.ai ? esc(p.ai.observation) : '<span class="note">No AI result</span>'}</dd></dl>
        <p class="note" style="margin-top:8px">${esc(p.statusReason || "")}</p></div>
      ${active ? `<div class="proposal" style="margin-top:12px"><span class="ok-tag" style="justify-self:start">Live for customers</span><div class="row" style="gap:12px;align-items:baseline"><span class="big tnum">${p.live.pct}%</span><span class="tnum"><b>${eur(p.price * (1 - p.live.pct/100))}</b> <s class="note">${eur(p.price)}</s></span></div>
          <p class="note">Approved by ${esc(p.live.byName || "staff")} on ${fmtWhen(p.live.approvedAt)}. Customers see it on the ${esc(s.name)} page.</p>
          <button class="btn btn-ghost btn-sm" id="withdraw">Withdraw discount</button></div>` : ""}
      ${!active || pend || (sug.pct && sug.pct > p.live.pct) ? `<div class="proposal" style="margin-top:12px">
          <p class="eyebrow">${pend ? "AI Suggested Discount — Pending Employee Approval" : "Suggested discount"}</p>
          ${blocked ? `<div class="flag hold">${I.alert}<span>${esc(sug.reason)} Discounted sale is blocked.</span></div>` :
            pct ? `<div class="row" style="gap:12px;align-items:baseline"><span class="big tnum">${pct}%</span><span class="tnum">New price <b>${eur(p.price * (1 - pct/100))}</b> <s class="note">${eur(p.price)}</s></span></div>
              <p style="font-size:13.5px"><b>Reason:</b> ${esc(pend ? p.discount.reason : sug.reason)}</p>
              ${pct > max ? `<div class="flag warm">${I.info}<span>${pct}% is above your approval limit of ${max}%. Adjust it or ask a manager.</span></div>` : ""}
              <div class="row" style="gap:8px"><button class="btn btn-primary btn-sm grow" id="approve" ${pct > max ? "disabled" : ""}>${I.check} Approve Discount</button><button class="btn btn-outline btn-sm grow" id="adjust">Adjust Discount</button></div>
              <button class="btn btn-ghost btn-sm" id="reject">Reject / Inspect Again</button>` :
            `<p class="sub">${esc(sug.reason)}</p>`}
          <p class="note">You always make the final decision. Suggestions follow the store's discount schedule and the condition you recorded.</p></div>` : ""}
      <div class="section-h"><h2>Inspection</h2></div>
      <div class="stack"><button class="btn btn-outline" id="inspect">${I.edit} Update condition</button>
        ${p.status !== "hold" ? `<button class="btn btn-warn btn-sm" id="hold">Remove from sale</button>` : `<button class="btn btn-ghost btn-sm" id="archive">Mark as cleared from shelf</button>`}</div>
      <div class="section-h"><h2>History</h2></div>
      <div class="stack" style="gap:6px">${[...(p.inspections || [])].reverse().map(x => `<div class="card" style="padding:10px 12px;font-size:13px"><b style="color:var(--forest)">${fmtWhen(x.at)}</b> · ${esc(x.byName || "")}<br>${statusPill(x.status)} <span class="note">${esc(x.note || "")}</span></div>`).join("")}</div>`;
    $("#approve", el)?.addEventListener("click", () => approve(p, pct));
    $("#adjust", el)?.addEventListener("click", () => adjust(p, pct || 10, max));
    $("#reject", el)?.addEventListener("click", () => reject(p));
    $("#withdraw", el)?.addEventListener("click", async () => { await DB.patch("products", p.id, {live: null, updatedAt: Date.now()}); await deactivateOffer(p.id); toast("Discount withdrawn. Customers no longer see it."); });
    $("#inspect", el).onclick = () => reinspect(p);
    $("#hold", el)?.addEventListener("click", async () => { await logInspection(p, {status: "hold", note: "Removed from sale by employee", statusReason: "Removed from sale by employee"}); await DB.patch("products", p.id, {discount: {state: "none", pct: 0}, live: null}); await deactivateOffer(p.id); toast("Removed from sale"); });
    $("#archive", el)?.addEventListener("click", async () => { await DB.patch("products", p.id, {removed: true, updatedAt: Date.now()}); await deactivateOffer(p.id); toast("Cleared from monitoring"); back(); });
  }
  paint();
  return {refresh(c){ if (["products","settings","offers","*"].includes(c)) paint(); }};
};
async function logInspection(p, {status, condition, note, nextReview, statusReason}){
  const acc = me(), cur = clone(DB.get("products", p.id));
  cur.inspections = [...(cur.inspections || []), {at: Date.now(), date: today(), by: acc.id, byName: acc.name, condition: condition || cur.condition, status: status || cur.status, note}];
  if (status) cur.status = status; if (condition) cur.condition = condition; if (nextReview) cur.nextReview = nextReview; if (statusReason) cur.statusReason = statusReason;
  cur.updatedAt = Date.now(); await DB.set("products", p.id, cur); return cur;
}
async function approve(p, pct){
  const acc = me(), max = rules().maxPct[acc.role];
  if (!STAFF(acc.role) || acc.storeId !== p.storeId) return toast("You can't approve discounts for this store.");
  if (pct > max) return toast(`Your approval limit is ${max}%.`);
  const fresh = DB.get("products", p.id);
  if (["hold","immediate"].includes(fresh.status) || (fresh.dateType === "useby" && fresh.date && fresh.date <= today())) return toast("This product isn't cleared for sale.");
  const newPrice = +(fresh.price * (1 - pct/100)).toFixed(2);
  await DB.patch("products", p.id, {live: {pct, approvedAt: Date.now(), by: acc.id, byName: acc.name, suggestedPct: fresh.discount?.suggestedPct ?? pct, reason: fresh.discount?.reason || ""}, discount: {state: "none", pct: 0}, status: fresh.status === "good" ? "review" : fresh.status, updatedAt: Date.now()});
  await logInspection({id: p.id}, {note: `Discount of ${pct}% approved${fresh.discount?.suggestedPct && fresh.discount.suggestedPct !== pct ? ` (suggested ${fresh.discount.suggestedPct}%)` : ""}`});
  // Customer-facing record: only what shoppers need — no survey answers, batch codes or inspection notes.
  await DB.set("offers", p.id, {productId: p.id, storeId: fresh.storeId, name: fresh.name, category: fresh.category, unit: fresh.unit, photo: fresh.photo || null,
    price: fresh.price, pct, newPrice, dateType: fresh.dateType, date: fresh.date || null, qty: fresh.qty, qtyUnit: fresh.unit, active: true, approvedAt: Date.now()});
  DB.list("notifications").filter(n => n.productId === p.id && !n.read).forEach(n => DB.patch("notifications", n.id, {read: true}));
  toast(`${pct}% discount approved and live for customers`);
}
function adjust(p, start, max){
  let v = Math.min(start, max);
  sheet(`<h2 style="font-size:20px;color:var(--forest)">Adjust discount</h2><p class="sub" style="margin:6px 0 16px">Choose a percentage within your approval limit (${max}%).</p>
    <div class="proposal"><div class="row" style="gap:12px;align-items:baseline"><span class="big tnum" id="v"></span><span class="tnum" id="np"></span></div>
    <label for="rg" class="note">Discount percentage</label><input type="range" id="rg" min="1" max="${max}" step="1" value="${v}"></div>
    <button class="btn btn-primary" id="ok" style="width:100%;margin-top:14px">Approve this discount</button>`, (sh, close) => {
      const upd = () => { $("#v", sh).textContent = v + "%"; $("#np", sh).innerHTML = `New price <b>${eur(p.price * (1 - v/100))}</b> <s class="note">${eur(p.price)}</s>`; };
      $("#rg", sh).oninput = e => { v = +e.target.value; upd(); }; upd();
      $("#ok", sh).onclick = async () => { close(); await approve(p, v); };
    });
}
function reject(p){
  sheet(`<h2 style="font-size:20px;color:var(--forest)">Reject / inspect again</h2><p class="sub" style="margin:6px 0 14px">Decline this proposal. Shelf Life will remind you to inspect the product again.</p>
    <div class="stack" style="gap:8px">${[1,2,3].map(n => `<button class="opt ${n === 1 ? "on" : ""}" data-n="${n}">Inspect again in ${n} day${n > 1 ? "s" : ""} (${fmtDate(addDays(today(), n))})</button>`).join("")}</div>
    <label class="fld" for="why" style="margin-top:12px">Note <span class="note">(optional)</span><input class="inp" id="why" placeholder="e.g. still firm, full price for now"></label>
    <button class="btn btn-primary" id="ok" style="width:100%;margin-top:14px">Reject proposal</button>`, (sh, close) => {
      let n = 1; $$("[data-n]", sh).forEach(b => b.onclick = () => { n = +b.dataset.n; $$("[data-n]", sh).forEach(x => x.classList.toggle("on", x === b)); });
      $("#ok", sh).onclick = async () => {
        const next = addDays(today(), n);
        await logInspection(p, {note: "Discount proposal rejected" + ($("#why", sh).value.trim() ? `: ${$("#why", sh).value.trim()}` : ""), nextReview: next});
        await DB.patch("products", p.id, {discount: {state: "rejected", rejectedUntil: next, pct: 0}});
        DB.list("notifications").filter(x => x.productId === p.id && !x.read).forEach(x => DB.patch("notifications", x.id, {read: true}));
        close(); toast(`Proposal rejected. Next inspection ${fmtDate(next)}.`);
      };
    });
}
function reinspect(p){
  const a = {q2: p.condition, q3: p.survey?.q3, q4: p.survey?.q4};
  const grp = q => Q[q].map(([v, l]) => `<button class="opt ${a[q] === v ? "on" : ""}" data-q="${q}" data-v="${v}">${esc(l)}</button>`).join("");
  sheet(`<h2 style="font-size:20px;color:var(--forest)">Update condition</h2><p class="sub" style="margin:6px 0 12px">Record what you see now. The status and next inspection update from the store rules.</p>
    <b style="color:var(--forest)">Visible condition</b><div class="stack" style="gap:6px;margin:8px 0 12px">${grp("q2")}</div>
    <b style="color:var(--forest)">Texture</b><div class="stack" style="gap:6px;margin:8px 0 12px">${grp("q3")}</div>
    <b style="color:var(--forest)">Smell / spoilage</b><div class="stack" style="gap:6px;margin:8px 0 12px">${grp("q4")}</div>
    <label class="fld" for="nt">Note <span class="note">(optional)</span><input class="inp" id="nt"></label>
    <button class="btn btn-primary" id="ok" style="width:100%;margin-top:14px">Save inspection</button>`, (sh, close) => {
      $$("[data-q]", sh).forEach(b => b.onclick = () => { a[b.dataset.q] = b.dataset.v; $$(`[data-q="${b.dataset.q}"]`, sh).forEach(x => x.classList.toggle("on", x === b)); });
      $("#ok", sh).onclick = async () => {
        const ev = evaluate({condition: a.q2, texture: a.q3, smell: a.q4, dateType: p.dateType, date: p.date, storage: p.storage, excursion: p.excursion, aiMold: false});
        const cur = await logInspection(p, {status: ev.status, condition: a.q2, note: $("#nt", sh).value.trim() || "Re-inspection", nextReview: ev.next, statusReason: ev.reasons[0]});
        await DB.patch("products", p.id, {survey: {...(cur.survey || {}), q2: a.q2, q3: a.q3, q4: a.q4}, ...(["hold","immediate"].includes(ev.status) ? {discount: {state: "none", pct: 0}, live: null} : {})});
        if (["hold","immediate"].includes(ev.status)) await deactivateOffer(p.id);
        close(); toast(`Status: ${STATUS[ev.status].label}`); runChecks();
      };
    });
}

/* ---------- Notifications ---------- */
VIEWS.notifs = el => {
  el.innerHTML = `${topbar(backBtn(), `<b style="color:var(--forest)">Notifications</b>`, `<button class="link" id="mark" style="font-size:13px">Mark all read</button>`)}<div class="stack" id="l" style="margin-top:12px"></div>`;
  bindBack(el);
  const mine = () => DB.list("notifications").filter(n => n.storeId === me().storeId).sort((a, b) => b.createdAt - a.createdAt);
  $("#mark", el).onclick = () => mine().filter(n => !n.read).forEach(n => DB.patch("notifications", n.id, {read: true}));
  function paint(){
    const l = mine();
    $("#l", el).innerHTML = l.length ? l.map(n => { const p = DB.get("products", n.productId);
      return `<button class="ntf ${n.read ? "" : "unread"}" data-p="${esc(n.productId)}" data-n="${esc(n.id)}">${p ? thumbHTML(p) : ""}<div class="grow" style="display:grid;gap:3px"><span class="t">${esc(n.title)}</span><span class="b">${esc(n.body)}</span><span class="when">${fmtWhen(n.createdAt)}${n.read ? "" : " · Unread"}</span></div></button>`; }).join("")
      : `<div class="empty card">${I.bell}<b style="color:var(--forest)">No alerts yet</b><span>Shelf Life alerts you when a monitored product reaches its review date or a discount is suggested. Use the demo clock on the dashboard to test it.</span></div>`;
    $$("#l .ntf", el).forEach(b => b.onclick = () => { DB.patch("notifications", b.dataset.n, {read: true}); go("eproduct", {id: b.dataset.p}); });
  }
  paint(); return {refresh: paint};
};

/* ============================================================
   BOOT
   ============================================================ */
(function boot(){
  const acc = me();
  if (acc) go(acc.role === "customer" ? "cdash" : "edash", {}, {anim: "fade", reset: true});
  else go("welcome", {}, {anim: "none"});
  DB.init();
})();

````

## leaflet.min.css

````css
 .leaflet-pane, .leaflet-tile, .leaflet-marker-icon, .leaflet-marker-shadow, .leaflet-tile-container, .leaflet-pane > svg, .leaflet-pane > canvas, .leaflet-zoom-box, .leaflet-image-layer, .leaflet-layer { position: absolute; left: 0; top: 0; } .leaflet-container { overflow: hidden; } .leaflet-tile, .leaflet-marker-icon, .leaflet-marker-shadow { -webkit-user-select: none; -moz-user-select: none; user-select: none; -webkit-user-drag: none; } .leaflet-tile::selection { background: transparent; } .leaflet-safari .leaflet-tile { image-rendering: -webkit-optimize-contrast; } .leaflet-safari .leaflet-tile-container { width: 1600px; height: 1600px; -webkit-transform-origin: 0 0; } .leaflet-marker-icon, .leaflet-marker-shadow { display: block; } .leaflet-container .leaflet-overlay-pane svg { max-width: none !important; max-height: none !important; } .leaflet-container .leaflet-marker-pane img, .leaflet-container .leaflet-shadow-pane img, .leaflet-container .leaflet-tile-pane img, .leaflet-container img.leaflet-image-layer, .leaflet-container .leaflet-tile { max-width: none !important; max-height: none !important; width: auto; padding: 0; } .leaflet-container img.leaflet-tile { mix-blend-mode: plus-lighter; } .leaflet-container.leaflet-touch-zoom { -ms-touch-action: pan-x pan-y; touch-action: pan-x pan-y; } .leaflet-container.leaflet-touch-drag { -ms-touch-action: pinch-zoom; touch-action: none; touch-action: pinch-zoom; } .leaflet-container.leaflet-touch-drag.leaflet-touch-zoom { -ms-touch-action: none; touch-action: none; } .leaflet-container { -webkit-tap-highlight-color: transparent; } .leaflet-container a { -webkit-tap-highlight-color: rgba(51, 181, 229, 0.4); } .leaflet-tile { filter: inherit; visibility: hidden; } .leaflet-tile-loaded { visibility: inherit; } .leaflet-zoom-box { width: 0; height: 0; -moz-box-sizing: border-box; box-sizing: border-box; z-index: 800; } .leaflet-overlay-pane svg { -moz-user-select: none; } .leaflet-pane { z-index: 400; } .leaflet-tile-pane { z-index: 200; } .leaflet-overlay-pane { z-index: 400; } .leaflet-shadow-pane { z-index: 500; } .leaflet-marker-pane { z-index: 600; } .leaflet-tooltip-pane { z-index: 650; } .leaflet-popup-pane { z-index: 700; } .leaflet-map-pane canvas { z-index: 100; } .leaflet-map-pane svg { z-index: 200; } .leaflet-vml-shape { width: 1px; height: 1px; } .lvml { behavior: url(#default#VML); display: inline-block; position: absolute; } .leaflet-control { position: relative; z-index: 800; pointer-events: visiblePainted; pointer-events: auto; } .leaflet-top, .leaflet-bottom { position: absolute; z-index: 1000; pointer-events: none; } .leaflet-top { top: 0; } .leaflet-right { right: 0; } .leaflet-bottom { bottom: 0; } .leaflet-left { left: 0; } .leaflet-control { float: left; clear: both; } .leaflet-right .leaflet-control { float: right; } .leaflet-top .leaflet-control { margin-top: 10px; } .leaflet-bottom .leaflet-control { margin-bottom: 10px; } .leaflet-left .leaflet-control { margin-left: 10px; } .leaflet-right .leaflet-control { margin-right: 10px; } .leaflet-fade-anim .leaflet-popup { opacity: 0; -webkit-transition: opacity 0.2s linear; -moz-transition: opacity 0.2s linear; transition: opacity 0.2s linear; } .leaflet-fade-anim .leaflet-map-pane .leaflet-popup { opacity: 1; } .leaflet-zoom-animated { -webkit-transform-origin: 0 0; -ms-transform-origin: 0 0; transform-origin: 0 0; } svg.leaflet-zoom-animated { will-change: transform; } .leaflet-zoom-anim .leaflet-zoom-animated { -webkit-transition: -webkit-transform 0.25s cubic-bezier(0,0,0.25,1); -moz-transition: -moz-transform 0.25s cubic-bezier(0,0,0.25,1); transition: transform 0.25s cubic-bezier(0,0,0.25,1); } .leaflet-zoom-anim .leaflet-tile, .leaflet-pan-anim .leaflet-tile { -webkit-transition: none; -moz-transition: none; transition: none; } .leaflet-zoom-anim .leaflet-zoom-hide { visibility: hidden; } .leaflet-interactive { cursor: pointer; } .leaflet-grab { cursor: -webkit-grab; cursor: -moz-grab; cursor: grab; } .leaflet-crosshair, .leaflet-crosshair .leaflet-interactive { cursor: crosshair; } .leaflet-popup-pane, .leaflet-control { cursor: auto; } .leaflet-dragging .leaflet-grab, .leaflet-dragging .leaflet-grab .leaflet-interactive, .leaflet-dragging .leaflet-marker-draggable { cursor: move; cursor: -webkit-grabbing; cursor: -moz-grabbing; cursor: grabbing; } .leaflet-marker-icon, .leaflet-marker-shadow, .leaflet-image-layer, .leaflet-pane > svg path, .leaflet-tile-container { pointer-events: none; } .leaflet-marker-icon.leaflet-interactive, .leaflet-image-layer.leaflet-interactive, .leaflet-pane > svg path.leaflet-interactive, svg.leaflet-image-layer.leaflet-interactive path { pointer-events: visiblePainted; pointer-events: auto; } .leaflet-container { background: #ddd; outline-offset: 1px; } .leaflet-container a { color: #0078A8; } .leaflet-zoom-box { border: 2px dotted #38f; background: rgba(255,255,255,0.5); } .leaflet-container { font-family: "Helvetica Neue", Arial, Helvetica, sans-serif; font-size: 12px; font-size: 0.75rem; line-height: 1.5; } .leaflet-bar { box-shadow: 0 1px 5px rgba(0,0,0,0.65); border-radius: 4px; } .leaflet-bar a { background-color: #fff; border-bottom: 1px solid #ccc; width: 26px; height: 26px; line-height: 26px; display: block; text-align: center; text-decoration: none; color: black; } .leaflet-bar a, .leaflet-control-layers-toggle { background-position: 50% 50%; background-repeat: no-repeat; display: block; } .leaflet-bar a:hover, .leaflet-bar a:focus { background-color: #f4f4f4; } .leaflet-bar a:first-child { border-top-left-radius: 4px; border-top-right-radius: 4px; } .leaflet-bar a:last-child { border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; border-bottom: none; } .leaflet-bar a.leaflet-disabled { cursor: default; background-color: #f4f4f4; color: #bbb; } .leaflet-touch .leaflet-bar a { width: 30px; height: 30px; line-height: 30px; } .leaflet-touch .leaflet-bar a:first-child { border-top-left-radius: 2px; border-top-right-radius: 2px; } .leaflet-touch .leaflet-bar a:last-child { border-bottom-left-radius: 2px; border-bottom-right-radius: 2px; } .leaflet-control-zoom-in, .leaflet-control-zoom-out { font: bold 18px 'Lucida Console', Monaco, monospace; text-indent: 1px; } .leaflet-touch .leaflet-control-zoom-in, .leaflet-touch .leaflet-control-zoom-out { font-size: 22px; } .leaflet-control-layers { box-shadow: 0 1px 5px rgba(0,0,0,0.4); background: #fff; border-radius: 5px; } .leaflet-control-layers-toggle { background-image: none; width: 36px; height: 36px; } .leaflet-retina .leaflet-control-layers-toggle { background-image: none; background-size: 26px 26px; } .leaflet-touch .leaflet-control-layers-toggle { width: 44px; height: 44px; } .leaflet-control-layers .leaflet-control-layers-list, .leaflet-control-layers-expanded .leaflet-control-layers-toggle { display: none; } .leaflet-control-layers-expanded .leaflet-control-layers-list { display: block; position: relative; } .leaflet-control-layers-expanded { padding: 6px 10px 6px 6px; color: #333; background: #fff; } .leaflet-control-layers-scrollbar { overflow-y: scroll; overflow-x: hidden; padding-right: 5px; } .leaflet-control-layers-selector { margin-top: 2px; position: relative; top: 1px; } .leaflet-control-layers label { display: block; font-size: 13px; font-size: 1.08333em; } .leaflet-control-layers-separator { height: 0; border-top: 1px solid #ddd; margin: 5px -10px 5px -6px; } .leaflet-default-icon-path { background-image: none; } .leaflet-container .leaflet-control-attribution { background: #fff; background: rgba(255, 255, 255, 0.8); margin: 0; } .leaflet-control-attribution, .leaflet-control-scale-line { padding: 0 5px; color: #333; line-height: 1.4; } .leaflet-control-attribution a { text-decoration: none; } .leaflet-control-attribution a:hover, .leaflet-control-attribution a:focus { text-decoration: underline; } .leaflet-attribution-flag { display: inline !important; vertical-align: baseline !important; width: 1em; height: 0.6669em; } .leaflet-left .leaflet-control-scale { margin-left: 5px; } .leaflet-bottom .leaflet-control-scale { margin-bottom: 5px; } .leaflet-control-scale-line { border: 2px solid #777; border-top: none; line-height: 1.1; padding: 2px 5px 1px; white-space: nowrap; -moz-box-sizing: border-box; box-sizing: border-box; background: rgba(255, 255, 255, 0.8); text-shadow: 1px 1px #fff; } .leaflet-control-scale-line:not(:first-child) { border-top: 2px solid #777; border-bottom: none; margin-top: -2px; } .leaflet-control-scale-line:not(:first-child):not(:last-child) { border-bottom: 2px solid #777; } .leaflet-touch .leaflet-control-attribution, .leaflet-touch .leaflet-control-layers, .leaflet-touch .leaflet-bar { box-shadow: none; } .leaflet-touch .leaflet-control-layers, .leaflet-touch .leaflet-bar { border: 2px solid rgba(0,0,0,0.2); background-clip: padding-box; } .leaflet-popup { position: absolute; text-align: center; margin-bottom: 20px; } .leaflet-popup-content-wrapper { padding: 1px; text-align: left; border-radius: 12px; } .leaflet-popup-content { margin: 13px 24px 13px 20px; line-height: 1.3; font-size: 13px; font-size: 1.08333em; min-height: 1px; } .leaflet-popup-content p { margin: 17px 0; margin: 1.3em 0; } .leaflet-popup-tip-container { width: 40px; height: 20px; position: absolute; left: 50%; margin-top: -1px; margin-left: -20px; overflow: hidden; pointer-events: none; } .leaflet-popup-tip { width: 17px; height: 17px; padding: 1px; margin: -10px auto 0; pointer-events: auto; -webkit-transform: rotate(45deg); -moz-transform: rotate(45deg); -ms-transform: rotate(45deg); transform: rotate(45deg); } .leaflet-popup-content-wrapper, .leaflet-popup-tip { background: white; color: #333; box-shadow: 0 3px 14px rgba(0,0,0,0.4); } .leaflet-container a.leaflet-popup-close-button { position: absolute; top: 0; right: 0; border: none; text-align: center; width: 24px; height: 24px; font: 16px/24px Tahoma, Verdana, sans-serif; color: #757575; text-decoration: none; background: transparent; } .leaflet-container a.leaflet-popup-close-button:hover, .leaflet-container a.leaflet-popup-close-button:focus { color: #585858; } .leaflet-popup-scrolled { overflow: auto; } .leaflet-oldie .leaflet-popup-content-wrapper { -ms-zoom: 1; } .leaflet-oldie .leaflet-popup-tip { width: 24px; margin: 0 auto; -ms-filter: "progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678)"; filter: progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678); } .leaflet-oldie .leaflet-control-zoom, .leaflet-oldie .leaflet-control-layers, .leaflet-oldie .leaflet-popup-content-wrapper, .leaflet-oldie .leaflet-popup-tip { border: 1px solid #999; } .leaflet-div-icon { background: #fff; border: 1px solid #666; } .leaflet-tooltip { position: absolute; padding: 6px; background-color: #fff; border: 1px solid #fff; border-radius: 3px; color: #222; white-space: nowrap; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; pointer-events: none; box-shadow: 0 1px 3px rgba(0,0,0,0.4); } .leaflet-tooltip.leaflet-interactive { cursor: pointer; pointer-events: auto; } .leaflet-tooltip-top:before, .leaflet-tooltip-bottom:before, .leaflet-tooltip-left:before, .leaflet-tooltip-right:before { position: absolute; pointer-events: none; border: 6px solid transparent; background: transparent; content: ""; } .leaflet-tooltip-bottom { margin-top: 6px; } .leaflet-tooltip-top { margin-top: -6px; } .leaflet-tooltip-bottom:before, .leaflet-tooltip-top:before { left: 50%; margin-left: -6px; } .leaflet-tooltip-top:before { bottom: 0; margin-bottom: -12px; border-top-color: #fff; } .leaflet-tooltip-bottom:before { top: 0; margin-top: -12px; margin-left: -6px; border-bottom-color: #fff; } .leaflet-tooltip-left { margin-left: -6px; } .leaflet-tooltip-right { margin-left: 6px; } .leaflet-tooltip-left:before, .leaflet-tooltip-right:before { top: 50%; margin-top: -6px; } .leaflet-tooltip-left:before { right: 0; margin-right: -12px; border-left-color: #fff; } .leaflet-tooltip-right:before { left: 0; margin-left: -12px; border-right-color: #fff; } @media print { .leaflet-control { -webkit-print-color-adjust: exact; print-color-adjust: exact; } } 
````

## geo.js (JSON data)

Wrap as `const GEO = <this JSON>;`

````json
{"d":[{"n":"Mitte","r":[[[52.5256,13.4197],[52.5229,13.4264],[52.5226,13.4251],[52.5209,13.4291],[52.5192,13.4278],[52.5192,13.4264],[52.5182,13.4251],[52.5175,13.4264],[52.5121,13.4224],[52.5077,13.4291],[52.506,13.4278],[52.5047,13.4237],[52.5047,13.421],[52.5057,13.4197],[52.5043,13.417],[52.5047,13.4143],[52.5036,13.4143],[52.5047,13.4109],[52.507,13.4096],[52.506,13.4069],[52.5084,13.4055],[52.5074,13.4042],[52.5087,13.4015],[52.5087,13.3988],[52.5077,13.3988],[52.5074,13.3934],[52.507,13.3779],[52.5077,13.3779],[52.5057,13.3766],[52.5057,13.3752],[52.5033,13.3752],[52.5043,13.3739],[52.5016,13.3712],[52.4996,13.3712],[52.4982,13.3685],[52.4993,13.3665],[52.4996,13.3624],[52.5016,13.3557],[52.502,13.3517],[52.5047,13.3416],[52.5047,13.3389],[52.506,13.3389],[52.5057,13.3348],[52.5063,13.3335],[52.5087,13.3348],[52.5101,13.3294],[52.5114,13.3335],[52.5124,13.3308],[52.5134,13.3362],[52.5141,13.3362],[52.5165,13.3335],[52.5165,13.3308],[52.5178,13.3294],[52.5219,13.3294],[52.5242,13.3254],[52.5242,13.3214],[52.5229,13.318],[52.5205,13.318],[52.5205,13.3167],[52.5296,13.3126],[52.531,13.3167],[52.532,13.3167],[52.532,13.3126],[52.5334,13.3113],[52.5357,13.3113],[52.5361,13.318],[52.5377,13.3294],[52.5391,13.3268],[52.5415,13.3268],[52.5438,13.3227],[52.5479,13.318],[52.5482,13.3059],[52.5489,13.3045],[52.5489,13.3018],[52.5529,13.3045],[52.5546,13.3072],[52.558,13.3099],[52.5583,13.314],[52.5597,13.3167],[52.56,13.3227],[52.561,13.3254],[52.5624,13.3268],[52.5624,13.3294],[52.5614,13.3321],[52.5644,13.3362],[52.562,13.349],[52.562,13.3571],[52.5614,13.3598],[52.56,13.3598],[52.561,13.3638],[52.558,13.3651],[52.5597,13.3699],[52.5607,13.3699],[52.5607,13.3766],[52.5661,13.3779],[52.5661,13.3806],[52.5674,13.3833],[52.5674,13.3887],[52.5644,13.3934],[52.5607,13.3961],[52.5583,13.3961],[52.558,13.3975],[52.5506,13.3975],[52.5506,13.3988],[52.5465,13.4002],[52.5448,13.4015],[52.5425,13.4015],[52.5401,13.4029],[52.5401,13.4042],[52.5388,13.4042],[52.5361,13.4055],[52.5337,13.4082],[52.532,13.4055],[52.5296,13.4055],[52.5273,13.4157],[52.5259,13.417],[52.5256,13.4197]]]},{"n":"Friedrichshain-Kreuzberg","r":[[[52.5256,13.4197],[52.5269,13.421],[52.5283,13.4251],[52.5296,13.4365],[52.5283,13.4379],[52.531,13.4419],[52.5259,13.4473],[52.5269,13.4487],[52.5273,13.4527],[52.5226,13.4554],[52.5209,13.4554],[52.5195,13.4628],[52.5205,13.4722],[52.5161,13.4763],[52.5148,13.4749],[52.5121,13.4749],[52.5101,13.4763],[52.506,13.4722],[52.5023,13.4695],[52.5009,13.4695],[52.4996,13.4682],[52.4986,13.4722],[52.4895,13.4877],[52.4878,13.4918],[52.4878,13.4864],[52.4861,13.4823],[52.4878,13.4817],[52.4878,13.479],[52.4868,13.4776],[52.4888,13.4776],[52.4905,13.4749],[52.4928,13.4655],[52.4942,13.4628],[52.4955,13.4628],[52.4966,13.4588],[52.4972,13.4513],[52.4942,13.4473],[52.4942,13.4446],[52.4895,13.4392],[52.4905,13.4379],[52.4908,13.4352],[52.4915,13.4352],[52.4955,13.4197],[52.4888,13.4251],[52.4878,13.4251],[52.4864,13.4224],[52.4888,13.4082],[52.4861,13.4069],[52.4851,13.4042],[52.4851,13.4015],[52.4837,13.4002],[52.4837,13.3934],[52.4854,13.3934],[52.4854,13.386],[52.4847,13.386],[52.4851,13.3739],[52.4878,13.3739],[52.4878,13.3725],[52.4915,13.3766],[52.4928,13.3685],[52.4969,13.3685],[52.4996,13.3712],[52.5016,13.3712],[52.5043,13.3739],[52.5033,13.3752],[52.5057,13.3752],[52.5057,13.3766],[52.5077,13.3779],[52.507,13.3779],[52.5074,13.3934],[52.5077,13.3988],[52.5087,13.3988],[52.5087,13.4015],[52.5074,13.4042],[52.5084,13.4055],[52.506,13.4069],[52.507,13.4096],[52.5047,13.4109],[52.5036,13.4143],[52.5047,13.4143],[52.5043,13.417],[52.5057,13.4197],[52.5047,13.421],[52.5047,13.4237],[52.506,13.4278],[52.5077,13.4291],[52.5121,13.4224],[52.5175,13.4264],[52.5182,13.4251],[52.5192,13.4264],[52.5192,13.4278],[52.5209,13.4291],[52.5226,13.4251],[52.5229,13.4264],[52.5256,13.4197]]]},{"n":"Pankow","r":[[[52.6252,13.3672],[52.6252,13.3685],[52.6265,13.3699],[52.6275,13.3725],[52.6279,13.3752],[52.6289,13.3766],[52.6329,13.3766],[52.6329,13.3779],[52.6339,13.3779],[52.635,13.382],[52.6363,13.382],[52.6363,13.3847],[52.6377,13.3894],[52.6383,13.3901],[52.642,13.3901],[52.642,13.3907],[52.6437,13.3907],[52.6447,13.3921],[52.6471,13.3934],[52.6471,13.3961],[52.6481,13.3975],[52.6461,13.4002],[52.6434,13.4069],[52.6424,13.4069],[52.6434,13.4116],[52.642,13.413],[52.642,13.4143],[52.641,13.4143],[52.6393,13.4157],[52.6393,13.417],[52.6353,13.4237],[52.6377,13.4278],[52.637,13.4318],[52.638,13.4345],[52.6383,13.4332],[52.6444,13.4332],[52.6454,13.4392],[52.6471,13.4406],[52.6488,13.4406],[52.6495,13.4419],[52.6498,13.4513],[52.6485,13.4513],[52.6481,13.4588],[52.6485,13.4614],[52.6512,13.4655],[52.6512,13.4695],[52.6539,13.4736],[52.6562,13.4736],[52.6576,13.4614],[52.6616,13.454],[52.6626,13.45],[52.6653,13.454],[52.6653,13.4554],[52.6691,13.4588],[52.6667,13.4655],[52.6748,13.4749],[52.6734,13.4763],[52.6755,13.479],[52.6697,13.4749],[52.6664,13.4749],[52.6704,13.4877],[52.6667,13.4877],[52.6616,13.485],[52.6589,13.485],[52.6572,13.4877],[52.6562,13.4877],[52.6525,13.4944],[52.6522,13.4971],[52.6485,13.5059],[52.6485,13.5072],[52.6454,13.5126],[52.6471,13.5194],[52.6458,13.5194],[52.6447,13.5207],[52.6447,13.5221],[52.6383,13.5221],[52.6329,13.518],[52.6292,13.518],[52.6275,13.5099],[52.6258,13.5059],[52.6194,13.5052],[52.6184,13.5025],[52.6134,13.4998],[52.612,13.4985],[52.6049,13.4958],[52.6053,13.4985],[52.5988,13.5025],[52.5961,13.5052],[52.5924,13.4944],[52.5901,13.4904],[52.588,13.485],[52.584,13.4837],[52.5833,13.4803],[52.582,13.479],[52.5793,13.479],[52.5776,13.4803],[52.5766,13.479],[52.5725,13.479],[52.5725,13.4823],[52.5715,13.4823],[52.5688,13.4877],[52.5661,13.4837],[52.5644,13.4837],[52.5637,13.4864],[52.561,13.485],[52.561,13.4877],[52.5597,13.4918],[52.5587,13.4918],[52.5546,13.4958],[52.5529,13.4958],[52.5506,13.4944],[52.5519,13.485],[52.5492,13.4823],[52.5492,13.479],[52.5479,13.4803],[52.5475,13.479],[52.5479,13.4668],[52.5401,13.4695],[52.5364,13.4655],[52.5347,13.4682],[52.533,13.4641],[52.5293,13.4601],[52.5283,13.4554],[52.5242,13.4614],[52.5232,13.4682],[52.5205,13.4722],[52.5195,13.4628],[52.5209,13.4554],[52.5226,13.4554],[52.5273,13.4527],[52.5269,13.4487],[52.5259,13.4473],[52.531,13.4419],[52.5283,13.4379],[52.5296,13.4365],[52.5283,13.4251],[52.5269,13.421],[52.5256,13.4197],[52.5259,13.417],[52.5273,13.4157],[52.5296,13.4055],[52.532,13.4055],[52.5337,13.4082],[52.5361,13.4055],[52.5388,13.4042],[52.5401,13.4042],[52.5401,13.4029],[52.5425,13.4015],[52.5448,13.4015],[52.5465,13.4002],[52.5506,13.3988],[52.5506,13.3975],[52.558,13.3975],[52.5583,13.3961],[52.5607,13.3961],[52.5644,13.3934],[52.5671,13.3887],[52.5678,13.3894],[52.5701,13.3874],[52.5718,13.3833],[52.5725,13.3793],[52.5749,13.3766],[52.5789,13.3672],[52.5789,13.3685],[52.5809,13.3624],[52.582,13.3624],[52.5843,13.3571],[52.5897,13.3476],[52.5907,13.3503],[52.5914,13.3611],[52.5948,13.3651],[52.5975,13.3672],[52.5985,13.3699],[52.5999,13.3712],[52.6066,13.3752],[52.6093,13.3766],[52.6107,13.3766],[52.6117,13.3752],[52.6134,13.3752],[52.6157,13.3739],[52.6188,13.3712],[52.6198,13.3712],[52.6225,13.3685],[52.6252,13.3672]]]},{"n":"Charlottenburg-Wilmersdorf","r":[[[52.5047,13.3416],[52.5009,13.3362],[52.4996,13.3389],[52.4969,13.3375],[52.4939,13.3375],[52.4925,13.3362],[52.4777,13.3362],[52.4773,13.32],[52.4669,13.32],[52.4669,13.3099],[52.4679,13.3072],[52.4672,13.3059],[52.4706,13.289],[52.4682,13.2796],[52.4669,13.2628],[52.4679,13.2614],[52.4669,13.2601],[52.4665,13.2574],[52.4672,13.2473],[52.4696,13.2352],[52.4709,13.2311],[52.4696,13.2237],[52.4696,13.2075],[52.4706,13.2049],[52.4699,13.2015],[52.4685,13.2001],[52.4692,13.1974],[52.4709,13.1961],[52.4719,13.188],[52.4787,13.1867],[52.481,13.1894],[52.4841,13.1894],[52.4868,13.1867],[52.4908,13.1867],[52.4928,13.1894],[52.4972,13.1894],[52.4996,13.1948],[52.4999,13.2015],[52.503,13.2089],[52.5047,13.2089],[52.509,13.2116],[52.5087,13.2143],[52.5101,13.2156],[52.5114,13.2156],[52.5138,13.2197],[52.5138,13.221],[52.5151,13.2197],[52.5226,13.2197],[52.5256,13.2224],[52.5256,13.2405],[52.5246,13.2432],[52.5242,13.2473],[52.5273,13.2473],[52.5269,13.2601],[52.5286,13.2655],[52.5286,13.2756],[52.531,13.281],[52.5337,13.2823],[52.5347,13.2769],[52.5388,13.2722],[52.5425,13.2729],[52.5492,13.2695],[52.5489,13.3045],[52.5482,13.3059],[52.5479,13.318],[52.5438,13.3227],[52.5415,13.3268],[52.5391,13.3268],[52.5377,13.3294],[52.5361,13.318],[52.5357,13.3113],[52.5334,13.3113],[52.532,13.3126],[52.532,13.3167],[52.531,13.3167],[52.5296,13.3126],[52.5205,13.3167],[52.5205,13.318],[52.5229,13.318],[52.5242,13.3214],[52.5242,13.3254],[52.5219,13.3294],[52.5178,13.3294],[52.5165,13.3308],[52.5165,13.3335],[52.5141,13.3362],[52.5134,13.3362],[52.5124,13.3308],[52.5114,13.3335],[52.5101,13.3294],[52.5087,13.3348],[52.5063,13.3335],[52.5057,13.3348],[52.506,13.3389],[52.5047,13.3389],[52.5047,13.3416]]]},{"n":"Spandau","r":[[[52.587,13.217],[52.584,13.2143],[52.5816,13.2183],[52.5793,13.2183],[52.5782,13.217],[52.5755,13.2197],[52.5728,13.2251],[52.5712,13.2251],[52.5688,13.2264],[52.5674,13.2264],[52.5664,13.2284],[52.5644,13.2284],[52.5634,13.2278],[52.561,13.2298],[52.5509,13.2507],[52.5492,13.256],[52.5492,13.2695],[52.5425,13.2729],[52.5388,13.2722],[52.5347,13.2769],[52.5337,13.2823],[52.531,13.281],[52.5286,13.2756],[52.5286,13.2655],[52.5269,13.2601],[52.5273,13.2473],[52.5242,13.2473],[52.5246,13.2432],[52.5256,13.2405],[52.5256,13.2224],[52.5226,13.2197],[52.5151,13.2197],[52.5138,13.221],[52.5138,13.2197],[52.5114,13.2156],[52.5101,13.2156],[52.5087,13.2143],[52.509,13.2116],[52.5047,13.2089],[52.503,13.2089],[52.4999,13.2015],[52.4996,13.1948],[52.4972,13.1894],[52.4928,13.1894],[52.4908,13.1867],[52.4868,13.1867],[52.4841,13.1894],[52.481,13.1894],[52.4787,13.1867],[52.4736,13.188],[52.4706,13.188],[52.4625,13.1853],[52.4561,13.1766],[52.4561,13.1698],[52.4523,13.1618],[52.4469,13.1543],[52.4432,13.1476],[52.4429,13.1395],[52.4409,13.1308],[52.4415,13.1308],[52.4405,13.1281],[52.4405,13.124],[52.4395,13.1227],[52.4409,13.12],[52.4436,13.1187],[52.4456,13.1146],[52.4483,13.1119],[52.449,13.1099],[52.4507,13.1085],[52.4537,13.1119],[52.4591,13.1119],[52.4601,13.1099],[52.4615,13.1112],[52.4638,13.1112],[52.4655,13.1099],[52.4682,13.1133],[52.4699,13.1133],[52.4733,13.1173],[52.477,13.1173],[52.4787,13.1267],[52.4982,13.1517],[52.509,13.1685],[52.5104,13.1631],[52.5124,13.1604],[52.5128,13.157],[52.5151,13.153],[52.5175,13.1449],[52.5195,13.1422],[52.5178,13.1335],[52.5168,13.1173],[52.5205,13.1173],[52.5209,13.1187],[52.53,13.1187],[52.5334,13.1213],[52.5357,13.1213],[52.5364,13.1227],[52.5418,13.1254],[52.5452,13.1254],[52.5469,13.1267],[52.5479,13.1267],[52.5529,13.1294],[52.5556,13.1294],[52.5546,13.1321],[52.5529,13.1335],[52.5523,13.1355],[52.5523,13.1449],[52.5556,13.1476],[52.5566,13.1463],[52.5607,13.1463],[52.5624,13.1476],[52.5647,13.1476],[52.5671,13.1503],[52.5701,13.1503],[52.5705,13.153],[52.5779,13.153],[52.5806,13.1517],[52.582,13.1517],[52.583,13.149],[52.5793,13.1321],[52.5803,13.1308],[52.583,13.1294],[52.583,13.1281],[52.5857,13.1294],[52.587,13.1281],[52.587,13.1355],[52.5884,13.1382],[52.5914,13.149],[52.5958,13.153],[52.5975,13.157],[52.5988,13.1644],[52.5965,13.1685],[52.5958,13.1725],[52.5948,13.1739],[52.5948,13.1779],[52.5934,13.1813],[52.5934,13.184],[52.5901,13.1907],[52.5884,13.2001],[52.5867,13.2049],[52.5867,13.2062],[52.5884,13.2075],[52.587,13.217]]]},{"n":"Steglitz-Zehlendorf","r":[[[52.4118,13.3436],[52.4101,13.3389],[52.4095,13.3389],[52.4064,13.3281],[52.399,13.3113],[52.4027,13.3086],[52.4041,13.3059],[52.4118,13.2978],[52.4142,13.2958],[52.4149,13.2964],[52.4159,13.2958],[52.4095,13.285],[52.4051,13.2756],[52.4041,13.2709],[52.4044,13.2641],[52.4064,13.2587],[52.4064,13.256],[52.4051,13.25],[52.4054,13.2486],[52.4118,13.2486],[52.4145,13.2473],[52.4186,13.2473],[52.4209,13.2459],[52.4209,13.2352],[52.4199,13.2325],[52.4209,13.2251],[52.4189,13.217],[52.4176,13.2143],[52.4159,13.2062],[52.4155,13.1974],[52.4027,13.1591],[52.399,13.1591],[52.3977,13.157],[52.3963,13.157],[52.3977,13.1712],[52.3953,13.1712],[52.3939,13.1685],[52.3936,13.1591],[52.395,13.153],[52.395,13.1463],[52.3966,13.1409],[52.3899,13.1294],[52.3896,13.1321],[52.3885,13.1335],[52.3872,13.1335],[52.3872,13.1308],[52.3896,13.1267],[52.3912,13.1267],[52.3919,13.1308],[52.3936,13.1341],[52.396,13.1382],[52.3963,13.1355],[52.3973,13.1355],[52.3977,13.1382],[52.398,13.1355],[52.399,13.1335],[52.398,13.1321],[52.3963,13.1254],[52.4017,13.1173],[52.4041,13.1112],[52.4054,13.1112],[52.4068,13.1085],[52.4081,13.1085],[52.4085,13.1059],[52.4095,13.1099],[52.4105,13.1099],[52.4105,13.1119],[52.4115,13.1112],[52.4108,13.1099],[52.4128,13.1099],[52.4132,13.1072],[52.4095,13.1072],[52.4095,13.1059],[52.4105,13.1005],[52.4135,13.1005],[52.4132,13.0964],[52.4108,13.0991],[52.4095,13.0964],[52.4115,13.091],[52.4196,13.0883],[52.4233,13.0978],[52.425,13.0978],[52.4236,13.1045],[52.425,13.1045],[52.4253,13.1072],[52.4263,13.1072],[52.429,13.1119],[52.4324,13.1119],[52.4378,13.1213],[52.4405,13.124],[52.4405,13.1281],[52.4415,13.1308],[52.4409,13.1308],[52.4429,13.1395],[52.4432,13.1476],[52.4469,13.1543],[52.4523,13.1618],[52.4561,13.1698],[52.4561,13.1766],[52.4625,13.1853],[52.4655,13.1867],[52.4719,13.188],[52.4709,13.1961],[52.4692,13.1974],[52.4685,13.2001],[52.4699,13.2015],[52.4706,13.2049],[52.4696,13.2075],[52.4696,13.2237],[52.4709,13.2311],[52.4696,13.2352],[52.4672,13.2473],[52.4665,13.2574],[52.4669,13.2601],[52.4679,13.2614],[52.4669,13.2628],[52.4682,13.2796],[52.4706,13.289],[52.4672,13.3059],[52.4679,13.3072],[52.4669,13.3099],[52.4665,13.3227],[52.4642,13.3268],[52.4655,13.3294],[52.4652,13.3308],[52.4658,13.3348],[52.4672,13.3362],[52.4591,13.3476],[52.4588,13.349],[52.4564,13.349],[52.4567,13.353],[52.4554,13.3544],[52.4554,13.3557],[52.454,13.3557],[52.451,13.3584],[52.4486,13.3598],[52.4473,13.3598],[52.4459,13.3611],[52.4449,13.3611],[52.4429,13.3638],[52.4304,13.3699],[52.4301,13.3712],[52.4287,13.3712],[52.4267,13.3672],[52.4213,13.3638],[52.4199,13.3584],[52.4142,13.3429],[52.4118,13.3429],[52.4118,13.3436]]]},{"n":"Tempelhof-Sch\u00f6neberg","r":[[[52.4669,13.32],[52.4773,13.32],[52.4777,13.3362],[52.4925,13.3362],[52.4939,13.3375],[52.4969,13.3375],[52.4996,13.3389],[52.5009,13.3362],[52.5047,13.3416],[52.4996,13.3624],[52.4993,13.3665],[52.4982,13.3685],[52.4986,13.3699],[52.4969,13.3685],[52.4928,13.3685],[52.4915,13.3766],[52.4878,13.3725],[52.4878,13.3739],[52.4851,13.3739],[52.4847,13.386],[52.4854,13.386],[52.4854,13.3934],[52.4837,13.3934],[52.4837,13.4002],[52.4851,13.4015],[52.4851,13.4042],[52.4861,13.4069],[52.4827,13.4055],[52.48,13.4055],[52.4777,13.4069],[52.4773,13.4109],[52.4787,13.413],[52.4699,13.4157],[52.4669,13.4157],[52.4655,13.417],[52.4655,13.421],[52.4615,13.421],[52.4615,13.4224],[52.4604,13.4224],[52.4604,13.421],[52.4591,13.4197],[52.4564,13.4264],[52.4564,13.421],[52.4513,13.4157],[52.449,13.4157],[52.4486,13.4143],[52.4469,13.4143],[52.4459,13.413],[52.4446,13.413],[52.4371,13.4096],[52.4355,13.4096],[52.4341,13.4082],[52.4287,13.4069],[52.4287,13.4055],[52.4253,13.4055],[52.4223,13.4029],[52.4213,13.4055],[52.4199,13.4042],[52.4176,13.3988],[52.4145,13.4015],[52.4128,13.4015],[52.4132,13.4096],[52.4101,13.4197],[52.4091,13.4183],[52.4068,13.4183],[52.3926,13.4251],[52.3885,13.4264],[52.3858,13.4264],[52.3858,13.4278],[52.3757,13.421],[52.3764,13.4183],[52.3767,13.4015],[52.3777,13.3961],[52.3777,13.3887],[52.3784,13.3874],[52.3885,13.3874],[52.3885,13.3699],[52.3936,13.3712],[52.3963,13.3638],[52.4054,13.3449],[52.4078,13.3429],[52.4118,13.3436],[52.4118,13.3429],[52.4142,13.3429],[52.4199,13.3584],[52.4213,13.3638],[52.4267,13.3672],[52.4287,13.3712],[52.4301,13.3712],[52.4304,13.3699],[52.4368,13.3672],[52.4395,13.3651],[52.4405,13.3651],[52.4429,13.3638],[52.4449,13.3611],[52.4459,13.3611],[52.4473,13.3598],[52.4486,13.3598],[52.451,13.3584],[52.454,13.3557],[52.4554,13.3557],[52.4554,13.3544],[52.4567,13.353],[52.4564,13.349],[52.4588,13.349],[52.4591,13.3476],[52.4672,13.3362],[52.4658,13.3348],[52.4652,13.3308],[52.4655,13.3294],[52.4642,13.3268],[52.4665,13.3227],[52.4669,13.32]]]},{"n":"Neuk\u00f6lln","r":[[[52.4861,13.4069],[52.4888,13.4082],[52.4864,13.4224],[52.4878,13.4251],[52.4888,13.4251],[52.4908,13.4237],[52.4955,13.4197],[52.4915,13.4352],[52.4908,13.4352],[52.4905,13.4379],[52.4874,13.4446],[52.4888,13.446],[52.4841,13.4554],[52.4854,13.4581],[52.4837,13.4614],[52.4814,13.4628],[52.477,13.4709],[52.4733,13.4695],[52.4709,13.4722],[52.4672,13.4749],[52.4655,13.4776],[52.4618,13.4776],[52.4601,13.4749],[52.4588,13.4749],[52.4591,13.4567],[52.4513,13.4614],[52.45,13.4628],[52.4395,13.485],[52.4317,13.4998],[52.4314,13.5025],[52.428,13.5086],[52.4267,13.514],[52.4263,13.5207],[52.4233,13.518],[52.422,13.518],[52.4209,13.5207],[52.4196,13.5207],[52.4186,13.5221],[52.4145,13.5221],[52.4135,13.5234],[52.4105,13.5234],[52.4071,13.5221],[52.4031,13.5167],[52.4014,13.5153],[52.396,13.479],[52.4,13.479],[52.4004,13.4776],[52.4068,13.4749],[52.4105,13.4722],[52.4172,13.4695],[52.4186,13.4682],[52.4199,13.4682],[52.4209,13.4641],[52.4199,13.4554],[52.4182,13.4513],[52.4182,13.45],[52.4162,13.4473],[52.4135,13.4352],[52.4118,13.4305],[52.4115,13.4251],[52.4101,13.4197],[52.4132,13.4096],[52.4128,13.4015],[52.4145,13.4015],[52.4176,13.3988],[52.4199,13.4042],[52.4213,13.4055],[52.4223,13.4029],[52.4253,13.4055],[52.4287,13.4055],[52.4287,13.4069],[52.4341,13.4082],[52.4355,13.4096],[52.4371,13.4096],[52.4446,13.413],[52.4459,13.413],[52.4469,13.4143],[52.4486,13.4143],[52.449,13.4157],[52.4513,13.4157],[52.4564,13.421],[52.4564,13.4264],[52.4591,13.4197],[52.4604,13.421],[52.4604,13.4224],[52.4615,13.4224],[52.4615,13.421],[52.4655,13.421],[52.4655,13.417],[52.4669,13.4157],[52.4699,13.4157],[52.4787,13.413],[52.4773,13.4109],[52.4777,13.4069],[52.48,13.4055],[52.4827,13.4055],[52.4861,13.4069]]]},{"n":"Treptow-K\u00f6penick","r":[[[52.4014,13.5153],[52.4031,13.5167],[52.4071,13.5221],[52.4105,13.5234],[52.4135,13.5234],[52.4145,13.5221],[52.4186,13.5221],[52.4196,13.5207],[52.4209,13.5207],[52.422,13.518],[52.4233,13.518],[52.4263,13.5207],[52.4267,13.514],[52.428,13.5086],[52.4314,13.5025],[52.4317,13.4998],[52.4395,13.485],[52.45,13.4628],[52.4591,13.4567],[52.4588,13.4749],[52.4601,13.4749],[52.4618,13.4776],[52.4655,13.4776],[52.4672,13.4749],[52.4709,13.4722],[52.4733,13.4695],[52.477,13.4709],[52.4814,13.4628],[52.4837,13.4614],[52.4854,13.4581],[52.4841,13.4554],[52.4888,13.446],[52.4874,13.4446],[52.4895,13.4392],[52.4942,13.4446],[52.4942,13.4473],[52.4972,13.4513],[52.4966,13.4588],[52.4955,13.4628],[52.4942,13.4628],[52.4928,13.4655],[52.4905,13.4749],[52.4888,13.4776],[52.4868,13.4776],[52.4878,13.479],[52.4878,13.4817],[52.4861,13.4823],[52.4878,13.4864],[52.4874,13.4904],[52.4854,13.4931],[52.4827,13.4944],[52.4834,13.4971],[52.4824,13.5012],[52.4746,13.5072],[52.4756,13.5113],[52.4756,13.5153],[52.4736,13.5194],[52.4746,13.5221],[52.4682,13.5295],[52.4682,13.5308],[52.4746,13.5389],[52.4736,13.5416],[52.4733,13.5483],[52.4733,13.5665],[52.4743,13.5665],[52.4763,13.5732],[52.479,13.5753],[52.481,13.5793],[52.48,13.582],[52.481,13.586],[52.4729,13.6029],[52.4729,13.6083],[52.4709,13.6083],[52.4706,13.6123],[52.4696,13.615],[52.4709,13.6163],[52.4706,13.6211],[52.4669,13.6211],[52.4665,13.6224],[52.4685,13.6224],[52.4699,13.6251],[52.4733,13.6251],[52.4733,13.6278],[52.4746,13.6305],[52.4777,13.6413],[52.479,13.6426],[52.4777,13.6514],[52.4733,13.6621],[52.4733,13.6648],[52.4743,13.6675],[52.4685,13.679],[52.4669,13.6803],[52.4655,13.683],[52.4652,13.6891],[52.4642,13.6918],[52.4642,13.6958],[52.4604,13.6972],[52.4577,13.6972],[52.4574,13.6985],[52.455,13.6985],[52.4547,13.7039],[52.4554,13.7052],[52.4594,13.7052],[52.4601,13.7025],[52.4638,13.7025],[52.4682,13.6985],[52.4682,13.7012],[52.4665,13.7025],[52.4628,13.7106],[52.4628,13.7147],[52.4615,13.7167],[52.455,13.7221],[52.455,13.7234],[52.4527,13.7248],[52.452,13.7275],[52.4507,13.7288],[52.45,13.7329],[52.4507,13.7355],[52.4496,13.7362],[52.4486,13.7416],[52.4483,13.7497],[52.4473,13.7537],[52.4459,13.7551],[52.4456,13.7564],[52.4432,13.7537],[52.4422,13.7564],[52.4382,13.7551],[52.4378,13.7611],[52.4358,13.7598],[52.4368,13.7537],[52.4415,13.7564],[52.4415,13.7497],[52.4395,13.7457],[52.4382,13.7443],[52.4344,13.743],[52.4328,13.743],[52.4328,13.7342],[52.4355,13.7248],[52.4331,13.7315],[52.4324,13.7403],[52.4287,13.7389],[52.428,13.7416],[52.4263,13.7416],[52.4263,13.7376],[52.4206,13.7315],[52.4186,13.7315],[52.4176,13.7302],[52.4149,13.7302],[52.4115,13.7342],[52.4105,13.7342],[52.4095,13.7362],[52.4068,13.7389],[52.4058,13.7355],[52.4041,13.7342],[52.4017,13.7342],[52.4,13.7315],[52.3997,13.7248],[52.398,13.7234],[52.399,13.7194],[52.3987,13.718],[52.3997,13.7167],[52.395,13.7079],[52.395,13.7052],[52.3936,13.7052],[52.3933,13.7025],[52.3909,13.6999],[52.3906,13.6985],[52.3912,13.6972],[52.3896,13.6972],[52.3885,13.6945],[52.3869,13.6931],[52.3848,13.6891],[52.3855,13.6884],[52.3848,13.6857],[52.3835,13.6857],[52.3828,13.6871],[52.3831,13.6891],[52.3808,13.6945],[52.3815,13.6985],[52.3771,13.6972],[52.3777,13.6985],[52.3771,13.6999],[52.3737,13.6985],[52.371,13.6958],[52.3696,13.6931],[52.3676,13.6931],[52.3673,13.6871],[52.3696,13.683],[52.369,13.6776],[52.3663,13.6709],[52.3646,13.6695],[52.3646,13.6682],[52.3619,13.6662],[52.3582,13.6662],[52.3582,13.6648],[52.3568,13.6621],[52.3541,13.6621],[52.3528,13.6581],[52.3521,13.6594],[52.3517,13.6568],[52.349,13.6568],[52.3453,13.6527],[52.3426,13.6514],[52.3389,13.6514],[52.3386,13.65],[52.3386,13.6446],[52.3399,13.6446],[52.3399,13.6426],[52.3453,13.6359],[52.348,13.6359],[52.348,13.6372],[52.3571,13.6372],[52.3575,13.6386],[52.3598,13.6386],[52.3632,13.6413],[52.3649,13.646],[52.3666,13.6473],[52.3686,13.6473],[52.37,13.646],[52.3703,13.6413],[52.3713,13.6426],[52.3771,13.6426],[52.3764,13.6332],[52.3794,13.6291],[52.3815,13.6278],[52.3784,13.6211],[52.3767,13.615],[52.3757,13.6137],[52.3737,13.6056],[52.3757,13.6069],[52.3777,13.6056],[52.3794,13.6056],[52.3831,13.6029],[52.3842,13.6002],[52.3855,13.5995],[52.3858,13.5955],[52.3872,13.5941],[52.3885,13.5955],[52.3885,13.5941],[52.3896,13.5928],[52.3909,13.5941],[52.3923,13.5941],[52.3936,13.5928],[52.3899,13.5766],[52.3882,13.5652],[52.3885,13.5349],[52.3953,13.5349],[52.3953,13.5362],[52.3977,13.5362],[52.3977,13.5375],[52.4,13.5375],[52.3987,13.5322],[52.398,13.5322],[52.3973,13.5295],[52.3987,13.5274],[52.4004,13.5221],[52.4014,13.5153]]]},{"n":"Marzahn-Hellersdorf","r":[[[52.5742,13.5679],[52.5728,13.5679],[52.5739,13.5753],[52.5712,13.578],[52.5712,13.5807],[52.5685,13.582],[52.5685,13.5833],[52.561,13.5833],[52.5583,13.5847],[52.556,13.5874],[52.5529,13.5874],[52.5519,13.586],[52.5496,13.586],[52.5452,13.6096],[52.5452,13.6137],[52.5438,13.619],[52.5418,13.6372],[52.5404,13.6372],[52.5377,13.6345],[52.5374,13.6251],[52.53,13.6251],[52.53,13.6291],[52.5307,13.6305],[52.53,13.6345],[52.5307,13.6359],[52.53,13.6372],[52.5296,13.6568],[52.5273,13.6568],[52.5256,13.6581],[52.5209,13.6473],[52.5168,13.6399],[52.5121,13.6332],[52.5057,13.6291],[52.505,13.6278],[52.5033,13.6278],[52.4996,13.6264],[52.4942,13.6238],[52.4932,13.6251],[52.4928,13.6291],[52.4797,13.6137],[52.4756,13.6137],[52.4743,13.6163],[52.4706,13.611],[52.4709,13.6083],[52.4729,13.6083],[52.4729,13.6029],[52.481,13.586],[52.48,13.582],[52.481,13.5793],[52.479,13.5753],[52.4763,13.5732],[52.4743,13.5665],[52.4733,13.5665],[52.4733,13.5524],[52.477,13.551],[52.4797,13.5483],[52.4797,13.547],[52.4824,13.547],[52.4847,13.5497],[52.4905,13.547],[52.4928,13.5443],[52.4959,13.5443],[52.4982,13.5416],[52.4982,13.5389],[52.4999,13.5375],[52.502,13.5375],[52.5047,13.5349],[52.506,13.5362],[52.5101,13.5362],[52.5101,13.5375],[52.5121,13.5375],[52.5138,13.5335],[52.5138,13.518],[52.5192,13.518],[52.5192,13.5194],[52.5286,13.5194],[52.53,13.518],[52.5334,13.518],[52.5347,13.5167],[52.5357,13.5167],[52.5361,13.5221],[52.5391,13.5322],[52.5415,13.5308],[52.5435,13.5308],[52.5435,13.5295],[52.5465,13.5295],[52.5489,13.5281],[52.5519,13.5274],[52.5546,13.5248],[52.5556,13.5248],[52.557,13.5295],[52.5661,13.5402],[52.5661,13.5429],[52.5674,13.5456],[52.5725,13.5652],[52.5742,13.5679]]]},{"n":"Lichtenberg","r":[[[52.4874,13.4904],[52.4878,13.4918],[52.4895,13.4877],[52.4986,13.4722],[52.4996,13.4682],[52.5009,13.4695],[52.5023,13.4695],[52.506,13.4722],[52.5101,13.4763],[52.5121,13.4749],[52.5148,13.4749],[52.5161,13.4763],[52.5205,13.4722],[52.5232,13.4682],[52.5242,13.4614],[52.5283,13.4554],[52.5293,13.4601],[52.533,13.4641],[52.5347,13.4682],[52.5364,13.4655],[52.5401,13.4695],[52.5479,13.4668],[52.5475,13.479],[52.5479,13.4803],[52.5492,13.479],[52.5492,13.4823],[52.5519,13.485],[52.5506,13.4944],[52.5529,13.4958],[52.5546,13.4958],[52.5587,13.4918],[52.5597,13.4918],[52.561,13.4877],[52.561,13.485],[52.5637,13.4864],[52.5644,13.4837],[52.5661,13.4837],[52.5688,13.4877],[52.5715,13.4823],[52.5725,13.4823],[52.5725,13.479],[52.5766,13.479],[52.5776,13.4803],[52.5793,13.479],[52.582,13.479],[52.5833,13.4803],[52.584,13.4837],[52.588,13.485],[52.5901,13.4904],[52.5924,13.4944],[52.5961,13.5052],[52.5921,13.5072],[52.5924,13.5221],[52.5894,13.5416],[52.5887,13.5416],[52.588,13.547],[52.5874,13.547],[52.582,13.5598],[52.5742,13.5679],[52.5725,13.5652],[52.5674,13.5456],[52.5661,13.5429],[52.5661,13.5402],[52.557,13.5295],[52.5556,13.5248],[52.5546,13.5248],[52.5519,13.5274],[52.5489,13.5281],[52.5465,13.5295],[52.5435,13.5295],[52.5435,13.5308],[52.5415,13.5308],[52.5391,13.5322],[52.5361,13.5221],[52.5357,13.5167],[52.5347,13.5167],[52.5334,13.518],[52.53,13.518],[52.5286,13.5194],[52.5192,13.5194],[52.5192,13.518],[52.5138,13.518],[52.5138,13.5335],[52.5121,13.5375],[52.5101,13.5375],[52.5101,13.5362],[52.506,13.5362],[52.5047,13.5349],[52.502,13.5375],[52.4999,13.5375],[52.4982,13.5389],[52.4982,13.5416],[52.4959,13.5443],[52.4928,13.5443],[52.4905,13.547],[52.4847,13.5497],[52.4824,13.547],[52.4797,13.547],[52.4797,13.5483],[52.477,13.551],[52.4733,13.5524],[52.4736,13.5416],[52.4746,13.5389],[52.4682,13.5308],[52.4682,13.5295],[52.4746,13.5221],[52.4736,13.5194],[52.4756,13.5153],[52.4756,13.5113],[52.4746,13.5072],[52.4824,13.5012],[52.4834,13.4971],[52.4827,13.4944],[52.4854,13.4931],[52.4874,13.4904]]]},{"n":"Reinickendorf","r":[[[52.5674,13.3887],[52.5674,13.3833],[52.5661,13.3806],[52.5661,13.3779],[52.5607,13.3766],[52.5607,13.3699],[52.5597,13.3699],[52.558,13.3651],[52.561,13.3638],[52.56,13.3598],[52.5614,13.3598],[52.562,13.3571],[52.562,13.349],[52.5644,13.3362],[52.5614,13.3321],[52.5624,13.3294],[52.5624,13.3268],[52.561,13.3254],[52.56,13.3227],[52.5597,13.3167],[52.5583,13.314],[52.558,13.3099],[52.5546,13.3072],[52.5529,13.3045],[52.5489,13.3018],[52.5492,13.256],[52.5509,13.2507],[52.561,13.2298],[52.5634,13.2278],[52.5644,13.2284],[52.5664,13.2284],[52.5674,13.2264],[52.5688,13.2264],[52.5712,13.2251],[52.5728,13.2251],[52.5755,13.2197],[52.5782,13.217],[52.5793,13.2183],[52.5816,13.2183],[52.584,13.2143],[52.587,13.217],[52.5901,13.2183],[52.5924,13.2183],[52.5948,13.2156],[52.5988,13.2075],[52.5999,13.2075],[52.6039,13.2015],[52.6066,13.2015],[52.609,13.2062],[52.6157,13.2116],[52.6161,13.2129],[52.6188,13.2143],[52.6198,13.217],[52.6245,13.2197],[52.6279,13.2197],[52.6285,13.2251],[52.6275,13.2264],[52.6275,13.2601],[52.6265,13.2641],[52.6326,13.2641],[52.6343,13.2655],[52.639,13.2614],[52.6407,13.2614],[52.6393,13.2695],[52.6407,13.2837],[52.6485,13.2837],[52.6485,13.285],[52.6525,13.285],[52.6525,13.281],[52.6539,13.2823],[52.6603,13.2823],[52.6599,13.2904],[52.6589,13.2931],[52.6593,13.3072],[52.6576,13.3086],[52.6572,13.3099],[52.6535,13.3005],[52.6461,13.3059],[52.6434,13.3086],[52.641,13.3086],[52.6397,13.3072],[52.6393,13.3059],[52.6377,13.3072],[52.6366,13.3059],[52.6319,13.3099],[52.6302,13.3099],[52.6289,13.3086],[52.6275,13.3018],[52.6279,13.3099],[52.6262,13.3193],[52.6258,13.3268],[52.6225,13.3362],[52.6228,13.3416],[52.6238,13.3436],[52.6238,13.3503],[52.6228,13.3517],[52.6235,13.3557],[52.6228,13.3571],[52.6238,13.3611],[52.6248,13.3624],[52.6248,13.3672],[52.6225,13.3685],[52.6198,13.3712],[52.6188,13.3712],[52.6134,13.3752],[52.6117,13.3752],[52.6107,13.3766],[52.6093,13.3766],[52.6066,13.3752],[52.5999,13.3712],[52.5985,13.3699],[52.5975,13.3672],[52.5948,13.3651],[52.5914,13.3611],[52.5907,13.3503],[52.5897,13.3476],[52.5843,13.3571],[52.582,13.3624],[52.5809,13.3624],[52.5789,13.3685],[52.5789,13.3672],[52.5749,13.3766],[52.5725,13.3793],[52.5718,13.3833],[52.5701,13.3874],[52.5678,13.3894],[52.5674,13.3887]]]}],"p":[{"n":null,"r":[[[52.5382,13.3724],[52.5372,13.3741],[52.5401,13.3791],[52.5333,13.3869],[52.5376,13.393],[52.5396,13.3999],[52.5364,13.4005],[52.5353,13.3977],[52.5328,13.3987],[52.5326,13.3962],[52.524,13.3995],[52.5239,13.4012],[52.5233,13.4003],[52.5251,13.393],[52.5267,13.3936],[52.5275,13.3968],[52.5285,13.3958],[52.5265,13.3876],[52.5242,13.3879],[52.5237,13.3795],[52.5291,13.3785],[52.5281,13.3731],[52.5358,13.3655],[52.5382,13.3724]]]},{"n":null,"r":[[[52.5233,13.4003],[52.5222,13.4005],[52.5226,13.3954],[52.5214,13.394],[52.5191,13.3972],[52.5126,13.4025],[52.5117,13.4013],[52.5116,13.4056],[52.5103,13.4058],[52.5085,13.4041],[52.5098,13.4002],[52.5084,13.3991],[52.5073,13.3789],[52.5084,13.3758],[52.5157,13.3773],[52.5163,13.3765],[52.5197,13.3768],[52.522,13.3752],[52.5228,13.3715],[52.5265,13.3707],[52.5266,13.3731],[52.5281,13.3731],[52.5291,13.3785],[52.5237,13.3795],[52.5242,13.3879],[52.5265,13.3876],[52.5285,13.3958],[52.5275,13.3968],[52.5267,13.3936],[52.5251,13.393],[52.5233,13.4003]]]},{"n":null,"r":[[[52.5364,13.4005],[52.5346,13.4051],[52.5357,13.4064],[52.5329,13.4126],[52.5292,13.4092],[52.5244,13.4092],[52.5272,13.4009],[52.5293,13.3993],[52.5293,13.3985],[52.5279,13.3989],[52.5276,13.3979],[52.5326,13.3962],[52.5328,13.3987],[52.5353,13.3977],[52.5364,13.4005]]]},{"n":null,"r":[[[52.5292,13.4092],[52.5237,13.4255],[52.5228,13.4255],[52.5217,13.4295],[52.5197,13.4289],[52.5189,13.4283],[52.5194,13.4257],[52.5224,13.4166],[52.5113,13.402],[52.5117,13.4013],[52.5126,13.4025],[52.5191,13.3972],[52.5214,13.394],[52.5226,13.3954],[52.5222,13.4005],[52.5239,13.4012],[52.524,13.3995],[52.5276,13.3979],[52.5279,13.3989],[52.5293,13.3985],[52.529,13.3999],[52.5272,13.4009],[52.5244,13.4092],[52.5292,13.4092]]]},{"n":null,"r":[[[52.5189,13.4283],[52.5126,13.423],[52.5092,13.4297],[52.5063,13.4275],[52.5063,13.4195],[52.5046,13.4174],[52.5054,13.415],[52.5045,13.4142],[52.5053,13.4117],[52.5075,13.41],[52.5067,13.4082],[52.5089,13.4051],[52.5085,13.4041],[52.5103,13.4058],[52.5116,13.4056],[52.5118,13.4028],[52.5224,13.4166],[52.5189,13.4283]]]},{"n":null,"r":[[[52.5237,13.4255],[52.5233,13.434],[52.5187,13.4412],[52.5179,13.4488],[52.5187,13.4525],[52.5168,13.4537],[52.5077,13.4506],[52.5017,13.4455],[52.5126,13.423],[52.5197,13.4289],[52.5217,13.4295],[52.5228,13.4255],[52.5237,13.4255]]]},{"n":null,"r":[[[52.5147,13.4531],[52.5115,13.4641],[52.5063,13.4709],[52.4996,13.4683],[52.4972,13.4759],[52.4947,13.4764],[52.4918,13.485],[52.4903,13.4864],[52.489,13.4903],[52.4884,13.4899],[52.4871,13.4842],[52.4885,13.4813],[52.4878,13.4792],[52.4902,13.4773],[52.4914,13.4746],[52.4946,13.4633],[52.4954,13.4638],[52.4965,13.4616],[52.4981,13.4539],[52.5017,13.4455],[52.5077,13.4506],[52.5147,13.4531]]]},{"n":null,"r":[[[52.5259,13.459],[52.5227,13.4693],[52.521,13.4722],[52.5155,13.4765],[52.5147,13.4759],[52.5109,13.4762],[52.5063,13.4709],[52.5115,13.4641],[52.5147,13.4531],[52.5168,13.4537],[52.5187,13.4525],[52.5189,13.4538],[52.5259,13.459]]]},{"n":null,"r":[[[52.5286,13.4241],[52.5291,13.4301],[52.5285,13.4336],[52.5294,13.438],[52.5262,13.4414],[52.5288,13.4559],[52.5259,13.459],[52.5189,13.4538],[52.5179,13.4488],[52.5187,13.4412],[52.5233,13.434],[52.5237,13.4255],[52.5258,13.4202],[52.5286,13.4241]]]},{"n":null,"r":[[[52.5143,13.5076],[52.5142,13.5338],[52.5134,13.5368],[52.5104,13.5387],[52.5063,13.5206],[52.5058,13.5141],[52.5035,13.5099],[52.5009,13.4953],[52.5067,13.4982],[52.5117,13.502],[52.5143,13.5076]]]},{"n":null,"r":[[[52.5073,13.4722],[52.5069,13.4792],[52.5037,13.4833],[52.5118,13.4991],[52.5143,13.5076],[52.5117,13.502],[52.5098,13.5004],[52.5009,13.4953],[52.4959,13.4936],[52.4919,13.5036],[52.4916,13.5098],[52.4873,13.5054],[52.4848,13.5064],[52.484,13.5021],[52.4831,13.5025],[52.4838,13.4942],[52.4867,13.4925],[52.4884,13.4899],[52.489,13.4903],[52.4947,13.4764],[52.4972,13.4759],[52.4996,13.4683],[52.5063,13.4709],[52.5073,13.4722]]]},{"n":null,"r":[[[52.4916,13.5098],[52.4993,13.5434],[52.4944,13.545],[52.4865,13.55],[52.4835,13.5487],[52.4801,13.5492],[52.4737,13.5528],[52.4731,13.5456],[52.4757,13.5393],[52.4687,13.5312],[52.4761,13.5215],[52.4752,13.5214],[52.4764,13.5156],[52.475,13.5087],[52.477,13.5064],[52.484,13.5021],[52.4848,13.5064],[52.4873,13.5054],[52.4916,13.5098]]]},{"n":null,"r":[[[52.5098,13.5367],[52.506,13.5364],[52.5004,13.5411],[52.4993,13.5434],[52.4916,13.5098],[52.4919,13.5036],[52.4959,13.4936],[52.5009,13.4953],[52.5035,13.5099],[52.5058,13.5141],[52.5063,13.5206],[52.5098,13.5367]]]},{"n":null,"r":[[[52.5339,13.4855],[52.5355,13.518],[52.5333,13.5196],[52.5217,13.5202],[52.5147,13.5194],[52.5137,13.5042],[52.5037,13.4833],[52.5069,13.4792],[52.5073,13.4722],[52.5109,13.4762],[52.5138,13.4759],[52.5131,13.4846],[52.5191,13.4858],[52.5339,13.4855]]]},{"n":null,"r":[[[52.5334,13.4764],[52.5339,13.4855],[52.5191,13.4858],[52.5131,13.4846],[52.5138,13.4759],[52.5155,13.4765],[52.521,13.4722],[52.5219,13.4704],[52.5237,13.4713],[52.5235,13.4798],[52.5272,13.4801],[52.5334,13.4764]]]},{"n":null,"r":[[[52.5378,13.4665],[52.5409,13.4701],[52.5334,13.4764],[52.5272,13.4801],[52.5235,13.4798],[52.5237,13.4713],[52.5219,13.4704],[52.5259,13.459],[52.5288,13.4559],[52.5301,13.4611],[52.5378,13.4665]]]},{"n":null,"r":[[[52.5447,13.4268],[52.5409,13.438],[52.5258,13.4202],[52.5292,13.4092],[52.5329,13.4126],[52.5328,13.4142],[52.5397,13.4208],[52.5397,13.4239],[52.5447,13.4268]]]},{"n":null,"r":[[[52.5418,13.4558],[52.5378,13.4665],[52.5301,13.4611],[52.5262,13.4414],[52.5294,13.438],[52.5285,13.4336],[52.5291,13.4301],[52.5286,13.4241],[52.5409,13.438],[52.5365,13.4477],[52.5418,13.4558]]]},{"n":null,"r":[[[52.5514,13.4299],[52.5418,13.4558],[52.5365,13.4477],[52.5447,13.4268],[52.5514,13.4299]]]},{"n":null,"r":[[[52.5402,13.4034],[52.5415,13.4084],[52.5397,13.4239],[52.5397,13.4208],[52.5328,13.4142],[52.5357,13.4064],[52.5346,13.4051],[52.5364,13.4005],[52.5396,13.3999],[52.5402,13.4034]]]},{"n":null,"r":[[[52.551,13.3987],[52.5498,13.4028],[52.5492,13.4164],[52.5447,13.4268],[52.5397,13.4239],[52.5415,13.4084],[52.5402,13.4034],[52.551,13.3987]]]},{"n":null,"r":[[[52.5588,13.3968],[52.5581,13.4139],[52.554,13.414],[52.5526,13.4272],[52.5514,13.4299],[52.5447,13.4268],[52.5498,13.4136],[52.5498,13.4028],[52.551,13.3987],[52.5504,13.3967],[52.5529,13.3979],[52.5588,13.3968]]]},{"n":null,"r":[[[52.534,13.328],[52.5359,13.343],[52.5262,13.3431],[52.5275,13.3283],[52.534,13.328]]]},{"n":null,"r":[[[52.5356,13.312],[52.5376,13.3286],[52.5275,13.3283],[52.5239,13.3273],[52.5249,13.3238],[52.5244,13.3197],[52.5238,13.3184],[52.5219,13.3182],[52.5206,13.3168],[52.5356,13.312]]]},{"n":null,"r":[[[52.5262,13.3431],[52.5186,13.3404],[52.5178,13.3388],[52.5137,13.3359],[52.5169,13.335],[52.518,13.3299],[52.5219,13.3298],[52.5239,13.3273],[52.5275,13.3283],[52.5262,13.3431]]]},{"n":null,"r":[[[52.5373,13.3601],[52.5369,13.3649],[52.5277,13.3735],[52.5265,13.3731],[52.5265,13.3707],[52.5252,13.3707],[52.5247,13.3715],[52.5228,13.3715],[52.5212,13.3758],[52.5197,13.3768],[52.5162,13.3766],[52.5145,13.3512],[52.5153,13.3497],[52.5145,13.3484],[52.5137,13.3359],[52.5178,13.3388],[52.5186,13.3404],[52.5253,13.3424],[52.5235,13.3568],[52.5246,13.3568],[52.5326,13.3504],[52.5373,13.3601]]]},{"n":null,"r":[[[52.5359,13.343],[52.5379,13.3566],[52.5373,13.3601],[52.5326,13.3504],[52.5246,13.3568],[52.5235,13.3568],[52.5253,13.3424],[52.5262,13.3431],[52.5359,13.343]]]},{"n":null,"r":[[[52.5198,13.2992],[52.5131,13.3207],[52.511,13.2967],[52.5197,13.2958],[52.5198,13.2992]]]},{"n":null,"r":[[[52.5239,13.3273],[52.5219,13.3298],[52.518,13.3299],[52.5169,13.335],[52.5137,13.3359],[52.512,13.3207],[52.5131,13.3207],[52.5198,13.2992],[52.522,13.2998],[52.5206,13.3066],[52.5202,13.3155],[52.5213,13.3177],[52.5238,13.3184],[52.5244,13.3197],[52.5249,13.3238],[52.5239,13.3273]]]},{"n":null,"r":[[[52.5322,13.2928],[52.5356,13.312],[52.5206,13.3168],[52.5206,13.3066],[52.5224,13.2978],[52.5237,13.2966],[52.5308,13.2949],[52.5322,13.2928]]]},{"n":null,"r":[[[52.5137,13.3359],[52.5038,13.331],[52.5016,13.3193],[52.5072,13.3201],[52.5073,13.3211],[52.5089,13.3195],[52.5113,13.3224],[52.5125,13.3224],[52.5137,13.3359]]]},{"n":null,"r":[[[52.512,13.3221],[52.5113,13.3224],[52.5089,13.3195],[52.5073,13.3211],[52.5072,13.3201],[52.5049,13.3196],[52.5054,13.3077],[52.5065,13.3089],[52.5118,13.309],[52.512,13.3221]]]},{"n":null,"r":[[[52.5118,13.309],[52.5065,13.3089],[52.5054,13.3077],[52.5042,13.2996],[52.5068,13.2987],[52.5068,13.2946],[52.511,13.2967],[52.5118,13.309]]]},{"n":null,"r":[[[52.5049,13.3196],[52.5016,13.3193],[52.4992,13.302],[52.5026,13.2952],[52.5052,13.3046],[52.5049,13.3196]]]},{"n":null,"r":[[[52.5016,13.3193],[52.4985,13.3183],[52.4981,13.3198],[52.4925,13.3192],[52.4906,13.3138],[52.4953,13.3086],[52.5001,13.3065],[52.5016,13.3193]]]},{"n":null,"r":[[[52.5001,13.3065],[52.4953,13.3086],[52.4906,13.3138],[52.4886,13.3075],[52.4888,13.3017],[52.488,13.2999],[52.4919,13.2947],[52.4929,13.2965],[52.4937,13.2955],[52.4982,13.2961],[52.5001,13.3065]]]},{"n":null,"r":[[[52.4992,13.302],[52.4982,13.2961],[52.4937,13.2955],[52.4929,13.2965],[52.4919,13.2947],[52.4941,13.2897],[52.4943,13.2864],[52.4982,13.2815],[52.5026,13.2952],[52.4992,13.302]]]},{"n":null,"r":[[[52.4925,13.3192],[52.4874,13.3192],[52.4867,13.3205],[52.4777,13.3203],[52.4797,13.313],[52.488,13.2999],[52.4888,13.3017],[52.4886,13.3075],[52.4925,13.3192]]]},{"n":null,"r":[[[52.4867,13.3205],[52.4871,13.3295],[52.4885,13.337],[52.4787,13.3367],[52.4777,13.3203],[52.4867,13.3205]]]},{"n":null,"r":[[[52.4963,13.3304],[52.4962,13.3333],[52.4933,13.3332],[52.4912,13.3367],[52.4885,13.337],[52.4868,13.3261],[52.4874,13.3192],[52.4925,13.3192],[52.4963,13.3304]]]},{"n":null,"r":[[[52.5038,13.331],[52.4963,13.3304],[52.4925,13.3192],[52.4981,13.3198],[52.4985,13.3183],[52.5016,13.3193],[52.5038,13.331]]]},{"n":null,"r":[[[52.5011,13.3468],[52.5002,13.3538],[52.4994,13.3549],[52.4991,13.354],[52.4972,13.3545],[52.4956,13.3407],[52.4963,13.3304],[52.5003,13.3306],[52.4994,13.3348],[52.5001,13.346],[52.5011,13.3468]]]},{"n":null,"r":[[[52.4961,13.3462],[52.4893,13.345],[52.4885,13.337],[52.4912,13.3367],[52.4939,13.333],[52.4962,13.3333],[52.4956,13.3407],[52.4961,13.3462]]]},{"n":null,"r":[[[52.4972,13.3545],[52.496,13.3612],[52.4908,13.3606],[52.4893,13.345],[52.4961,13.3462],[52.4972,13.3545]]]},{"n":null,"r":[[[52.5002,13.3532],[52.5021,13.3531],[52.4989,13.3706],[52.4916,13.3667],[52.4915,13.3608],[52.496,13.3612],[52.4972,13.3545],[52.4991,13.354],[52.4994,13.3549],[52.5002,13.3532]]]},{"n":null,"r":[[[52.5162,13.3766],[52.5157,13.3773],[52.5084,13.3758],[52.508,13.3776],[52.5035,13.3741],[52.5045,13.3732],[52.4989,13.3706],[52.4997,13.3629],[52.5031,13.3495],[52.5054,13.3517],[52.5137,13.3501],[52.5145,13.3484],[52.5151,13.3488],[52.5145,13.3512],[52.5162,13.3766]]]},{"n":null,"r":[[[52.5145,13.3484],[52.5137,13.3501],[52.5054,13.3517],[52.5031,13.3495],[52.5021,13.3531],[52.5002,13.3532],[52.5022,13.3418],[52.5066,13.3317],[52.5137,13.3359],[52.5145,13.3484]]]},{"n":null,"r":[[[52.5066,13.3317],[52.5022,13.3418],[52.5011,13.3468],[52.5001,13.346],[52.4994,13.3348],[52.5003,13.3306],[52.5066,13.3317]]]},{"n":null,"r":[[[52.4916,13.3667],[52.4819,13.3481],[52.4856,13.345],[52.4893,13.345],[52.4916,13.3667]]]},{"n":null,"r":[[[52.4893,13.345],[52.4847,13.3452],[52.4819,13.3481],[52.4787,13.3441],[52.4787,13.3367],[52.4885,13.337],[52.4893,13.345]]]},{"n":null,"r":[[[52.4916,13.3667],[52.4759,13.3475],[52.4787,13.3441],[52.4832,13.3503],[52.4916,13.3667]]]},{"n":null,"r":[[[52.4933,13.3681],[52.4927,13.3714],[52.4919,13.3718],[52.4855,13.3704],[52.4853,13.3711],[52.476,13.3655],[52.4731,13.3684],[52.4723,13.3712],[52.4708,13.3717],[52.4703,13.3699],[52.4711,13.3691],[52.471,13.366],[52.4699,13.3632],[52.4707,13.3605],[52.4739,13.3612],[52.4733,13.3492],[52.4706,13.3409],[52.4752,13.3479],[52.4759,13.3475],[52.4889,13.364],[52.4933,13.3681]]]},{"n":null,"r":[[[52.4983,13.392],[52.4969,13.4057],[52.4953,13.4069],[52.4941,13.4063],[52.4895,13.4078],[52.4895,13.3943],[52.4906,13.3867],[52.4938,13.388],[52.4983,13.392]]]},{"n":null,"r":[[[52.5078,13.3865],[52.4987,13.3897],[52.4983,13.392],[52.4938,13.388],[52.4864,13.3861],[52.4852,13.3825],[52.4855,13.3704],[52.4919,13.3718],[52.4927,13.3714],[52.4933,13.3681],[52.5045,13.3732],[52.5035,13.3741],[52.508,13.3776],[52.5073,13.3789],[52.5078,13.3865]]]},{"n":null,"r":[[[52.4895,13.4078],[52.4872,13.4243],[52.4867,13.4211],[52.4807,13.421],[52.4804,13.4183],[52.4787,13.4185],[52.4793,13.415],[52.4783,13.4117],[52.479,13.4069],[52.481,13.406],[52.4831,13.4064],[52.4834,13.4055],[52.4849,13.3885],[52.4864,13.3861],[52.4906,13.3867],[52.4895,13.3943],[52.4895,13.4078]]]},{"n":null,"r":[[[52.4969,13.4057],[52.4959,13.4127],[52.4962,13.4206],[52.4883,13.4255],[52.4872,13.4243],[52.4895,13.4078],[52.4941,13.4063],[52.4953,13.4069],[52.4969,13.4057]]]},{"n":null,"r":[[[52.5085,13.4041],[52.5089,13.4051],[52.5067,13.4082],[52.5075,13.41],[52.5053,13.4117],[52.5045,13.4142],[52.5054,13.415],[52.5044,13.4179],[52.503,13.4169],[52.5028,13.4151],[52.5018,13.4162],[52.5,13.4148],[52.5,13.4131],[52.4991,13.4124],[52.4982,13.4131],[52.4959,13.4127],[52.4983,13.3961],[52.4981,13.3909],[52.4987,13.3897],[52.5078,13.3865],[52.5084,13.3991],[52.5098,13.4002],[52.5085,13.4041]]]},{"n":null,"r":[[[52.5092,13.4297],[52.4981,13.4539],[52.4975,13.4513],[52.4951,13.4481],[52.4947,13.4451],[52.4991,13.4325],[52.4984,13.4309],[52.5015,13.4195],[52.5058,13.4224],[52.5063,13.4275],[52.5092,13.4297]]]},{"n":null,"r":[[[52.5058,13.4224],[52.5015,13.4195],[52.4984,13.4309],[52.4991,13.4325],[52.4947,13.4451],[52.4903,13.4399],[52.4899,13.4383],[52.4908,13.4385],[52.4962,13.4206],[52.4959,13.4127],[52.4982,13.4131],[52.4991,13.4124],[52.5,13.4131],[52.5,13.4148],[52.5018,13.4162],[52.5028,13.4151],[52.503,13.4169],[52.5063,13.4195],[52.5058,13.4224]]]},{"n":null,"r":[[[52.4883,13.4255],[52.4852,13.4342],[52.4784,13.4484],[52.4769,13.4466],[52.4762,13.449],[52.4748,13.4497],[52.4742,13.441],[52.4815,13.4354],[52.4872,13.4243],[52.4883,13.4255]]]},{"n":null,"r":[[[52.4903,13.4399],[52.4872,13.4407],[52.4842,13.4472],[52.4809,13.4433],[52.4865,13.4304],[52.4917,13.4357],[52.4908,13.4385],[52.4899,13.4383],[52.4903,13.4399]]]},{"n":null,"r":[[[52.4917,13.4357],[52.4865,13.4304],[52.4883,13.4255],[52.4962,13.4206],[52.4917,13.4357]]]},{"n":null,"r":[[[52.4872,13.4243],[52.481,13.4255],[52.4738,13.4285],[52.4728,13.415],[52.4789,13.4133],[52.4787,13.4185],[52.4804,13.4183],[52.4807,13.421],[52.4867,13.4211],[52.4872,13.4243]]]},{"n":null,"r":[[[52.4738,13.4285],[52.4725,13.4292],[52.4742,13.441],[52.4666,13.4425],[52.4643,13.4447],[52.4616,13.4241],[52.4619,13.4231],[52.4657,13.4217],[52.4653,13.4175],[52.4728,13.415],[52.4738,13.4285]]]},{"n":null,"r":[[[52.4742,13.441],[52.4725,13.4292],[52.481,13.4255],[52.4872,13.4243],[52.4815,13.4354],[52.4742,13.441]]]},{"n":null,"r":[[[52.4784,13.4484],[52.4739,13.4567],[52.4713,13.4533],[52.47,13.442],[52.4742,13.441],[52.4746,13.4495],[52.4762,13.449],[52.4769,13.4466],[52.4784,13.4484]]]},{"n":null,"r":[[[52.4742,13.4567],[52.4863,13.4592],[52.4778,13.4711],[52.4743,13.4701],[52.466,13.4788],[52.4647,13.479],[52.4594,13.4754],[52.4598,13.4575],[52.464,13.4528],[52.4658,13.4534],[52.4641,13.4466],[52.4643,13.4447],[52.4666,13.4425],[52.47,13.442],[52.4713,13.4533],[52.4742,13.4567]]]},{"n":null,"r":[[[52.4903,13.4399],[52.4881,13.4446],[52.4896,13.4471],[52.4849,13.4564],[52.4863,13.4592],[52.4742,13.4567],[52.4809,13.4433],[52.4842,13.4472],[52.4872,13.4407],[52.4903,13.4399]]]},{"n":null,"r":[[[52.4702,13.3855],[52.4697,13.3896],[52.4652,13.4036],[52.4664,13.4171],[52.4653,13.4175],[52.4657,13.4217],[52.4619,13.4231],[52.4616,13.4241],[52.4601,13.421],[52.4574,13.4274],[52.457,13.4216],[52.453,13.4179],[52.4538,13.4088],[52.453,13.4084],[52.4528,13.3846],[52.4572,13.3839],[52.4649,13.3857],[52.4702,13.3855]]]},{"n":null,"r":[[[52.4864,13.3861],[52.4849,13.3885],[52.4834,13.4055],[52.4831,13.4064],[52.481,13.406],[52.479,13.4069],[52.4783,13.4117],[52.4789,13.4133],[52.4664,13.4171],[52.4652,13.4036],[52.4697,13.3896],[52.4712,13.3716],[52.4723,13.3712],[52.4731,13.3684],[52.4753,13.3659],[52.476,13.3655],[52.4853,13.3711],[52.4852,13.3825],[52.4864,13.3861]]]},{"n":null,"r":[[[52.4702,13.3855],[52.4649,13.3857],[52.4561,13.384],[52.4562,13.3776],[52.4555,13.3758],[52.4568,13.3569],[52.4633,13.3589],[52.4699,13.3632],[52.471,13.366],[52.4711,13.3691],[52.4703,13.3699],[52.4712,13.3716],[52.4702,13.3855]]]},{"n":null,"r":[[[52.4561,13.384],[52.4406,13.3875],[52.4399,13.3818],[52.4411,13.3811],[52.4434,13.3757],[52.4472,13.3617],[52.4536,13.3576],[52.4568,13.3569],[52.4555,13.3758],[52.4562,13.3776],[52.4561,13.384]]]},{"n":null,"r":[[[52.4406,13.3875],[52.4412,13.3927],[52.4394,13.4118],[52.4306,13.407],[52.4288,13.4074],[52.4225,13.404],[52.422,13.4055],[52.4207,13.4048],[52.4184,13.3997],[52.4171,13.4],[52.4169,13.3985],[52.4234,13.3828],[52.4252,13.3887],[52.4301,13.3872],[52.4297,13.3768],[52.4329,13.3776],[52.4331,13.3695],[52.4441,13.3626],[52.4472,13.3617],[52.4434,13.3757],[52.4411,13.3811],[52.4399,13.3818],[52.4406,13.3875]]]},{"n":null,"r":[[[52.453,13.4171],[52.4394,13.4118],[52.4412,13.3927],[52.4406,13.3875],[52.4517,13.3846],[52.4528,13.3846],[52.4533,13.3871],[52.453,13.4084],[52.4538,13.4088],[52.453,13.4171]]]},{"n":null,"r":[[[52.4699,13.3632],[52.4633,13.3589],[52.4568,13.3569],[52.4592,13.3539],[52.4591,13.3479],[52.4607,13.345],[52.4604,13.3277],[52.4636,13.3323],[52.4646,13.3358],[52.4659,13.335],[52.4675,13.337],[52.4706,13.3409],[52.4726,13.3457],[52.4739,13.3612],[52.4707,13.3605],[52.4699,13.3632]]]},{"n":null,"r":[[[52.4787,13.3441],[52.4769,13.3471],[52.4752,13.3479],[52.4675,13.337],[52.4722,13.3286],[52.4777,13.3281],[52.4787,13.3441]]]},{"n":null,"r":[[[52.4777,13.3281],[52.4717,13.3289],[52.4675,13.337],[52.4659,13.335],[52.4646,13.3358],[52.4634,13.334],[52.4673,13.3194],[52.4777,13.3203],[52.4777,13.3281]]]},{"n":null,"r":[[[52.4677,13.3073],[52.4672,13.3217],[52.4636,13.3323],[52.4596,13.3268],[52.4561,13.3246],[52.4601,13.3113],[52.4591,13.3038],[52.4649,13.3051],[52.4668,13.3091],[52.4677,13.3073]]]},{"n":null,"r":[[[52.4561,13.3246],[52.4508,13.3189],[52.452,13.3165],[52.4528,13.3172],[52.4537,13.3163],[52.4517,13.3112],[52.4543,13.3082],[52.4548,13.3089],[52.4562,13.308],[52.4585,13.3043],[52.4601,13.3113],[52.4561,13.3246]]]},{"n":null,"r":[[[52.4561,13.3246],[52.4518,13.3351],[52.4491,13.3543],[52.4451,13.3509],[52.4458,13.3465],[52.4446,13.3457],[52.4454,13.3374],[52.4453,13.3316],[52.444,13.3273],[52.4445,13.3244],[52.4452,13.3229],[52.4508,13.3189],[52.4561,13.3246]]]},{"n":null,"r":[[[52.4568,13.3569],[52.4536,13.3576],[52.4472,13.3617],[52.4491,13.3543],[52.4518,13.3351],[52.4561,13.3246],[52.4604,13.3277],[52.4598,13.3295],[52.4605,13.3303],[52.4607,13.345],[52.4591,13.3479],[52.4592,13.3539],[52.4568,13.3569]]]},{"n":null,"r":[[[52.4508,13.3189],[52.4452,13.3229],[52.444,13.3273],[52.4408,13.3227],[52.4371,13.3196],[52.4355,13.3132],[52.4365,13.3089],[52.4403,13.3025],[52.4399,13.3003],[52.4455,13.292],[52.4487,13.3012],[52.4511,13.299],[52.4517,13.2965],[52.4547,13.2995],[52.4501,13.3049],[52.4537,13.3163],[52.4528,13.3172],[52.452,13.3165],[52.4508,13.3189]]]},{"n":null,"r":[[[52.4419,13.2825],[52.4455,13.292],[52.4399,13.3003],[52.4403,13.3025],[52.4365,13.3089],[52.4355,13.3132],[52.4313,13.3097],[52.422,13.2986],[52.4196,13.2943],[52.4204,13.2933],[52.4193,13.2896],[52.4225,13.2874],[52.4235,13.2922],[52.4236,13.291],[52.4275,13.2885],[52.4281,13.2903],[52.4299,13.2891],[52.4328,13.287],[52.4333,13.2796],[52.4419,13.2825]]]},{"n":null,"r":[[[52.444,13.3273],[52.441,13.3285],[52.4397,13.327],[52.4314,13.3311],[52.4246,13.3208],[52.4184,13.3139],[52.4057,13.3276],[52.399,13.3125],[52.4145,13.2961],[52.4158,13.2972],[52.4196,13.2943],[52.4236,13.3007],[52.4313,13.3097],[52.4355,13.3132],[52.4371,13.3196],[52.4408,13.3227],[52.444,13.3273]]]},{"n":null,"r":[[[52.4314,13.3311],[52.4244,13.3347],[52.4251,13.3372],[52.4218,13.3403],[52.4199,13.341],[52.4196,13.3397],[52.4167,13.3423],[52.4158,13.342],[52.4151,13.3456],[52.414,13.3432],[52.4118,13.3438],[52.4057,13.3276],[52.4184,13.3139],[52.4246,13.3208],[52.4314,13.3311]]]},{"n":null,"r":[[[52.4472,13.3617],[52.4441,13.3626],[52.4356,13.3679],[52.4331,13.3531],[52.4361,13.3456],[52.4309,13.3362],[52.4297,13.3316],[52.4397,13.327],[52.441,13.3285],[52.444,13.3273],[52.4453,13.3316],[52.4446,13.3457],[52.4458,13.3465],[52.4451,13.3509],[52.4491,13.3543],[52.4472,13.3617]]]},{"n":null,"r":[[[52.4331,13.3695],[52.429,13.372],[52.4279,13.3683],[52.4215,13.3634],[52.4207,13.3614],[52.422,13.3599],[52.4217,13.3593],[52.4204,13.3606],[52.4151,13.3456],[52.4158,13.342],[52.4167,13.3423],[52.4196,13.3397],[52.4199,13.341],[52.4218,13.3403],[52.4251,13.3372],[52.4244,13.3347],[52.4297,13.3316],[52.4309,13.3362],[52.4361,13.3456],[52.4331,13.3531],[52.4356,13.3679],[52.4331,13.3695]]]},{"n":null,"r":[[[52.4331,13.3695],[52.4329,13.3776],[52.4297,13.3768],[52.4301,13.3872],[52.4252,13.3887],[52.4234,13.3828],[52.4176,13.397],[52.4149,13.3948],[52.4141,13.3925],[52.4128,13.393],[52.4057,13.3869],[52.4019,13.388],[52.3991,13.3904],[52.3983,13.3824],[52.3958,13.3822],[52.389,13.3713],[52.3937,13.3727],[52.3984,13.3601],[52.402,13.3532],[52.4133,13.3638],[52.4199,13.3593],[52.4204,13.3606],[52.4217,13.3593],[52.4207,13.3614],[52.4215,13.3634],[52.4279,13.3683],[52.429,13.372],[52.4331,13.3695]]]},{"n":null,"r":[[[52.4199,13.3593],[52.4133,13.3638],[52.402,13.3532],[52.4077,13.3436],[52.4122,13.3442],[52.4144,13.3436],[52.4199,13.3593]]]},{"n":null,"r":[[[52.4174,13.4003],[52.4132,13.4027],[52.4145,13.4093],[52.4115,13.4191],[52.3992,13.4109],[52.3972,13.4112],[52.3969,13.4069],[52.3926,13.4071],[52.3991,13.3904],[52.4019,13.388],[52.4057,13.3869],[52.4128,13.393],[52.4141,13.3925],[52.4149,13.3948],[52.4177,13.397],[52.4174,13.4003]]]},{"n":null,"r":[[[52.3926,13.4071],[52.39,13.4071],[52.3872,13.4109],[52.3761,13.4187],[52.3777,13.3892],[52.3885,13.388],[52.3883,13.3711],[52.3958,13.3822],[52.3983,13.3824],[52.3993,13.3882],[52.3989,13.3917],[52.3926,13.4071]]]},{"n":null,"r":[[[52.4115,13.4191],[52.4104,13.4202],[52.4098,13.4192],[52.4072,13.4189],[52.3864,13.4282],[52.376,13.4216],[52.3761,13.4187],[52.3872,13.4109],[52.39,13.4071],[52.3969,13.4069],[52.3972,13.4112],[52.3992,13.4109],[52.4115,13.4191]]]},{"n":null,"r":[[[52.4643,13.4447],[52.4531,13.4526],[52.4532,13.4391],[52.4447,13.4342],[52.4394,13.4118],[52.453,13.4171],[52.457,13.4216],[52.4574,13.4274],[52.4601,13.421],[52.4616,13.4241],[52.4643,13.4447]]]},{"n":null,"r":[[[52.4447,13.4342],[52.4407,13.4353],[52.4252,13.436],[52.4228,13.4381],[52.4149,13.4393],[52.4104,13.4202],[52.4119,13.4185],[52.4142,13.4113],[52.4132,13.4027],[52.4184,13.3997],[52.4207,13.4048],[52.422,13.4055],[52.4225,13.404],[52.4288,13.4074],[52.4306,13.407],[52.4394,13.4118],[52.4447,13.4342]]]},{"n":null,"r":[[[52.4407,13.4353],[52.4375,13.4445],[52.4372,13.452],[52.4446,13.4585],[52.4449,13.4621],[52.4383,13.4738],[52.4347,13.4698],[52.4301,13.4784],[52.4287,13.4747],[52.4263,13.4746],[52.4266,13.4715],[52.4324,13.4609],[52.4241,13.4373],[52.4252,13.436],[52.4407,13.4353]]]},{"n":null,"r":[[[52.4263,13.4746],[52.4263,13.484],[52.4246,13.4862],[52.4183,13.4786],[52.4198,13.4689],[52.4206,13.4685],[52.4217,13.464],[52.4201,13.4554],[52.4149,13.4393],[52.4241,13.4373],[52.4324,13.4609],[52.4266,13.4715],[52.4263,13.4746]]]},{"n":null,"r":[[[52.4246,13.4862],[52.4189,13.4927],[52.4164,13.4972],[52.4189,13.5014],[52.4198,13.5106],[52.4232,13.5196],[52.4196,13.5228],[52.4167,13.5238],[52.4156,13.5229],[52.4148,13.5248],[52.412,13.524],[52.4085,13.5225],[52.4029,13.5167],[52.3969,13.4806],[52.4041,13.4782],[52.4198,13.4689],[52.4183,13.4786],[52.4246,13.4862]]]},{"n":null,"r":[[[52.4383,13.4738],[52.442,13.4778],[52.4429,13.4802],[52.4293,13.5087],[52.4274,13.5212],[52.424,13.5191],[52.4232,13.5196],[52.4209,13.5141],[52.4189,13.5014],[52.4164,13.4972],[52.4167,13.4959],[52.4263,13.484],[52.4263,13.4746],[52.4287,13.4747],[52.4306,13.4782],[52.4347,13.4698],[52.4383,13.4738]]]},{"n":null,"r":[[[52.4615,13.4551],[52.4603,13.4501],[52.4593,13.4566],[52.4572,13.4595],[52.4507,13.4645],[52.4429,13.4802],[52.442,13.4778],[52.4383,13.4738],[52.4446,13.4629],[52.445,13.4592],[52.4372,13.452],[52.4375,13.4445],[52.4407,13.4353],[52.4453,13.434],[52.4532,13.4391],[52.4531,13.4526],[52.4643,13.4447],[52.4658,13.4534],[52.464,13.4528],[52.4615,13.4551]]]},{"n":null,"r":[[[52.4981,13.4539],[52.4965,13.4616],[52.4954,13.4638],[52.4946,13.4633],[52.4914,13.4746],[52.4902,13.4773],[52.4878,13.4792],[52.4885,13.4813],[52.4871,13.4842],[52.4886,13.4887],[52.4877,13.4912],[52.4856,13.4931],[52.4733,13.4709],[52.4748,13.4701],[52.4778,13.4711],[52.4866,13.4587],[52.4849,13.4564],[52.4896,13.4471],[52.4881,13.4446],[52.4903,13.4399],[52.4947,13.4451],[52.4951,13.4481],[52.4975,13.4513],[52.4981,13.4539]]]},{"n":null,"r":[[[52.4838,13.4942],[52.4781,13.4958],[52.4752,13.4948],[52.4733,13.4953],[52.4703,13.4991],[52.4654,13.4939],[52.4609,13.5021],[52.4589,13.4977],[52.4525,13.4926],[52.4429,13.4802],[52.4507,13.4645],[52.4572,13.4595],[52.4593,13.4566],[52.4603,13.4501],[52.4615,13.4551],[52.4598,13.4575],[52.4594,13.4754],[52.4658,13.4789],[52.4733,13.4709],[52.4856,13.4931],[52.4838,13.4942]]]},{"n":null,"r":[[[52.4703,13.4991],[52.4638,13.5037],[52.4587,13.5167],[52.4584,13.5198],[52.455,13.5225],[52.454,13.5255],[52.4537,13.532],[52.4562,13.5394],[52.4561,13.5451],[52.4535,13.5586],[52.4512,13.5588],[52.4526,13.5518],[52.4509,13.5512],[52.4492,13.549],[52.4503,13.5442],[52.4488,13.5415],[52.4471,13.5441],[52.4461,13.5418],[52.4471,13.5394],[52.4431,13.5304],[52.4439,13.5256],[52.4468,13.5201],[52.4519,13.5152],[52.4609,13.5021],[52.4654,13.4939],[52.4703,13.4991]]]},{"n":null,"r":[[[52.4831,13.5025],[52.477,13.5064],[52.475,13.5087],[52.4764,13.5156],[52.4752,13.5214],[52.4761,13.5215],[52.4687,13.5312],[52.4757,13.5393],[52.4613,13.5724],[52.4602,13.5723],[52.4576,13.5655],[52.4537,13.5655],[52.4538,13.555],[52.4561,13.5442],[52.4562,13.5394],[52.4536,13.5304],[52.455,13.5225],[52.4584,13.5198],[52.4587,13.5167],[52.4638,13.5037],[52.47,13.4996],[52.4722,13.4961],[52.4752,13.4948],[52.4781,13.4958],[52.4838,13.4942],[52.4831,13.5025]]]},{"n":null,"r":[[[52.4431,13.5304],[52.4361,13.5413],[52.4312,13.5329],[52.4293,13.5226],[52.4274,13.5212],[52.4293,13.5087],[52.4429,13.4802],[52.4525,13.4926],[52.4589,13.4977],[52.4609,13.5021],[52.4519,13.5152],[52.4468,13.5201],[52.4439,13.5256],[52.4431,13.5304]]]},{"n":null,"r":[[[52.4512,13.5588],[52.4416,13.5598],[52.4351,13.5637],[52.4275,13.5636],[52.4262,13.5556],[52.4259,13.5436],[52.4274,13.5212],[52.4293,13.5226],[52.4312,13.5329],[52.4361,13.5413],[52.4431,13.5304],[52.4471,13.5394],[52.4461,13.5418],[52.4471,13.5441],[52.4488,13.5415],[52.4503,13.5442],[52.4492,13.549],[52.4509,13.5512],[52.4526,13.5518],[52.4512,13.5588]]]},{"n":null,"r":[[[52.4262,13.5556],[52.416,13.569],[52.4103,13.5634],[52.4051,13.5554],[52.401,13.5469],[52.3994,13.5383],[52.4016,13.54],[52.3978,13.5309],[52.4009,13.5227],[52.4017,13.5181],[52.4029,13.5167],[52.4085,13.5225],[52.4148,13.5248],[52.4156,13.5229],[52.4167,13.5238],[52.4196,13.5228],[52.4237,13.5192],[52.4274,13.5212],[52.4259,13.5436],[52.4262,13.5556]]]},{"n":null,"r":[[[52.416,13.569],[52.4101,13.5762],[52.4039,13.5882],[52.4019,13.5863],[52.4003,13.5874],[52.4001,13.5904],[52.3973,13.5943],[52.3943,13.5937],[52.3879,13.5648],[52.3896,13.5363],[52.3929,13.5359],[52.3994,13.5383],[52.401,13.5469],[52.4035,13.5526],[52.409,13.5616],[52.416,13.569]]]},{"n":null,"r":[[[52.4275,13.5636],[52.4289,13.5762],[52.4279,13.5801],[52.4145,13.5875],[52.4129,13.5943],[52.4133,13.5981],[52.4119,13.6067],[52.4095,13.6133],[52.4099,13.6245],[52.3973,13.6402],[52.3957,13.6454],[52.3929,13.647],[52.3853,13.6474],[52.381,13.6544],[52.38,13.658],[52.3805,13.6656],[52.3833,13.6774],[52.3994,13.7017],[52.409,13.7099],[52.4136,13.7151],[52.4175,13.7258],[52.4164,13.7273],[52.419,13.7311],[52.4208,13.731],[52.4201,13.7322],[52.4172,13.7307],[52.4161,13.7312],[52.4081,13.7396],[52.4069,13.7365],[52.4048,13.7353],[52.4029,13.7354],[52.401,13.7326],[52.4011,13.7285],[52.399,13.7238],[52.4005,13.7169],[52.3964,13.7103],[52.3941,13.7036],[52.3915,13.7005],[52.3915,13.6998],[52.3927,13.7002],[52.3925,13.6995],[52.3906,13.6988],[52.3863,13.6918],[52.3869,13.6892],[52.3861,13.688],[52.3847,13.6874],[52.3837,13.6893],[52.384,13.6911],[52.3817,13.6965],[52.3823,13.7002],[52.3782,13.6986],[52.3782,13.7019],[52.3763,13.7014],[52.3698,13.6944],[52.3686,13.6947],[52.3684,13.6932],[52.3678,13.6936],[52.3685,13.6915],[52.368,13.6888],[52.3703,13.6837],[52.3701,13.6808],[52.3669,13.6725],[52.3623,13.668],[52.3586,13.668],[52.3579,13.6651],[52.3548,13.6638],[52.3521,13.6588],[52.3482,13.6578],[52.3431,13.6531],[52.3401,13.6537],[52.3387,13.6497],[52.3404,13.6447],[52.3452,13.6389],[52.3474,13.6383],[52.3487,13.6396],[52.3616,13.6408],[52.3637,13.6427],[52.3658,13.6478],[52.3676,13.6488],[52.3707,13.6483],[52.3714,13.6436],[52.3781,13.6441],[52.3769,13.6348],[52.3821,13.63],[52.3745,13.6074],[52.3768,13.6082],[52.3787,13.6069],[52.3799,13.6078],[52.3862,13.6007],[52.3867,13.5975],[52.388,13.5963],[52.3893,13.5966],[52.3907,13.595],[52.3932,13.5954],[52.3943,13.5937],[52.3973,13.5943],[52.4001,13.5904],[52.4003,13.5874],[52.4019,13.5863],[52.4039,13.5882],[52.4101,13.5762],[52.4262,13.5556],[52.4275,13.5636]]]},{"n":null,"r":[[[52.475,13.5678],[52.4778,13.5745],[52.4801,13.576],[52.4816,13.5803],[52.4807,13.5825],[52.4818,13.5869],[52.4734,13.6031],[52.4594,13.5985],[52.4579,13.5991],[52.4559,13.5931],[52.4553,13.5943],[52.45,13.5945],[52.4484,13.5937],[52.445,13.585],[52.4434,13.5829],[52.4455,13.5745],[52.4482,13.5763],[52.4576,13.5655],[52.4602,13.5723],[52.4613,13.5724],[52.4731,13.5456],[52.4737,13.5528],[52.4745,13.5521],[52.4739,13.5617],[52.475,13.5678]]]},{"n":null,"r":[[[52.4576,13.5655],[52.4482,13.5763],[52.4455,13.5745],[52.4447,13.5795],[52.4304,13.6154],[52.4268,13.6167],[52.4235,13.6116],[52.4218,13.6105],[52.4196,13.6152],[52.4105,13.6102],[52.4119,13.6067],[52.4133,13.5981],[52.4129,13.5943],[52.4145,13.5875],[52.4279,13.5801],[52.4289,13.5762],[52.4275,13.5636],[52.4351,13.5637],[52.4416,13.5598],[52.4535,13.5586],[52.4537,13.5655],[52.4576,13.5655]]]},{"n":null,"r":[[[52.45,13.5945],[52.4499,13.602],[52.4441,13.6185],[52.4447,13.6245],[52.4343,13.6852],[52.4302,13.6878],[52.4308,13.6944],[52.43,13.6988],[52.4272,13.7046],[52.4265,13.7156],[52.4217,13.7219],[52.4193,13.7223],[52.4175,13.7258],[52.4136,13.7151],[52.409,13.7099],[52.3994,13.7017],[52.3833,13.6774],[52.3805,13.6656],[52.38,13.658],[52.381,13.6544],[52.3853,13.6474],[52.3929,13.647],[52.3957,13.6454],[52.3973,13.6402],[52.4099,13.6245],[52.4091,13.6195],[52.4105,13.6102],[52.4196,13.6152],[52.4218,13.6105],[52.4235,13.6116],[52.4268,13.6167],[52.4304,13.6154],[52.4434,13.5829],[52.445,13.585],[52.4484,13.5937],[52.45,13.5945]]]},{"n":null,"r":[[[52.4728,13.6726],[52.4383,13.6614],[52.4447,13.6245],[52.4441,13.6185],[52.4499,13.602],[52.45,13.5945],[52.4553,13.5943],[52.4559,13.5931],[52.4579,13.5991],[52.4594,13.5985],[52.4734,13.6031],[52.4735,13.6085],[52.472,13.6086],[52.4707,13.6153],[52.4722,13.6173],[52.4714,13.6214],[52.4694,13.6214],[52.469,13.6223],[52.4675,13.6218],[52.4673,13.623],[52.4676,13.6237],[52.4697,13.6232],[52.4697,13.6254],[52.4746,13.6255],[52.4745,13.6284],[52.4801,13.6433],[52.4797,13.6483],[52.4747,13.6627],[52.4752,13.6672],[52.4728,13.6726]]]},{"n":null,"r":[[[52.4728,13.6726],[52.4702,13.6788],[52.467,13.6829],[52.4649,13.6959],[52.4614,13.6978],[52.4562,13.6986],[52.4557,13.705],[52.4586,13.7059],[52.4608,13.7055],[52.461,13.7036],[52.4653,13.7023],[52.4693,13.6992],[52.4692,13.7015],[52.4643,13.7116],[52.4639,13.7161],[52.4577,13.7209],[52.4517,13.7294],[52.4497,13.7498],[52.4472,13.7571],[52.4443,13.755],[52.4439,13.7578],[52.4394,13.756],[52.4387,13.7619],[52.4372,13.7607],[52.4377,13.7551],[52.4426,13.757],[52.4424,13.7512],[52.4391,13.7448],[52.4339,13.7436],[52.434,13.741],[52.4297,13.7396],[52.4291,13.7425],[52.4277,13.742],[52.4276,13.7384],[52.4214,13.7319],[52.4208,13.7322],[52.4208,13.731],[52.419,13.7311],[52.4164,13.7273],[52.4193,13.7223],[52.4217,13.7219],[52.4265,13.7156],[52.4272,13.7046],[52.43,13.6988],[52.4308,13.6944],[52.4302,13.6878],[52.4343,13.6852],[52.4383,13.6614],[52.4728,13.6726]]]},{"n":null,"r":[[[52.5334,13.5882],[52.5333,13.5926],[52.5361,13.6016],[52.5356,13.6042],[52.5343,13.6053],[52.5337,13.6026],[52.5288,13.6043],[52.5294,13.5985],[52.5185,13.595],[52.5174,13.5887],[52.5126,13.5796],[52.5129,13.5743],[52.5226,13.5789],[52.5253,13.5787],[52.5307,13.5877],[52.5319,13.5886],[52.5334,13.5882]]]},{"n":null,"r":[[[52.5288,13.6043],[52.5277,13.6133],[52.5289,13.6152],[52.528,13.619],[52.5286,13.6222],[52.5278,13.6244],[52.5208,13.6135],[52.5177,13.6112],[52.5116,13.6039],[52.5051,13.5989],[52.4992,13.5958],[52.4971,13.5969],[52.4907,13.5935],[52.4877,13.5894],[52.488,13.5882],[52.4857,13.5872],[52.4845,13.5846],[52.4825,13.5873],[52.4818,13.5869],[52.4807,13.5825],[52.4816,13.5803],[52.4801,13.576],[52.4778,13.5745],[52.475,13.5678],[52.4765,13.5683],[52.4803,13.5634],[52.4836,13.5621],[52.4869,13.5655],[52.4908,13.5673],[52.4923,13.5694],[52.4938,13.5697],[52.4967,13.5684],[52.4987,13.5692],[52.5006,13.5727],[52.5017,13.5785],[52.503,13.5783],[52.5057,13.5802],[52.5109,13.5742],[52.5129,13.5743],[52.5126,13.5796],[52.5174,13.5887],[52.5185,13.595],[52.5294,13.5985],[52.5288,13.6043]]]},{"n":null,"r":[[[52.5278,13.6244],[52.5305,13.6272],[52.5309,13.6313],[52.5302,13.6577],[52.5263,13.6593],[52.5191,13.6432],[52.5135,13.635],[52.5073,13.6302],[52.495,13.6248],[52.4939,13.6307],[52.4816,13.6156],[52.4766,13.6144],[52.4758,13.6174],[52.4717,13.6123],[52.472,13.6086],[52.4735,13.6085],[52.4734,13.6031],[52.4818,13.5869],[52.4825,13.5873],[52.4845,13.5846],[52.4857,13.5872],[52.488,13.5882],[52.4877,13.5894],[52.4907,13.5935],[52.4971,13.5969],[52.4992,13.5958],[52.5051,13.5989],[52.5116,13.6039],[52.5177,13.6112],[52.5208,13.6135],[52.5278,13.6244]]]},{"n":null,"r":[[[52.5476,13.5993],[52.5442,13.6204],[52.543,13.6347],[52.5424,13.6381],[52.5413,13.6385],[52.5358,13.633],[52.538,13.6292],[52.5383,13.6252],[52.5346,13.6261],[52.5341,13.6251],[52.5304,13.6261],[52.5305,13.6272],[52.5278,13.6244],[52.5286,13.6222],[52.528,13.619],[52.5289,13.6152],[52.5277,13.6133],[52.5288,13.6043],[52.5337,13.6026],[52.5343,13.6053],[52.5356,13.6042],[52.5361,13.6016],[52.5333,13.5926],[52.534,13.5917],[52.5373,13.5919],[52.5368,13.5968],[52.5393,13.6008],[52.5476,13.5993]]]},{"n":null,"r":[[[52.5501,13.5863],[52.5476,13.5993],[52.5393,13.6008],[52.5368,13.5968],[52.5373,13.5919],[52.534,13.5917],[52.5333,13.5926],[52.5334,13.5882],[52.5352,13.5881],[52.5391,13.5851],[52.5401,13.5821],[52.5418,13.5809],[52.5434,13.5811],[52.545,13.5836],[52.5501,13.5863]]]},{"n":null,"r":[[[52.5568,13.5828],[52.5539,13.5873],[52.5501,13.5863],[52.5449,13.5648],[52.545,13.5566],[52.5396,13.5389],[52.5515,13.5482],[52.5481,13.5588],[52.5521,13.5648],[52.5544,13.5657],[52.5537,13.5698],[52.5568,13.5828]]]},{"n":null,"r":[[[52.5673,13.545],[52.5631,13.5583],[52.5351,13.5354],[52.5342,13.5515],[52.527,13.5486],[52.5166,13.5473],[52.5167,13.5461],[52.5112,13.5447],[52.5102,13.5427],[52.5104,13.5387],[52.5122,13.538],[52.5139,13.5357],[52.5147,13.5194],[52.5217,13.5202],[52.5333,13.5196],[52.5355,13.518],[52.5363,13.5235],[52.5395,13.5328],[52.5515,13.5287],[52.5561,13.5258],[52.5602,13.5333],[52.5664,13.5413],[52.5673,13.545]]]},{"n":null,"r":[[[52.5342,13.5515],[52.5352,13.5674],[52.5334,13.5807],[52.5334,13.5882],[52.5319,13.5886],[52.5307,13.5877],[52.5253,13.5787],[52.5226,13.5789],[52.5129,13.5743],[52.5109,13.5742],[52.5057,13.5802],[52.503,13.5783],[52.5017,13.5785],[52.5006,13.5727],[52.4987,13.5692],[52.4967,13.5684],[52.4938,13.5697],[52.4923,13.5694],[52.4908,13.5673],[52.4869,13.5655],[52.4836,13.5621],[52.4803,13.5634],[52.4765,13.5683],[52.4744,13.5675],[52.4745,13.5521],[52.4774,13.5513],[52.4801,13.5492],[52.4835,13.5487],[52.4865,13.55],[52.4944,13.545],[52.4993,13.5434],[52.5004,13.5411],[52.506,13.5364],[52.5104,13.5366],[52.5102,13.5427],[52.5112,13.5447],[52.5167,13.5461],[52.5166,13.5473],[52.527,13.5486],[52.5342,13.5515]]]},{"n":null,"r":[[[52.5501,13.5863],[52.545,13.5836],[52.5434,13.5811],[52.5418,13.5809],[52.5401,13.5821],[52.5391,13.5851],[52.5352,13.5881],[52.5334,13.5882],[52.5334,13.5807],[52.5352,13.5674],[52.5342,13.5515],[52.5351,13.5354],[52.5396,13.5389],[52.5444,13.5542],[52.5449,13.5648],[52.5501,13.5863]]]},{"n":null,"r":[[[52.5631,13.5583],[52.5613,13.5642],[52.5599,13.5778],[52.5568,13.5828],[52.5537,13.5698],[52.5544,13.5657],[52.5521,13.5648],[52.5481,13.5588],[52.5515,13.5482],[52.5631,13.5583]]]},{"n":null,"r":[[[52.5673,13.545],[52.5684,13.5465],[52.573,13.5666],[52.5747,13.5679],[52.5731,13.569],[52.5743,13.575],[52.5737,13.5768],[52.5714,13.578],[52.5707,13.5816],[52.5695,13.5828],[52.5604,13.5842],[52.5566,13.5872],[52.554,13.5875],[52.5599,13.5778],[52.5613,13.5642],[52.5673,13.545]]]},{"n":null,"r":[[[52.5972,13.5054],[52.5927,13.5083],[52.5808,13.5063],[52.5763,13.503],[52.573,13.5027],[52.5724,13.505],[52.5671,13.5122],[52.5592,13.4924],[52.5611,13.4896],[52.562,13.4854],[52.5649,13.4854],[52.5652,13.4839],[52.5664,13.4838],[52.5678,13.4883],[52.5728,13.4824],[52.5776,13.4788],[52.5858,13.4786],[52.5878,13.485],[52.5903,13.488],[52.5972,13.5054]]]},{"n":null,"r":[[[52.5671,13.5122],[52.5561,13.5258],[52.5515,13.5287],[52.5395,13.5328],[52.5363,13.5235],[52.5355,13.518],[52.549,13.5085],[52.5494,13.502],[52.5404,13.4848],[52.5367,13.4734],[52.5409,13.4701],[52.5486,13.4673],[52.5479,13.479],[52.5487,13.4802],[52.55,13.4803],[52.5497,13.4813],[52.5527,13.4858],[52.5512,13.4943],[52.5552,13.4957],[52.5592,13.4924],[52.5671,13.5122]]]},{"n":null,"r":[[[52.5355,13.518],[52.5334,13.4764],[52.5367,13.4734],[52.5404,13.4848],[52.5494,13.502],[52.549,13.5085],[52.5355,13.518]]]},{"n":null,"r":[[[52.5888,13.545],[52.5815,13.5607],[52.5747,13.5679],[52.573,13.5666],[52.5684,13.5465],[52.5664,13.5413],[52.5602,13.5333],[52.5561,13.5258],[52.5671,13.5122],[52.5693,13.5203],[52.5712,13.5336],[52.5888,13.545]]]},{"n":null,"r":[[[52.5927,13.5083],[52.5932,13.5228],[52.5888,13.545],[52.5712,13.5336],[52.5693,13.5203],[52.5671,13.5122],[52.5724,13.505],[52.573,13.5027],[52.5763,13.503],[52.5808,13.5063],[52.5927,13.5083]]]},{"n":null,"r":[[[52.5564,13.4285],[52.565,13.4484],[52.5577,13.4662],[52.5543,13.4671],[52.5518,13.4641],[52.5489,13.4507],[52.5459,13.4445],[52.5514,13.4299],[52.5564,13.4285]]]},{"n":null,"r":[[[52.5762,13.4572],[52.5786,13.4575],[52.5816,13.4605],[52.5776,13.4707],[52.577,13.4792],[52.5728,13.4824],[52.5678,13.4883],[52.5664,13.4838],[52.5652,13.4839],[52.5649,13.4854],[52.562,13.4854],[52.5611,13.4896],[52.5567,13.4946],[52.5552,13.4957],[52.5512,13.4943],[52.5527,13.4858],[52.5497,13.4813],[52.55,13.4803],[52.5487,13.4802],[52.5479,13.479],[52.5486,13.4673],[52.5409,13.4701],[52.5378,13.4665],[52.5459,13.4445],[52.5489,13.4507],[52.5518,13.4641],[52.5543,13.4671],[52.5577,13.4662],[52.565,13.4484],[52.5674,13.4559],[52.5762,13.4572]]]},{"n":null,"r":[[[52.5831,13.4309],[52.5832,13.4391],[52.5762,13.4572],[52.5674,13.4559],[52.5564,13.4285],[52.5577,13.4289],[52.5654,13.4269],[52.575,13.429],[52.5794,13.4322],[52.5831,13.4309]]]},{"n":null,"r":[[[52.6495,13.4524],[52.6487,13.4597],[52.6521,13.4674],[52.6521,13.4703],[52.655,13.4736],[52.6567,13.4721],[52.6578,13.462],[52.6629,13.4504],[52.6692,13.4593],[52.6673,13.4657],[52.6751,13.4754],[52.6739,13.4771],[52.6755,13.4795],[52.6748,13.4801],[52.6686,13.4746],[52.6665,13.4756],[52.6706,13.4885],[52.6596,13.4853],[52.6546,13.4916],[52.6482,13.5085],[52.6467,13.5075],[52.6463,13.508],[52.6475,13.51],[52.6458,13.513],[52.6474,13.5195],[52.6454,13.5205],[52.6456,13.5231],[52.6413,13.5225],[52.63,13.5175],[52.6262,13.5056],[52.6204,13.5058],[52.6193,13.5033],[52.6123,13.4992],[52.6056,13.4967],[52.6057,13.499],[52.5972,13.5054],[52.5903,13.488],[52.5878,13.485],[52.617,13.4466],[52.6171,13.451],[52.6204,13.4548],[52.6311,13.4551],[52.6495,13.4524]]]},{"n":null,"r":[[[52.617,13.4466],[52.6154,13.4437],[52.6128,13.4472],[52.6076,13.4488],[52.6054,13.4487],[52.5987,13.4455],[52.5946,13.4431],[52.5831,13.4309],[52.5834,13.4283],[52.5916,13.4214],[52.6009,13.4158],[52.6122,13.4121],[52.6153,13.412],[52.6189,13.4173],[52.6244,13.4123],[52.6283,13.4189],[52.6325,13.4346],[52.6401,13.4396],[52.6495,13.4524],[52.6311,13.4551],[52.6204,13.4548],[52.6171,13.451],[52.617,13.4466]]]},{"n":null,"r":[[[52.5878,13.485],[52.5858,13.4786],[52.577,13.4792],[52.5776,13.4707],[52.5816,13.4605],[52.5786,13.4575],[52.5762,13.4572],[52.5832,13.4391],[52.5831,13.4309],[52.5946,13.4431],[52.6054,13.4487],[52.6109,13.4483],[52.6154,13.4437],[52.617,13.4466],[52.5878,13.485]]]},{"n":null,"r":[[[52.5831,13.4309],[52.5786,13.4144],[52.5741,13.4074],[52.5711,13.398],[52.5704,13.3915],[52.5685,13.3884],[52.5692,13.3873],[52.5696,13.3879],[52.5725,13.3826],[52.5734,13.3829],[52.5793,13.3794],[52.5801,13.3727],[52.5821,13.3692],[52.5836,13.3688],[52.5897,13.3873],[52.5961,13.4189],[52.5916,13.4214],[52.5834,13.4283],[52.5831,13.4309]]]},{"n":null,"r":[[[52.6064,13.3751],[52.6027,13.3919],[52.6017,13.4134],[52.6009,13.4158],[52.5961,13.4189],[52.5897,13.3873],[52.5836,13.3688],[52.5821,13.3692],[52.5801,13.3727],[52.5793,13.3794],[52.5734,13.3829],[52.572,13.3817],[52.5726,13.3791],[52.5897,13.3491],[52.5903,13.3465],[52.5914,13.3596],[52.5991,13.3695],[52.6064,13.3751]]]},{"n":null,"r":[[[52.6495,13.4524],[52.6401,13.4396],[52.6325,13.4346],[52.6283,13.4189],[52.6244,13.4123],[52.6189,13.4173],[52.6153,13.412],[52.6122,13.4121],[52.6009,13.4158],[52.6027,13.4022],[52.6027,13.3919],[52.6064,13.3751],[52.6097,13.3764],[52.6143,13.3756],[52.6264,13.3674],[52.626,13.3689],[52.6278,13.371],[52.6288,13.3763],[52.6296,13.3758],[52.6303,13.377],[52.6321,13.3758],[52.6349,13.3785],[52.6358,13.3825],[52.6369,13.3814],[52.6368,13.3847],[52.6383,13.3888],[52.6406,13.3901],[52.642,13.3892],[52.642,13.39],[52.6441,13.3908],[52.6439,13.3919],[52.6448,13.3912],[52.6481,13.3939],[52.649,13.3974],[52.6436,13.4072],[52.6444,13.4115],[52.6433,13.4139],[52.6422,13.4134],[52.6404,13.4156],[52.6361,13.4239],[52.6377,13.4277],[52.6383,13.434],[52.6426,13.4324],[52.6452,13.4334],[52.6462,13.4394],[52.65,13.4408],[52.6508,13.4479],[52.6505,13.4525],[52.6495,13.4524]]]},{"n":null,"r":[[[52.5831,13.4309],[52.5814,13.429],[52.5777,13.4292],[52.5726,13.4219],[52.5647,13.4072],[52.5581,13.4139],[52.5587,13.3969],[52.5636,13.3943],[52.5676,13.3879],[52.5704,13.3915],[52.5711,13.398],[52.5745,13.4082],[52.5778,13.412],[52.5831,13.4309]]]},{"n":null,"r":[[[52.5831,13.4309],[52.5794,13.4322],[52.575,13.429],[52.5654,13.4269],[52.5514,13.4299],[52.5526,13.4272],[52.554,13.414],[52.5581,13.4139],[52.5647,13.4072],[52.5726,13.4219],[52.5777,13.4292],[52.5814,13.429],[52.5831,13.4309]]]},{"n":null,"r":[[[52.5576,13.365],[52.5568,13.3731],[52.5542,13.372],[52.5517,13.3671],[52.5484,13.3691],[52.5448,13.3692],[52.5419,13.3781],[52.54,13.3758],[52.5383,13.376],[52.5372,13.3741],[52.5505,13.3516],[52.5576,13.365]]]},{"n":null,"r":[[[52.5618,13.3317],[52.5648,13.3366],[52.5623,13.3486],[52.5623,13.3534],[52.5586,13.3559],[52.5593,13.3624],[52.558,13.363],[52.5576,13.365],[52.5505,13.3516],[52.5618,13.3317]]]},{"n":null,"r":[[[52.5505,13.3516],[52.5391,13.3293],[52.5506,13.3159],[52.5517,13.3164],[52.55,13.3226],[52.5624,13.3265],[52.5626,13.3295],[52.5612,13.3305],[52.5618,13.3317],[52.5505,13.3516]]]},{"n":null,"r":[[[52.5505,13.3516],[52.5382,13.3724],[52.5362,13.3681],[52.5362,13.3658],[52.5376,13.3628],[52.5379,13.3566],[52.534,13.328],[52.5376,13.3286],[52.5384,13.3304],[52.5391,13.3293],[52.5505,13.3516]]]},{"n":null,"r":[[[52.551,13.3987],[52.5402,13.4034],[52.5376,13.393],[52.5333,13.3869],[52.5401,13.3791],[52.5386,13.3758],[52.54,13.3758],[52.5425,13.3791],[52.5446,13.3793],[52.548,13.3835],[52.551,13.3987]]]},{"n":null,"r":[[[52.5568,13.3731],[52.555,13.3973],[52.5529,13.3979],[52.5504,13.3967],[52.548,13.3835],[52.5446,13.3793],[52.5425,13.3791],[52.5419,13.3781],[52.5448,13.3692],[52.5484,13.3691],[52.5517,13.3671],[52.5542,13.372],[52.5568,13.3731]]]},{"n":null,"r":[[[52.5588,13.3968],[52.555,13.3973],[52.5575,13.3659],[52.5583,13.3665],[52.5584,13.3699],[52.5601,13.3698],[52.5608,13.3714],[52.5609,13.377],[52.5662,13.3782],[52.5677,13.3846],[52.5674,13.3888],[52.5643,13.3935],[52.5619,13.3958],[52.5588,13.3968]]]},{"n":null,"r":[[[52.5882,13.3182],[52.5878,13.3291],[52.5862,13.33],[52.5855,13.3266],[52.5805,13.3209],[52.5784,13.3214],[52.5787,13.3324],[52.5757,13.3317],[52.5754,13.3413],[52.5738,13.3386],[52.5721,13.3385],[52.5715,13.3374],[52.5667,13.3383],[52.5658,13.3349],[52.5648,13.3366],[52.5618,13.3317],[52.5648,13.3271],[52.5685,13.311],[52.5686,13.3048],[52.5702,13.3],[52.5781,13.3079],[52.5767,13.3087],[52.5753,13.312],[52.577,13.3137],[52.5768,13.3145],[52.5782,13.3148],[52.5818,13.3124],[52.5882,13.3182]]]},{"n":null,"r":[[[52.5618,13.3317],[52.5612,13.3305],[52.5626,13.3295],[52.5624,13.3265],[52.55,13.3226],[52.5517,13.3164],[52.5506,13.3159],[52.5486,13.3174],[52.549,13.3012],[52.5515,13.3023],[52.5511,13.2851],[52.553,13.2831],[52.553,13.2755],[52.5549,13.2724],[52.5538,13.2577],[52.5561,13.2563],[52.5571,13.2564],[52.5593,13.2601],[52.5632,13.273],[52.5659,13.2915],[52.5669,13.2924],[52.5674,13.2912],[52.5687,13.292],[52.5702,13.3],[52.5686,13.3048],[52.5685,13.311],[52.5648,13.3271],[52.5618,13.3317]]]},{"n":null,"r":[[[52.5787,13.3324],[52.5788,13.3372],[52.5811,13.3448],[52.5864,13.341],[52.5873,13.3426],[52.5857,13.3553],[52.5763,13.3734],[52.5771,13.3602],[52.5745,13.359],[52.5734,13.3588],[52.5654,13.3633],[52.5576,13.365],[52.558,13.363],[52.5593,13.3624],[52.5586,13.3559],[52.5623,13.3534],[52.5623,13.3486],[52.5653,13.3353],[52.5658,13.3349],[52.5667,13.3383],[52.5715,13.3374],[52.5721,13.3385],[52.5738,13.3386],[52.5754,13.3413],[52.5757,13.3317],[52.5787,13.3324]]]},{"n":null,"r":[[[52.5725,13.3826],[52.5696,13.3879],[52.5692,13.3873],[52.5682,13.3886],[52.5662,13.3782],[52.5609,13.377],[52.5608,13.3714],[52.5601,13.3698],[52.5584,13.3699],[52.5583,13.3665],[52.5575,13.3659],[52.5576,13.365],[52.5593,13.3642],[52.5654,13.3633],[52.5734,13.3588],[52.5771,13.3602],[52.5763,13.3734],[52.5726,13.3791],[52.5725,13.3826]]]},{"n":null,"r":[[[52.6062,13.3251],[52.6067,13.3346],[52.6102,13.339],[52.6062,13.3438],[52.6077,13.3498],[52.6072,13.363],[52.6034,13.3616],[52.6004,13.3547],[52.5996,13.3499],[52.5965,13.3469],[52.5957,13.3376],[52.5957,13.3321],[52.6006,13.331],[52.6062,13.3251]]]},{"n":null,"r":[[[52.5972,13.3068],[52.5972,13.3135],[52.5997,13.3273],[52.6002,13.3282],[52.6059,13.3215],[52.6062,13.3251],[52.6006,13.331],[52.5957,13.3321],[52.5957,13.3376],[52.5857,13.3553],[52.5873,13.3426],[52.5864,13.341],[52.5811,13.3448],[52.5788,13.3372],[52.5784,13.3214],[52.5805,13.3209],[52.5855,13.3266],[52.5862,13.33],[52.5878,13.3291],[52.5882,13.3172],[52.5945,13.301],[52.5955,13.3052],[52.5965,13.3052],[52.5972,13.3068]]]},{"n":null,"r":[[[52.6072,13.363],[52.6064,13.3751],[52.5991,13.3695],[52.5914,13.3596],[52.5903,13.3465],[52.5957,13.3376],[52.5965,13.3469],[52.5996,13.3499],[52.6004,13.3547],[52.6034,13.3616],[52.6072,13.363]]]},{"n":null,"r":[[[52.6287,13.3107],[52.628,13.3106],[52.626,13.2891],[52.6264,13.2844],[52.625,13.277],[52.6264,13.2666],[52.6273,13.2637],[52.6348,13.2645],[52.6392,13.2616],[52.6409,13.2616],[52.64,13.2689],[52.6415,13.2833],[52.6531,13.2846],[52.6532,13.2814],[52.6613,13.2822],[52.66,13.2938],[52.6602,13.3065],[52.6581,13.3095],[52.6541,13.2998],[52.6442,13.3077],[52.6445,13.3086],[52.642,13.3085],[52.6402,13.3056],[52.6381,13.3064],[52.6379,13.3052],[52.6328,13.3093],[52.6306,13.3098],[52.6278,13.302],[52.6287,13.3107]]]},{"n":null,"r":[[[52.6287,13.3107],[52.6258,13.3283],[52.6229,13.3362],[52.6224,13.3337],[52.6205,13.3324],[52.6194,13.3293],[52.6166,13.33],[52.615,13.329],[52.6124,13.3158],[52.61,13.3112],[52.6083,13.3098],[52.608,13.3066],[52.6048,13.3026],[52.6063,13.3019],[52.6067,13.3001],[52.6052,13.2945],[52.6046,13.2936],[52.6039,13.2941],[52.6033,13.291],[52.6024,13.292],[52.6019,13.2891],[52.601,13.2886],[52.6038,13.2879],[52.6047,13.29],[52.6101,13.2817],[52.6165,13.2932],[52.6228,13.2859],[52.6242,13.2887],[52.6266,13.2883],[52.626,13.2891],[52.6271,13.3019],[52.628,13.3106],[52.6287,13.3107]]]},{"n":null,"r":[[[52.6264,13.3674],[52.6143,13.3756],[52.6097,13.3764],[52.6064,13.3751],[52.6077,13.3498],[52.6062,13.3438],[52.6102,13.339],[52.6067,13.3346],[52.6059,13.3215],[52.6002,13.3282],[52.5997,13.3273],[52.5969,13.3096],[52.5972,13.3068],[52.5993,13.3056],[52.5989,13.3044],[52.6067,13.3001],[52.6063,13.3019],[52.6048,13.3026],[52.608,13.3066],[52.6083,13.3098],[52.61,13.3112],[52.6124,13.3158],[52.615,13.329],[52.6166,13.33],[52.6194,13.3293],[52.6205,13.3324],[52.6224,13.3337],[52.6242,13.3434],[52.6245,13.3509],[52.6233,13.3513],[52.6243,13.3546],[52.6237,13.3576],[52.6261,13.3638],[52.6264,13.3674]]]},{"n":null,"r":[[[52.6266,13.2883],[52.6242,13.2887],[52.6228,13.2859],[52.6165,13.2932],[52.6101,13.2817],[52.6047,13.29],[52.6043,13.2884],[52.6019,13.2864],[52.6015,13.2827],[52.5994,13.2812],[52.5969,13.2766],[52.5961,13.2771],[52.6002,13.2515],[52.5983,13.2474],[52.5983,13.2414],[52.597,13.2387],[52.5991,13.219],[52.5977,13.2103],[52.606,13.201],[52.6075,13.201],[52.6093,13.2058],[52.6197,13.2142],[52.6206,13.2162],[52.6251,13.2193],[52.6291,13.2201],[52.628,13.2299],[52.6287,13.2421],[52.6273,13.2512],[52.628,13.2596],[52.6264,13.2666],[52.6261,13.2728],[52.6251,13.2749],[52.6266,13.2883]]]},{"n":null,"r":[[[52.5961,13.2771],[52.5949,13.2763],[52.5947,13.2668],[52.5935,13.2641],[52.5911,13.263],[52.5872,13.2682],[52.5839,13.2681],[52.5836,13.2649],[52.5812,13.261],[52.5723,13.2559],[52.5693,13.2511],[52.5662,13.2489],[52.567,13.2445],[52.567,13.2277],[52.5697,13.2269],[52.5711,13.2245],[52.5736,13.2244],[52.5769,13.2189],[52.5803,13.2181],[52.5843,13.2154],[52.5916,13.2183],[52.5928,13.2178],[52.5977,13.2103],[52.5991,13.219],[52.597,13.2387],[52.5983,13.2414],[52.5983,13.2474],[52.6002,13.2515],[52.5961,13.2771]]]},{"n":null,"r":[[[52.5999,13.2815],[52.5862,13.2914],[52.5831,13.2891],[52.5768,13.2942],[52.5756,13.2994],[52.5759,13.3056],[52.5702,13.3],[52.5683,13.2914],[52.5674,13.2912],[52.5669,13.2924],[52.5659,13.2915],[52.5632,13.273],[52.5583,13.2581],[52.5571,13.2564],[52.5538,13.2577],[52.554,13.2625],[52.5509,13.2581],[52.5534,13.2492],[52.5646,13.2555],[52.5662,13.2489],[52.5693,13.2511],[52.5723,13.2559],[52.5812,13.261],[52.5836,13.2649],[52.5839,13.2681],[52.5872,13.2682],[52.5911,13.263],[52.5935,13.2641],[52.5947,13.2668],[52.5949,13.2763],[52.5961,13.2771],[52.5969,13.2766],[52.5999,13.2815]]]},{"n":null,"r":[[[52.6063,13.3002],[52.5989,13.3044],[52.5993,13.3056],[52.5972,13.3068],[52.5965,13.3052],[52.5955,13.3052],[52.5945,13.301],[52.5913,13.3077],[52.5882,13.3182],[52.5825,13.3127],[52.5818,13.3124],[52.5782,13.3148],[52.5768,13.3145],[52.577,13.3137],[52.5753,13.312],[52.5767,13.3087],[52.5781,13.3079],[52.5759,13.3056],[52.5756,13.2994],[52.5768,13.2942],[52.5831,13.2891],[52.5862,13.2914],[52.5999,13.2815],[52.6015,13.2827],[52.6019,13.2864],[52.6028,13.2877],[52.601,13.2886],[52.6019,13.2891],[52.6024,13.292],[52.6033,13.291],[52.6039,13.2941],[52.6046,13.2936],[52.6052,13.2945],[52.6063,13.3002]]]},{"n":null,"r":[[[52.5394,13.1707],[52.5334,13.2025],[52.5298,13.2013],[52.5247,13.2043],[52.525,13.1999],[52.5282,13.195],[52.5238,13.1917],[52.521,13.1872],[52.5238,13.1703],[52.5265,13.1659],[52.5297,13.1659],[52.5311,13.1638],[52.5306,13.1591],[52.5372,13.1559],[52.5398,13.1663],[52.5394,13.1707]]]},{"n":null,"r":[[[52.5441,13.1683],[52.5507,13.1697],[52.5478,13.1845],[52.5518,13.1853],[52.5502,13.1905],[52.5465,13.1912],[52.5382,13.1966],[52.5351,13.1957],[52.5394,13.1707],[52.5408,13.1682],[52.5441,13.1683]]]},{"n":null,"r":[[[52.5556,13.1986],[52.5558,13.207],[52.5541,13.2072],[52.554,13.2117],[52.5529,13.2144],[52.5528,13.2228],[52.5465,13.2219],[52.5441,13.2191],[52.5439,13.2119],[52.5426,13.2113],[52.543,13.2094],[52.5417,13.2084],[52.5402,13.2001],[52.5382,13.1966],[52.5465,13.1912],[52.5512,13.1906],[52.5554,13.1957],[52.5556,13.1986]]]},{"n":null,"r":[[[52.5871,13.2162],[52.5843,13.2154],[52.5803,13.2181],[52.5779,13.2183],[52.5736,13.2244],[52.5711,13.2245],[52.5697,13.2269],[52.5682,13.2269],[52.5661,13.2285],[52.5634,13.2278],[52.5626,13.2288],[52.5597,13.2237],[52.5584,13.2231],[52.5528,13.2228],[52.5529,13.2144],[52.554,13.2117],[52.5541,13.2072],[52.5558,13.207],[52.5556,13.1986],[52.5632,13.1962],[52.5708,13.1525],[52.5737,13.1539],[52.5778,13.1541],[52.5821,13.1519],[52.5834,13.1502],[52.5806,13.1397],[52.5799,13.1331],[52.5832,13.131],[52.5836,13.1285],[52.5861,13.1302],[52.5862,13.129],[52.5873,13.1304],[52.5875,13.1364],[52.5888,13.1388],[52.5896,13.1441],[52.5916,13.1498],[52.5972,13.1577],[52.5983,13.1651],[52.5948,13.1743],[52.5932,13.184],[52.5897,13.1921],[52.5883,13.2006],[52.5864,13.2056],[52.5862,13.2069],[52.5879,13.2076],[52.5871,13.2162]]]},{"n":null,"r":[[[52.5556,13.1986],[52.5554,13.1957],[52.5524,13.1917],[52.5502,13.1905],[52.5518,13.1853],[52.5478,13.1845],[52.5507,13.1697],[52.5441,13.1683],[52.544,13.1649],[52.5464,13.1587],[52.5481,13.1465],[52.5525,13.1444],[52.5553,13.1473],[52.561,13.146],[52.5619,13.1474],[52.5647,13.1477],[52.5708,13.1525],[52.5632,13.1962],[52.5556,13.1986]]]},{"n":null,"r":[[[52.5441,13.1683],[52.5408,13.1682],[52.5394,13.1707],[52.5398,13.1663],[52.5372,13.1559],[52.5306,13.1591],[52.5311,13.1638],[52.5297,13.1659],[52.5265,13.1659],[52.5247,13.1691],[52.5239,13.1618],[52.5258,13.1612],[52.5254,13.1584],[52.528,13.1443],[52.5202,13.1426],[52.5178,13.128],[52.5175,13.1173],[52.5252,13.1187],[52.5447,13.1254],[52.5453,13.1248],[52.5562,13.1315],[52.553,13.1355],[52.5525,13.1444],[52.5481,13.1465],[52.5464,13.1587],[52.544,13.1649],[52.5441,13.1683]]]},{"n":null,"r":[[[52.521,13.1872],[52.5181,13.1863],[52.5082,13.1791],[52.5053,13.18],[52.5017,13.1792],[52.5001,13.1799],[52.5002,13.1758],[52.4982,13.174],[52.4962,13.1738],[52.4933,13.1692],[52.4985,13.152],[52.5095,13.1688],[52.5179,13.1454],[52.5202,13.1426],[52.528,13.1443],[52.5254,13.1584],[52.5258,13.1612],[52.5239,13.1618],[52.5247,13.1691],[52.5232,13.1732],[52.521,13.1872]]]},{"n":null,"r":[[[52.5247,13.2043],[52.5236,13.2059],[52.5214,13.2067],[52.5173,13.2055],[52.5165,13.2099],[52.5181,13.2131],[52.5149,13.2184],[52.5133,13.219],[52.5099,13.2156],[52.5088,13.2162],[52.5092,13.2119],[52.5055,13.2086],[52.5042,13.2096],[52.5028,13.2091],[52.4995,13.1975],[52.4997,13.1951],[52.4981,13.19],[52.5001,13.1799],[52.5017,13.1792],[52.5053,13.18],[52.5082,13.1791],[52.5181,13.1863],[52.521,13.1872],[52.5238,13.1917],[52.5282,13.195],[52.525,13.1999],[52.5247,13.2043]]]},{"n":null,"r":[[[52.5417,13.2084],[52.5386,13.209],[52.5362,13.208],[52.5362,13.2123],[52.5338,13.2217],[52.5343,13.2319],[52.532,13.2396],[52.5293,13.2447],[52.5259,13.24],[52.5262,13.2222],[52.5211,13.2195],[52.5161,13.2199],[52.514,13.2212],[52.5137,13.2189],[52.5149,13.2184],[52.5181,13.2131],[52.5164,13.2074],[52.5173,13.2055],[52.5214,13.2067],[52.5236,13.2059],[52.5247,13.2043],[52.5298,13.2013],[52.5334,13.2025],[52.5351,13.1957],[52.5364,13.1956],[52.5393,13.1979],[52.5417,13.2084]]]},{"n":null,"r":[[[52.5662,13.2489],[52.5646,13.2555],[52.5534,13.2492],[52.5579,13.2415],[52.5571,13.2394],[52.5509,13.2501],[52.5488,13.261],[52.5476,13.2476],[52.5442,13.247],[52.5385,13.2479],[52.5324,13.2468],[52.5313,13.2484],[52.5301,13.2554],[52.5274,13.2555],[52.5274,13.2489],[52.532,13.2396],[52.5343,13.2319],[52.5338,13.2217],[52.5362,13.2123],[52.5362,13.208],[52.5386,13.209],[52.5427,13.2089],[52.5426,13.2113],[52.5439,13.2119],[52.5441,13.2191],[52.5465,13.2219],[52.5584,13.2231],[52.5597,13.2237],[52.5626,13.2288],[52.5634,13.2278],[52.5661,13.2285],[52.567,13.2277],[52.567,13.2445],[52.5662,13.2489]]]},{"n":null,"r":[[[52.5486,13.3174],[52.5384,13.3304],[52.5336,13.2986],[52.5296,13.2846],[52.5307,13.2786],[52.5335,13.2755],[52.5364,13.2757],[52.539,13.272],[52.5417,13.2734],[52.5399,13.2944],[52.5458,13.298],[52.5512,13.2945],[52.5515,13.3023],[52.549,13.3012],[52.5486,13.3174]]]},{"n":null,"r":[[[52.554,13.2625],[52.5547,13.264],[52.5549,13.2724],[52.553,13.2755],[52.553,13.2831],[52.5511,13.2851],[52.5512,13.2945],[52.5458,13.298],[52.5399,13.2944],[52.5417,13.2734],[52.539,13.272],[52.5364,13.2757],[52.5335,13.2755],[52.5307,13.2786],[52.529,13.2742],[52.5289,13.265],[52.5274,13.2555],[52.5301,13.2554],[52.5313,13.2484],[52.5324,13.2468],[52.5385,13.2479],[52.5442,13.247],[52.5476,13.2476],[52.5488,13.261],[52.5509,13.2501],[52.5571,13.2394],[52.5579,13.2415],[52.5534,13.2492],[52.551,13.2571],[52.554,13.2625]]]},{"n":null,"r":[[[52.53,13.2872],[52.5264,13.2822],[52.5259,13.2787],[52.5101,13.2813],[52.51,13.2711],[52.5191,13.2568],[52.5219,13.2588],[52.5263,13.2405],[52.5293,13.2447],[52.5274,13.2489],[52.5272,13.2526],[52.5289,13.265],[52.529,13.2742],[52.5307,13.2786],[52.5297,13.2831],[52.53,13.2872]]]},{"n":null,"r":[[[52.5263,13.2405],[52.5219,13.2588],[52.5191,13.2568],[52.51,13.2711],[52.5097,13.2735],[52.5084,13.2729],[52.5057,13.2693],[52.5086,13.26],[52.5087,13.2563],[52.51,13.2548],[52.5113,13.249],[52.5143,13.2496],[52.522,13.2454],[52.5221,13.2419],[52.5206,13.2347],[52.5261,13.2365],[52.5263,13.2405]]]},{"n":null,"r":[[[52.5261,13.2365],[52.5206,13.2347],[52.5221,13.2419],[52.522,13.2454],[52.5143,13.2496],[52.5113,13.249],[52.5118,13.2451],[52.5096,13.2297],[52.5103,13.2268],[52.514,13.2212],[52.5161,13.2199],[52.5211,13.2195],[52.5262,13.2222],[52.5261,13.2365]]]},{"n":null,"r":[[[52.514,13.2212],[52.5103,13.2268],[52.5096,13.2297],[52.5118,13.2451],[52.511,13.2511],[52.51,13.2548],[52.5087,13.2563],[52.5086,13.26],[52.5057,13.2693],[52.5084,13.2729],[52.5064,13.281],[52.5035,13.2802],[52.5028,13.2787],[52.4995,13.28],[52.4969,13.2713],[52.4889,13.2619],[52.4894,13.2593],[52.4958,13.247],[52.4932,13.239],[52.4973,13.2275],[52.5004,13.223],[52.5003,13.214],[52.5022,13.207],[52.5028,13.2091],[52.5042,13.2096],[52.5055,13.2086],[52.5084,13.2105],[52.5092,13.2119],[52.5088,13.2162],[52.5099,13.2156],[52.5137,13.2189],[52.514,13.2212]]]},{"n":null,"r":[[[52.5101,13.2813],[52.511,13.2967],[52.5068,13.2946],[52.5068,13.2987],[52.5042,13.2996],[52.4982,13.2815],[52.5005,13.279],[52.5028,13.2787],[52.5035,13.2802],[52.5064,13.281],[52.5084,13.2729],[52.5097,13.2735],[52.5101,13.2813]]]},{"n":null,"r":[[[52.5322,13.2928],[52.5308,13.2949],[52.5237,13.2966],[52.522,13.2998],[52.5198,13.2992],[52.5197,13.2958],[52.511,13.2967],[52.5101,13.2813],[52.5259,13.2787],[52.5264,13.2822],[52.53,13.2872],[52.5322,13.2928]]]},{"n":null,"r":[[[52.4981,13.19],[52.4903,13.188],[52.4885,13.1863],[52.4835,13.1896],[52.4784,13.1864],[52.4742,13.1888],[52.4617,13.1855],[52.4563,13.1775],[52.4565,13.1718],[52.4524,13.1605],[52.4492,13.1578],[52.445,13.1511],[52.4399,13.1223],[52.4418,13.1192],[52.4443,13.1183],[52.446,13.1147],[52.451,13.1086],[52.4544,13.1112],[52.458,13.1121],[52.4671,13.111],[52.4726,13.1163],[52.475,13.1176],[52.4776,13.1176],[52.4793,13.1265],[52.4985,13.152],[52.4933,13.1692],[52.4962,13.1738],[52.4982,13.174],[52.5002,13.1758],[52.4981,13.19]]]},{"n":null,"r":[[[52.4458,13.1527],[52.4375,13.1714],[52.432,13.1818],[52.4298,13.183],[52.428,13.1893],[52.4227,13.1954],[52.4225,13.2001],[52.4183,13.1972],[52.4157,13.1974],[52.4029,13.1594],[52.4001,13.1595],[52.3965,13.158],[52.3979,13.1714],[52.3958,13.172],[52.3945,13.169],[52.3941,13.1591],[52.3957,13.1459],[52.3974,13.1434],[52.3973,13.142],[52.3906,13.1305],[52.389,13.1341],[52.3875,13.1333],[52.3875,13.1314],[52.3898,13.1269],[52.3918,13.1275],[52.392,13.1319],[52.3962,13.1391],[52.3963,13.1359],[52.3975,13.1353],[52.398,13.1383],[52.3995,13.1337],[52.397,13.1281],[52.3971,13.1255],[52.4023,13.1182],[52.4042,13.1122],[52.4074,13.1086],[52.4084,13.1095],[52.409,13.1065],[52.4108,13.112],[52.4117,13.1116],[52.4116,13.1103],[52.4132,13.1098],[52.4134,13.1072],[52.4102,13.1073],[52.4098,13.106],[52.4109,13.1012],[52.4141,13.1008],[52.4134,13.0965],[52.4113,13.0991],[52.4098,13.0975],[52.4126,13.0903],[52.42,13.0883],[52.4224,13.0959],[52.4257,13.0994],[52.4244,13.1048],[52.4257,13.1056],[52.4295,13.113],[52.4327,13.1124],[52.4365,13.1176],[52.4382,13.1225],[52.439,13.1232],[52.4399,13.1223],[52.4435,13.1444],[52.4458,13.1527]]]},{"n":null,"r":[[[52.4563,13.1775],[52.453,13.1911],[52.4493,13.1963],[52.4405,13.203],[52.4377,13.1991],[52.4363,13.1992],[52.4404,13.2063],[52.4413,13.2136],[52.4426,13.2164],[52.4453,13.2186],[52.4456,13.2202],[52.4438,13.2248],[52.4457,13.2286],[52.4448,13.2292],[52.4375,13.2255],[52.4336,13.2282],[52.4326,13.2229],[52.4297,13.2243],[52.4282,13.2184],[52.4248,13.2204],[52.4228,13.2137],[52.4189,13.2161],[52.4161,13.2047],[52.4157,13.1974],[52.4183,13.1972],[52.4225,13.2001],[52.4227,13.1954],[52.428,13.1893],[52.4298,13.183],[52.432,13.1818],[52.4375,13.1714],[52.4458,13.1527],[52.4492,13.1578],[52.4524,13.1605],[52.4565,13.1718],[52.4563,13.1775]]]},{"n":null,"r":[[[52.4457,13.2286],[52.447,13.2299],[52.4504,13.2297],[52.4521,13.2307],[52.4559,13.2391],[52.4563,13.2465],[52.4578,13.2496],[52.4518,13.2504],[52.4395,13.2556],[52.4354,13.2584],[52.4351,13.2623],[52.4332,13.2613],[52.4332,13.2597],[52.4312,13.2593],[52.4189,13.2161],[52.4228,13.2137],[52.4248,13.2204],[52.4282,13.2184],[52.4297,13.2243],[52.4326,13.2229],[52.4336,13.2282],[52.4375,13.2255],[52.4448,13.2292],[52.4457,13.2286]]]},{"n":null,"r":[[[52.4312,13.2593],[52.4265,13.2604],[52.4229,13.2634],[52.4069,13.2678],[52.4043,13.2694],[52.4065,13.2584],[52.4051,13.2501],[52.4145,13.2487],[52.4213,13.2462],[52.4205,13.2332],[52.4212,13.2253],[52.4312,13.2593]]]},{"n":null,"r":[[[52.4312,13.2593],[52.4391,13.2817],[52.4333,13.2796],[52.4328,13.287],[52.4281,13.2903],[52.4275,13.2885],[52.4236,13.291],[52.4235,13.2922],[52.4225,13.2874],[52.4193,13.2896],[52.4204,13.2933],[52.4162,13.2969],[52.4052,13.2761],[52.4043,13.2694],[52.4069,13.2678],[52.4229,13.2634],[52.4265,13.2604],[52.4312,13.2593]]]},{"n":null,"r":[[[52.4578,13.2496],[52.4578,13.2538],[52.4542,13.2581],[52.4537,13.2632],[52.4556,13.2666],[52.4534,13.272],[52.4504,13.2701],[52.4507,13.2625],[52.4443,13.2694],[52.4425,13.27],[52.4419,13.2825],[52.4391,13.2817],[52.4312,13.2593],[52.4332,13.2597],[52.4332,13.2613],[52.4351,13.2623],[52.4354,13.2584],[52.4395,13.2556],[52.4518,13.2504],[52.4578,13.2496]]]},{"n":null,"r":[[[52.4982,13.2815],[52.4943,13.2864],[52.4937,13.2909],[52.488,13.2999],[52.4799,13.285],[52.4738,13.2769],[52.4736,13.2732],[52.4682,13.272],[52.4678,13.2697],[52.4586,13.2619],[52.4565,13.2553],[52.4578,13.2538],[52.4581,13.2513],[52.4563,13.2465],[52.4552,13.2372],[52.4521,13.2307],[52.4504,13.2297],[52.447,13.2299],[52.4441,13.2265],[52.4453,13.2186],[52.4426,13.2164],[52.4413,13.2136],[52.4404,13.2063],[52.4363,13.1992],[52.4377,13.1991],[52.4405,13.203],[52.4493,13.1963],[52.453,13.1911],[52.4563,13.1775],[52.4617,13.1855],[52.4742,13.1888],[52.4784,13.1864],[52.4835,13.1896],[52.4885,13.1863],[52.4903,13.188],[52.4981,13.19],[52.4987,13.1915],[52.5022,13.207],[52.5003,13.214],[52.5004,13.223],[52.4973,13.2275],[52.4932,13.239],[52.4958,13.247],[52.4894,13.2593],[52.4889,13.2619],[52.4969,13.2713],[52.4995,13.28],[52.4982,13.2815]]]},{"n":null,"r":[[[52.4749,13.2776],[52.47,13.2845],[52.4707,13.29],[52.4668,13.3091],[52.4649,13.3051],[52.4591,13.3038],[52.4562,13.308],[52.4548,13.3089],[52.4543,13.3082],[52.4517,13.3112],[52.4501,13.3049],[52.4547,13.2995],[52.4517,13.2965],[52.4511,13.299],[52.4487,13.3012],[52.4419,13.2825],[52.4425,13.27],[52.4443,13.2694],[52.4507,13.2625],[52.4504,13.2701],[52.4534,13.272],[52.4556,13.2666],[52.4537,13.2632],[52.4542,13.2581],[52.4565,13.2553],[52.4586,13.2619],[52.4678,13.2697],[52.4682,13.272],[52.4736,13.2732],[52.4738,13.2769],[52.4749,13.2776]]]},{"n":null,"r":[[[52.4777,13.3203],[52.4673,13.3194],[52.4677,13.3073],[52.4735,13.2994],[52.4805,13.3118],[52.4781,13.317],[52.4777,13.3203]]]},{"n":null,"r":[[[52.4805,13.3118],[52.4735,13.2994],[52.4677,13.3073],[52.4707,13.29],[52.47,13.2845],[52.4749,13.2776],[52.488,13.2999],[52.4805,13.3118]]]}]}
````
