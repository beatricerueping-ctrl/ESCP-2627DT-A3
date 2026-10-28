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
  prev?.ctl.suspend?.();
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
  top.ctl.suspend?.();
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
    <div id="capture"></div>`;
  bindBack(el);
  return ShelfLifeCamera($("#capture", el), {
    prepare: prepImages,
    onUse(photo) {
      S.draft = {photo: photo.thumb, ai: null, aiStatus: "manual", answers: {q1: {}, q6: {}}, startedAt: Date.now()};
      S.aiBlob = photo.blob;
      lsSet("sl_draft", S.draft);
      go("survey", {}, {replace: true});
    }
  });
};
async function prepImages(file){
  const bmp = await createImageBitmap(file).catch(() => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); }));
  const draw = (max, q) => { const sc = Math.min(1, max / Math.max(bmp.width, bmp.height)); const c = document.createElement("canvas"); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); return c; };
  const big = draw(1280, .86); const blob = await new Promise(r => big.toBlob(r, "image/jpeg", .86));
  const thumb = draw(420, .78).toDataURL("image/jpeg", .78);
  return {blob, thumb};
}

/* ---------- AI analysis ---------- */
VIEWS.analyze = el => {
  const dr = S.draft;
  if (!dr) { setTimeout(() => go("edash", {}, {reset: true}), 0); return {}; }
  el.innerHTML = `${topbar(backBtn(), `<b style="color:var(--forest)">AI Product Analysis</b>`)}
    <div class="scanimg" id="si"><img src="${dr.photo}" alt="Product photo being analysed"><div class="grid"></div><div class="beam"></div></div>
    <p class="statusmsg" id="msg" aria-live="polite">Identifying the product...</p><div id="res" class="stack" style="margin-top:16px"></div>`;
  bindBack(el);
  const msgs = ["Identifying the product...","Analyzing visible characteristics...","Checking for signs of deterioration...","Preparing your freshness assessment..."];
  const controller = new AbortController();
  let i = 0, alive = true; const tick = setInterval(() => { i = (i + 1) % msgs.length; const m = $("#msg", el); if (m) { m.textContent = msgs[i]; m.style.animation = "none"; m.offsetHeight; m.style.animation = ""; } }, 1100);
  (async () => {
    const started = Date.now(); let ai = null, status = "unavailable", detail = "";
    try {
      if (!S.aiBlob) throw new Error("Retake the photo before running AI analysis.");
      const image = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(S.aiBlob);
      });
      const response = await fetch("/api/analyze", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({image}), signal: controller.signal});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI analysis failed. Continue manually or retake the photo.");
      ai = result.observations; status = "ok";
    } catch (e) { status = "error"; detail = e.message || "AI analysis is unavailable. Continue manually."; ai = null; }
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
        <p class="sub">${esc(detail) || "Image analysis is not available right now."} No observations were generated, so nothing here is guessed. You'll identify the product and record its condition in the survey.</p></div>`;
    $("#res", el).insertAdjacentHTML("beforeend", `<button class="btn btn-primary" id="cont">Continue to Freshness Survey</button><button class="btn btn-ghost" id="re">${I.retake} Retake photo</button>`);
    $("#cont", el).onclick = () => go("survey", {}, {replace: true});
    $("#re", el).onclick = () => go("scan", {}, {replace: true});
  }
  return {destroy(){ alive = false; controller.abort(); clearInterval(tick); }};
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
  const answered = () => [!!(A.q1.name || "").trim() && (!aiName || A.q1.confirmed || A.q1.name.trim().toLowerCase() !== aiName.toLowerCase()), !!A.q2, !!A.q3, !!A.q4, !!A.q5?.type && (A.q5.type === "none" || !!A.q5.date), !!A.q6.storage];
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
