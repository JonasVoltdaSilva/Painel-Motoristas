// ────────── ESTADO PADRÃO ──────────
const DOCA_PADRAO = {
  status:     "AGUARDANDO MOTORISTA",
  motorista:  "",
  placa:      "",
  veiculo:    "",
  tipo:       "CARRETA",
  paletizada: false,
};

const DOCA_IDS = ["1","2","3","4","5","6","7","8","9","10","11","12"];

const ESTADO_PADRAO = {
  docas:     Object.fromEntries(DOCA_IDS.map(id => [id, { ...DOCA_PADRAO }])),
  historico: [],
};

const STORAGE_KEY = "painel-motoristas:v2";
const SESSION_KEY = "painel-motoristas:session";
const CANAL       = "painel-motoristas";

// ────────── AUTH ──────────
async function hashSenha(senha) {
  const buf  = new TextEncoder().encode(String(senha || ""));
  const hBuf = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verificarLogin(usuario, senha) {
  const u    = (usuario || "").toLowerCase().trim();
  const user = typeof ADMIN_USER !== "undefined" ? ADMIN_USER : "dpa";
  const pass = typeof ADMIN_PASS !== "undefined" ? ADMIN_PASS : "";
  const [senhaH, passH] = await Promise.all([hashSenha(senha), hashSenha(pass)]);
  return (u === user && senhaH === passH) ? "admin" : null;
}

function salvarSessao(tipo) { sessionStorage.setItem(SESSION_KEY, tipo); }
function tipoSessao()       { return sessionStorage.getItem(SESSION_KEY); }
function deslogar()         { sessionStorage.removeItem(SESSION_KEY); }

// ────────── ARMAZENAMENTO ──────────
function normalizarEstado(raw) {
  const docas = {};
  DOCA_IDS.forEach(id => {
    docas[id] = { ...DOCA_PADRAO, ...((raw?.docas || {})[id] || {}) };
  });
  return { docas, historico: Array.isArray(raw?.historico) ? raw.historico : [] };
}

function carregar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizarEstado(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizarEstado(null);
  }
}

// ────────── FIREBASE + SYNC ──────────
let _dbRef         = null;
let _firebaseAtivo = false;
let _bc            = null; // BroadcastChannel reutilizado para envio e recepção

function inicializarFirebase() {
  try {
    const cfg = typeof FIREBASE_CONFIG !== "undefined" ? FIREBASE_CONFIG : null;
    if (!cfg || !cfg.databaseURL) return false;
    if (!firebase?.initializeApp) return false;
    firebase.initializeApp(cfg);
    _dbRef = firebase.database().ref("/painel");
    _firebaseAtivo = true;
    return true;
  } catch {
    return false;
  }
}

function _salvarLocal(estado) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  try {
    // Reutiliza o canal aberto por inscrever() — evita criar/fechar canais descartáveis
    if (_bc) _bc.postMessage(estado);
  } catch {}
}

function salvar(estado) {
  _salvarLocal(estado);
  if (_dbRef) _dbRef.set(estado).catch(() => {});
}

function inscrever(callback) {
  if (_dbRef) {
    _dbRef.on("value", (snap) => {
      const val = snap.val();
      if (val) callback(normalizarEstado(val));
    });
    return;
  }
  // Fallback local: mantém referência global ao BC para evitar GC e reutilizar ao enviar
  try {
    _bc = new BroadcastChannel(CANAL);
    _bc.onmessage = (e) => { try { callback(normalizarEstado(e.data)); } catch {} };
  } catch {}
  // Storage event como backup (também funciona entre abas no mesmo browser)
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try { callback(normalizarEstado(JSON.parse(e.newValue))); } catch {}
    }
  });
}

inicializarFirebase();
