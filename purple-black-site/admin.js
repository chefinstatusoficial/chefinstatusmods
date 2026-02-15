// admin.js — painel para editar tudo
(async function(){
  let cfg = loadConfig();
  applyTheme(cfg);
  setBrandHeader(cfg);

  // render do logo preview
  const logoPreview = document.getElementById("logoPreview");
  const logoInput = document.getElementById("logoInput");
  const clearLogoBtn = document.getElementById("clearLogoBtn");

  // Campos branding
  const fields = {
    siteName: "branding.siteName",
    siteTag: "branding.siteTag",
    heroTitle: "branding.heroTitle",
    heroSubtitle: "branding.heroSubtitle",
    appsIntro: "branding.appsIntro",
    aboutText: "branding.aboutText",
    contactText: "branding.contactText",
    primaryColor: "theme.primary",
    accentColor: "theme.accent",
    bgColor: "theme.bg",
    textColor: "theme.text",
    whatsappNumber: "contact.whatsappNumber",
    whatsappMsg: "contact.whatsappMsg",
    instagramUrl: "contact.instagramUrl",
    youtubeUrl: "contact.youtubeUrl",
  };

  function getByPath(obj, path){
    return path.split(".").reduce((o,k)=> (o && o[k] !== undefined ? o[k] : undefined), obj);
  }
  function setByPath(obj, path, val){
    const parts = path.split(".");
    let cur = obj;
    for(let i=0;i<parts.length-1;i++){
      const k = parts[i];
      cur[k] = cur[k] ?? {};
      cur = cur[k];
    }
    cur[parts.at(-1)] = val;
  }

  // Preenche campos
  for(const [id, path] of Object.entries(fields)){
    const el = document.getElementById(id);
    if(!el) continue;
    const v = getByPath(cfg, path);
    if(el.type === "color"){
      el.value = v || "#000000";
    }else{
      el.value = v ?? "";
    }
  }

  if(logoPreview){
    if(cfg.branding.logoDataUrl){
      logoPreview.src = cfg.branding.logoDataUrl;
    }else{
      logoPreview.removeAttribute("src");
    }
  }

  // Upload logo
  if(logoInput){
    logoInput.addEventListener("change", async (e)=>{
      const file = e.target.files?.[0];
      if(!file) return;
      if(file.size > 2.5 * 1024 * 1024){
        toast("Imagem muito grande. Use até 2,5MB.");
        logoInput.value = "";
        return;
      }
      const dataUrl = await fileToDataUrl(file);
      cfg.branding.logoDataUrl = dataUrl;
      saveConfig(cfg);
      applyTheme(cfg);
      setBrandHeader(cfg);
      if(logoPreview) logoPreview.src = dataUrl;
      toast("Logo atualizado!");
    });
  }

  if(clearLogoBtn){
    clearLogoBtn.addEventListener("click", ()=>{
      cfg.branding.logoDataUrl = "";
      saveConfig(cfg);
      setBrandHeader(cfg);
      if(logoPreview) logoPreview.removeAttribute("src");
      toast("Logo removido.");
    });
  }

  // Salvar branding
  const saveBrandingBtn = document.getElementById("saveBrandingBtn");
  if(saveBrandingBtn){
    saveBrandingBtn.addEventListener("click", ()=>{
      for(const [id, path] of Object.entries(fields)){
        const el = document.getElementById(id);
        if(!el) continue;
        setByPath(cfg, path, el.value);
      }
      saveConfig(cfg);
      applyTheme(cfg);
      setBrandHeader(cfg);
      toast("Configurações salvas!");
    });
  }

  // Reset
  const resetBtn = document.getElementById("resetBtn");
  if(resetBtn){
    resetBtn.addEventListener("click", ()=>{
      if(!confirm("Resetar tudo para o padrão?")) return;
      resetConfig();
      cfg = loadConfig();
      location.reload();
    });
  }

  // Senha
  const passHint = document.getElementById("passHint");
  const setPassBtn = document.getElementById("setPassBtn");
  const adminPass = document.getElementById("adminPass");
  const newPass = document.getElementById("newPass");

  if(passHint){
    passHint.textContent = cfg.admin.passwordHash ? "Senha configurada." : "Sem senha configurada.";
  }

  if(setPassBtn){
    setPassBtn.addEventListener("click", async ()=>{
      const current = adminPass?.value || "";
      const next = newPass?.value || "";

      if(cfg.admin.passwordHash){
        const curHash = await sha256(current);
        if(curHash !== cfg.admin.passwordHash){
          toast("Senha atual incorreta.");
          return;
        }
      }
      if(!next || next.length < 4){
        toast("A nova senha precisa ter pelo menos 4 caracteres.");
        return;
      }
      cfg.admin.passwordHash = await sha256(next);
      saveConfig(cfg);
      adminPass.value = "";
      newPass.value = "";
      passHint.textContent = "Senha atualizada.";
      toast("Senha salva!");
    });
  }

  // Proteção simples: se tem senha, pede no carregamento
  if(cfg.admin.passwordHash){
    const typed = prompt("Digite a senha do Admin:");
    if(!typed){
      location.href = "index.html";
      return;
    }
    const typedHash = await sha256(typed);
    if(typedHash !== cfg.admin.passwordHash){
      alert("Senha incorreta.");
      location.href = "index.html";
      return;
    }
  }

  // Produtos
  const table = document.getElementById("productsTable");
  const addProductBtn = document.getElementById("addProductBtn");
  const dlg = document.getElementById("productDialog");
  const form = document.getElementById("productForm");
  const dlgTitle = document.getElementById("dlgTitle");

  const pName = document.getElementById("pName");
  const pDesc = document.getElementById("pDesc");
  const pPrice = document.getElementById("pPrice");
  const pAppLink = document.getElementById("pAppLink");
  const pMode = document.getElementById("pMode");
  const pCheckout = document.getElementById("pCheckout");
  const pBtnText = document.getElementById("pBtnText");

  let editingId = null;

  function renderTable(){
    const tbody = table?.querySelector("tbody");
    if(!tbody) return;
    tbody.innerHTML = "";

    const products = Array.isArray(cfg.products) ? cfg.products : [];
    if(products.length === 0){
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" class="muted">Nenhum app cadastrado.</td>`;
      tbody.appendChild(tr);
      return;
    }

    for(const p of products){
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><b>${escapeHtml(p.name || "")}</b><div class="small muted">${escapeHtml((p.desc||"").slice(0,70))}${(p.desc||"").length>70?"…":""}</div></td>
        <td>${p.price ? escapeHtml(p.price) : ""}</td>
        <td>${p.mode === "checkout" ? "Checkout" : "WhatsApp"}</td>
        <td class="small muted">${escapeHtml((p.appLink||"").slice(0,55))}${(p.appLink||"").length>55?"…":""}</td>
        <td>
          <div class="actions">
            <button class="iconBtn" data-act="edit" data-id="${p.id}">Editar</button>
            <button class="iconBtn" data-act="del" data-id="${p.id}">Excluir</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  function openDialog(p){
    editingId = p?.id ?? null;
    dlgTitle.textContent = editingId ? "Editar app" : "Novo app";
    pName.value = p?.name ?? "";
    pDesc.value = p?.desc ?? "";
    pPrice.value = p?.price ?? "";
    pAppLink.value = p?.appLink ?? "";
    pMode.value = p?.mode ?? "whatsapp";
    pCheckout.value = p?.checkout ?? "";
    pBtnText.value = p?.buttonText ?? "Comprar";
    dlg.showModal();
  }

  addProductBtn?.addEventListener("click", ()=> openDialog(null));

  table?.addEventListener("click", (e)=>{
    const btn = e.target.closest("button[data-act]");
    if(!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;
    const products = Array.isArray(cfg.products) ? cfg.products : [];
    const p = products.find(x=> x.id === id);

    if(act === "edit" && p){
      openDialog(p);
    }else if(act === "del" && p){
      if(!confirm(`Excluir "${p.name}"?`)) return;
      cfg.products = products.filter(x=> x.id !== id);
      saveConfig(cfg);
      renderTable();
      toast("App excluído.");
    }
  });

  form?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const products = Array.isArray(cfg.products) ? cfg.products : [];

    const obj = {
      id: editingId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
      name: pName.value.trim(),
      desc: pDesc.value.trim(),
      price: pPrice.value.trim(),
      appLink: pAppLink.value.trim(),
      mode: pMode.value,
      checkout: pCheckout.value.trim(),
      buttonText: pBtnText.value.trim() || "Comprar"
    };

    if(!obj.name){
      toast("Digite o nome do app.");
      return;
    }

    if(obj.mode === "checkout" && !obj.checkout){
      toast("Modo Checkout precisa do link do checkout.");
      return;
    }

    const idx = products.findIndex(x=> x.id === obj.id);
    if(idx >= 0) products[idx] = obj;
    else products.unshift(obj);

    cfg.products = products;
    saveConfig(cfg);
    renderTable();
    dlg.close();
    toast("App salvo!");
  });

  // Export / Import
  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importInput");

  exportBtn?.addEventListener("click", ()=>{
    const blob = new Blob([JSON.stringify(cfg, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "site-config.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Exportado!");
  });

  importInput?.addEventListener("change", async (e)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    try{
      const text = await file.text();
      const imported = JSON.parse(text);
      cfg = deepMerge(structuredClone(DEFAULT_CONFIG), imported);
      saveConfig(cfg);
      toast("Importado! Recarregando…");
      setTimeout(()=> location.reload(), 600);
    }catch{
      toast("JSON inválido.");
    }finally{
      importInput.value = "";
    }
  });

  renderTable();

  async function fileToDataUrl(file){
    return await new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = ()=> resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
})();
