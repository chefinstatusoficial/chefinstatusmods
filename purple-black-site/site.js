// site.js — renderiza o site (index.html)
(function(){
  const cfg = loadConfig();
  applyTheme(cfg);
  setBrandHeader(cfg);

  document.title = cfg.branding.siteName;
  const setText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  const setHtml = (id, val) => { const el = document.getElementById(id); if(el) el.innerHTML = val; };

  setText("heroTitle", cfg.branding.heroTitle);
  setText("heroSubtitle", cfg.branding.heroSubtitle);
  setText("appsIntro", cfg.branding.appsIntro);
  setText("aboutText", cfg.branding.aboutText);
  setText("contactText", cfg.branding.contactText);
  setText("footerName", cfg.branding.siteName);
  setText("year", String(new Date().getFullYear()));

  // contato
  const whatsBtn = document.getElementById("whatsBtn");
  const igBtn = document.getElementById("igBtn");
  const ytBtn = document.getElementById("ytBtn");
  const contactFoot = document.getElementById("contactFoot");

  if(whatsBtn){
    const link = waLink(cfg.contact.whatsappNumber, cfg.contact.whatsappMsg);
    whatsBtn.href = link;
  }
  if(igBtn) igBtn.href = cfg.contact.instagramUrl || "#";
  if(ytBtn) ytBtn.href = cfg.contact.youtubeUrl || "#";
  if(contactFoot){
    const n = String(cfg.contact.whatsappNumber || "").replace(/\D/g, "");
    contactFoot.textContent = n && n !== "55" ? `WhatsApp: +${n}` : "Configure seu WhatsApp no Admin.";
  }

  // produtos
  const grid = document.getElementById("appsGrid");
  if(grid){
    grid.innerHTML = "";
    const products = Array.isArray(cfg.products) ? cfg.products : [];
    if(products.length === 0){
      grid.innerHTML = `<div class="panel"><b>Nenhum app cadastrado.</b><div class="small muted">Abra o Admin e adicione seus apps.</div></div>`;
    }else{
      for(const p of products){
        grid.appendChild(renderProductCard(p, cfg));
      }
    }
  }

  function renderProductCard(p, cfg){
    const card = document.createElement("article");
    card.className = "product";

    const price = p.price ? formatBRL(p.price) : "";
    const modeLabel = p.mode === "checkout" ? "Checkout" : "WhatsApp";

    card.innerHTML = `
      <div class="product__top">
        <div>
          <div class="product__name">${escapeHtml(p.name || "App")}</div>
          <div class="kicker">Modo: ${modeLabel}</div>
        </div>
        <div style="text-align:right;">
          <div class="price">${price || ""}</div>
          <div class="kicker">${price ? "Pagamento" : ""}</div>
        </div>
      </div>
      <p class="product__desc">${escapeHtml(p.desc || "")}</p>
      <div class="product__actions">
        <button class="btn btn--primary btn--tiny" type="button">${escapeHtml(p.buttonText || "Comprar")}</button>
        ${p.appLink ? `<a class="btn btn--ghost btn--tiny" href="${escapeAttr(p.appLink)}" target="_blank" rel="noopener">Ver link</a>` : ""}
      </div>
    `;

    const buyBtn = card.querySelector("button");
    buyBtn.addEventListener("click", ()=> handleBuy(p, cfg));
    return card;
  }

  function handleBuy(p, cfg){
    const name = p.name || "App";
    const price = p.price ? formatBRL(p.price) : "";
    const appLink = (p.appLink || "").trim();

    if(p.mode === "checkout" && p.checkout){
      window.open(p.checkout, "_blank", "noopener");
      toast("Abrindo checkout…");
      return;
    }

    // padrão: WhatsApp para você vender e depois enviar o link
    const msg =
      `${cfg.contact.whatsappMsg}\n\n` +
      `Produto: ${name}${price ? ` (${price})` : ""}\n` +
      (appLink ? `Link do app (para envio): ${appLink}\n` : "") +
      `\nQuero comprar. Como faço o pagamento?`;

    const link = waLink(cfg.contact.whatsappNumber, msg);
    window.open(link, "_blank", "noopener");
    toast("Abrindo WhatsApp…");
  }

  // util simples contra HTML injection
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s){
    return String(s).replace(/"/g, "&quot;");
  }
})();
