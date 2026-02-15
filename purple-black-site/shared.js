// shared.js — funções comuns (config, tema, toast)
const STORAGE_KEY = "purpleBlackSiteConfig_v1";

const DEFAULT_CONFIG = {
  branding: {
    siteName: "Seu Site",
    siteTag: "Vitrine de apps",
    heroTitle: "Seu espaço roxo & preto",
    heroSubtitle: "Coloque seus apps aqui e venda enviando o link depois do pagamento (via WhatsApp ou checkout).",
    appsIntro: "Clique em comprar para ir pro checkout ou abrir WhatsApp.",
    aboutText: "Escreva aqui sobre você, sua equipe, seus produtos e como funciona a entrega do link do app.",
    contactText: "Quer comprar ou tirar dúvida? Me chama no WhatsApp.",
    logoDataUrl: "" // será preenchido quando você enviar uma imagem
  },
  theme: {
    primary: "#8b5cf6",
    accent: "#ec4899",
    bg: "#07040f",
    text: "#f3f4f6"
  },
  contact: {
    whatsappNumber: "55", // coloque seu número com DDI, ex.: 5591999999999
    whatsappMsg: "Olá! Tenho interesse em um app do seu site.",
    instagramUrl: "https://instagram.com/",
    youtubeUrl: "https://youtube.com/"
  },
  products: [
    {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: "Meu App Premium",
      desc: "Um app incrível com recursos especiais. Edite essa descrição no Admin.",
      price: "19.90",
      appLink: "https://seu-link-do-app-aqui.com",
      mode: "whatsapp", // "whatsapp" | "checkout"
      checkout: "",
      buttonText: "Comprar"
    },
    {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+1),
      name: "Meu App Pro",
      desc: "Outra opção para vender. Você pode colocar checkout direto.",
      price: "49.90",
      appLink: "https://seu-link-do-app-pro-aqui.com",
      mode: "checkout",
      checkout: "https://seu-checkout.com/produto",
      buttonText: "Comprar no checkout"
    }
  ],
  admin: {
    passwordHash: "" // opcional (hash simples)
  }
};

// Hash simples (não é segurança forte — serve só pra bloqueio básico).
async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map(b => b.toString(16).padStart(2, "0")).join("");
}

function loadConfig(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(DEFAULT_CONFIG);
    const parsed = JSON.parse(raw);
    // Mescla com defaults para não quebrar se faltar campo
    return deepMerge(structuredClone(DEFAULT_CONFIG), parsed);
  }catch{
    return structuredClone(DEFAULT_CONFIG);
  }
}

function saveConfig(cfg){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

function resetConfig(){
  localStorage.removeItem(STORAGE_KEY);
}

function deepMerge(target, source){
  if(typeof target !== "object" || target === null) return source;
  if(typeof source !== "object" || source === null) return source;
  for(const key of Object.keys(source)){
    if(Array.isArray(source[key])){
      target[key] = source[key];
    }else if(typeof source[key] === "object" && source[key] !== null){
      target[key] = deepMerge(target[key] ?? {}, source[key]);
    }else{
      target[key] = source[key];
    }
  }
  return target;
}

function applyTheme(cfg){
  const r = document.documentElement;
  r.style.setProperty("--primary", cfg.theme.primary);
  r.style.setProperty("--accent", cfg.theme.accent);
  r.style.setProperty("--bg", cfg.theme.bg);
  r.style.setProperty("--text", cfg.theme.text);

  // Ajusta tons auxiliares (bg2, muted) com base no bg
  // Simples: usa um fundo ligeiramente mais claro para criar profundidade.
  r.style.setProperty("--bg2", shade(cfg.theme.bg, 12));
  r.style.setProperty("--muted", "rgba(243,244,246,.72)");
}

function shade(hex, amt){
  // hex "#rrggbb" -> clareia/escurece com amt (-100..100)
  const h = hex.replace("#","").trim();
  if(h.length !== 6) return hex;
  const num = parseInt(h, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  const clamp = v => Math.max(0, Math.min(255, v));
  r = clamp(r + amt);
  g = clamp(g + amt);
  b = clamp(b + amt);
  return "#" + [r,g,b].map(v => v.toString(16).padStart(2,"0")).join("");
}

function setBrandHeader(cfg){
  const logo = document.getElementById("brandLogo");
  const name = document.getElementById("brandName");
  const tag = document.getElementById("brandTag");

  if(logo){
    if(cfg.branding.logoDataUrl){
      logo.src = cfg.branding.logoDataUrl;
      logo.style.visibility = "visible";
    }else{
      // deixa com gradiente default, sem src
      logo.removeAttribute("src");
      logo.style.visibility = "visible";
    }
  }
  if(name) name.textContent = cfg.branding.siteName;
  if(tag) tag.textContent = cfg.branding.siteTag;
}

function toast(msg){
  const t = document.getElementById("toast");
  if(!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(()=> t.classList.remove("show"), 2600);
}

function formatBRL(priceStr){
  const n = Number(String(priceStr).replace(",", "."));
  if(!isFinite(n)) return "";
  return n.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

function waLink(number, message){
  const clean = String(number || "").replace(/\D/g, "");
  const msg = encodeURIComponent(message || "");
  // wa.me funciona com número completo: 55DDDNUMERO
  return `https://wa.me/${clean}?text=${msg}`;
}
