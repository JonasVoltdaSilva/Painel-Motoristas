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
const SYNC_ID_KEY = "painel-motoristas:sync-id";
const CANAL       = "painel-motoristas";

// Endpoint público, sem conta, sem chave (CORS aberto)
const JSONBLOB_BASE = "https://jsonblob.com/api/jsonBlob";

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

// salvar = grava local + envia pra nuvem (debounced)
let salvarTimer = null;
function salvar(estado) {
  salvarLocal(estado);
  clearTimeout(salvarTimer);
  salvarTimer = setTimeout(() => salvarNuvem(estado), 300);
}

// ────────── SYNC ID (id do blob na nuvem) ──────────
function obterSyncId() {
  // prioridade: URL > localStorage
  const url = new URL(window.location.href);
  const idDaUrl = url.searchParams.get("id");
  if (idDaUrl) {
    localStorage.setItem(SYNC_ID_KEY, idDaUrl);
    return idDaUrl;
  }
  return localStorage.getItem(SYNC_ID_KEY) || null;
}

function definirSyncId(id) {
  localStorage.setItem(SYNC_ID_KEY, id);
  // injeta ?id= na URL sem recarregar
  const url = new URL(window.location.href);
  url.searchParams.set("id", id);
  history.replaceState({}, "", url);
}

function linkCompartilhavel(pagina = "index.html") {
  const id = obterSyncId();
  if (!id) return null;
  const url = new URL(pagina, window.location.href);
  url.searchParams.set("id", id);
  return url.toString();
}

// ────────── NUVEM (jsonblob.com) ──────────
async function criarBlob(estado) {
  const r = await fetch(JSONBLOB_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept":       "application/json",
    },
    body: JSON.stringify(estado),
  });
  if (!r.ok) throw new Error(`Falhou ao criar blob (HTTP ${r.status})`);
  // jsonblob retorna o ID no header Location e no path da resposta
  const loc = r.headers.get("Location") || "";
  let id = loc.split("/").pop();
  if (!id) {
    // fallback: tentar URL completa na resposta
    const txt = await r.text();
    const m = txt.match(/jsonBlob\/([a-zA-Z0-9-]+)/);
    if (m) id = m[1];
  }
  if (!id) throw new Error("Não conseguiu obter ID do blob");
  return id;
}

async function carregarNuvem() {
  const id = obterSyncId();
  if (!id) return null;
  try {
    const r = await fetch(`${JSONBLOB_BASE}/${id}`, {
      cache: "no-store",
      headers: { "Accept": "application/json" },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function salvarNuvem(estado) {
  let id = obterSyncId();
  try {
    if (!id) {
      // primeira vez: criar blob
      id = await criarBlob(estado);
      definirSyncId(id);
      return true;
    }
    const r = await fetch(`${JSONBLOB_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(estado),
    });
    return r.ok;
  } catch (e) {
    console.warn("Sync nuvem falhou:", e);
    return false;
  }
}

// inicialização automática: garante que o blob existe
async function inicializarNuvem() {
  let id = obterSyncId();
  if (id) {
    // tenta puxar o que está na nuvem
    const remoto = await carregarNuvem();
    if (remoto) {
      salvarLocal(remoto);
      return { id, criado: false };
    }
  }
  // sem ID válido → criar agora
  try {
    id = await criarBlob(carregar());
    definirSyncId(id);
    return { id, criado: true };
  } catch (e) {
    console.warn("Não foi possível inicializar nuvem:", e);
    return null;
  }
}

// ────────── INSCRIÇÃO EM MUDANÇAS ──────────
let pollTimer = null;
let ultimoSerializado = "";

function inscrever(callback) {
  // mesma janela / outras abas do mesmo browser
  try {
    const bc = new BroadcastChannel(CANAL);
    bc.onmessage = (e) => callback(e.data);
  } catch {}
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try { callback(JSON.parse(e.newValue)); } catch {}
    }
  });

  // dispositivos diferentes → polling
  iniciarPolling(callback);
}

function iniciarPolling(callback) {
  pararPolling();
  ultimoSerializado = JSON.stringify(carregar());
  pollTimer = setInterval(async () => {
    if (!obterSyncId()) return;
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

// sync imediato ao voltar foco
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible" && obterSyncId()) {
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
