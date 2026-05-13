// ────────── ESTADO PADRÃO ──────────
const ESTADO_PADRAO = {
  doca:        "01",
  status:      "CARREGAMENTO FINALIZADO",
  motorista:   "ARIANA GRANDE",
  placa:       "6969-ARI",
  veiculo:     "POP STAR",
  tipo:        "CARRETA",
  paletizada:  true,
  historico: [
    { doca: "11", motorista: "RENATO NOVAES",    status: "AGUARDANDO MOTORISTA" },
    { doca: "02", motorista: "LANA DEL",         status: "AGUARDANDO MOTORISTA" },
    { doca: "11", motorista: "RENATO NOVAES",    status: "AGUARDANDO MOTORISTA" },
    { doca: "01", motorista: "CARLOS SILVA",     status: "CARREGAMENTO" },
    { doca: "02", motorista: "ANA SOUZA",        status: "CARREGAMENTO" },
    { doca: "07", motorista: "MARCOS OLIVEIRA",  status: "CARREGAMENTO" },
  ],
};

const STORAGE_KEY = "painel-motoristas:v1";
const CONFIG_KEY  = "painel-motoristas:config:v1";
const CANAL       = "painel-motoristas";

// ────────── ARMAZENAMENTO LOCAL ──────────
function carregar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...ESTADO_PADRAO };
    return { ...ESTADO_PADRAO, ...JSON.parse(raw) };
  } catch {
    return { ...ESTADO_PADRAO };
  }
}

function salvarLocal(estado) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  try {
    const bc = new BroadcastChannel(CANAL);
    bc.postMessage(estado);
    bc.close();
  } catch {}
}

function salvar(estado) {
  salvarLocal(estado);
  salvarNuvem(estado);
}

// ────────── CONFIG NUVEM (FIREBASE) ──────────
function getNuvemUrl() {
  try {
    const cfg = JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
    return cfg.firebaseUrl || null;
  } catch { return null; }
}

function setNuvemUrl(url) {
  const limpa = (url || "").trim().replace(/\/+$/, "");
  if (!limpa) {
    localStorage.removeItem(CONFIG_KEY);
    return null;
  }
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ firebaseUrl: limpa }));
  return limpa;
}

async function carregarNuvem() {
  const base = getNuvemUrl();
  if (!base) return null;
  try {
    const r = await fetch(`${base}/painel.json`, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function salvarNuvem(estado) {
  const base = getNuvemUrl();
  if (!base) return false;
  try {
    const r = await fetch(`${base}/painel.json`, {
      method: "PUT",
      body: JSON.stringify(estado),
      headers: { "Content-Type": "application/json" },
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function testarNuvem() {
  const base = getNuvemUrl();
  if (!base) return { ok: false, erro: "Sem URL configurada" };
  try {
    const r = await fetch(`${base}/_ping.json`, {
      method: "PUT",
      body: JSON.stringify(Date.now()),
      headers: { "Content-Type": "application/json" },
    });
    if (!r.ok) return { ok: false, erro: `HTTP ${r.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: String(e.message || e) };
  }
}

// ────────── INSCRIÇÃO EM MUDANÇAS ──────────
let pollTimer = null;
let ultimoSerializado = "";

function inscrever(callback) {
  // mesmo navegador (outras abas)
  try {
    const bc = new BroadcastChannel(CANAL);
    bc.onmessage = (e) => callback(e.data);
  } catch {}
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try { callback(JSON.parse(e.newValue)); } catch {}
    }
  });

  // outros dispositivos via nuvem (polling 2.5s)
  iniciarPolling(callback);
}

function iniciarPolling(callback) {
  pararPolling();
  if (!getNuvemUrl()) return;
  ultimoSerializado = JSON.stringify(carregar());
  pollTimer = setInterval(async () => {
    const nuvem = await carregarNuvem();
    if (!nuvem) return;
    const s = JSON.stringify(nuvem);
    if (s !== ultimoSerializado) {
      ultimoSerializado = s;
      salvarLocal(nuvem);
      callback(nuvem);
    }
  }, 2500);
}

function pararPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

// ao reconectar a aba (volta do background), forçar sync imediato
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible" && getNuvemUrl()) {
    const nuvem = await carregarNuvem();
    if (nuvem) {
      ultimoSerializado = JSON.stringify(nuvem);
      salvarLocal(nuvem);
      try {
        const bc = new BroadcastChannel(CANAL);
        bc.postMessage(nuvem);
        bc.close();
      } catch {}
    }
  }
});
