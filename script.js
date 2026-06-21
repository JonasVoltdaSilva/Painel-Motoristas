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
let _bc            = null;

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
  // Carimba timestamp para o polling detectar mudanças
  const payload = { ...estado, _ts: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  try {
    if (_bc) _bc.postMessage(payload);
  } catch {}
}

function salvar(estado) {
  _salvarLocal(estado);
  if (_dbRef) _dbRef.set(estado).catch(() => {});
}

// Subscreve atualizações via todos os canais disponíveis.
// callback recebe o estado normalizado.
// Retorna uma função que atualiza o "baseline" do polling (evita render duplo).
function inscrever(callback) {
  let _ultimoJson = localStorage.getItem(STORAGE_KEY) || "";

  // ── Firebase ──────────────────────────────────────────
  if (_dbRef) {
    _dbRef.on("value", (snap) => {
      const val = snap.val();
      if (!val) return;
      try { _ultimoJson = localStorage.getItem(STORAGE_KEY) || ""; } catch {}
      callback(normalizarEstado(val));
    });
  }

  // ── BroadcastChannel (mesma origem, qualquer aba) ─────
  try {
    _bc = new BroadcastChannel(CANAL);
    _bc.onmessage = (e) => {
      try {
        _ultimoJson = localStorage.getItem(STORAGE_KEY) || "";
        callback(normalizarEstado(e.data));
      } catch {}
    };
  } catch {}

  // ── Storage event (mesma origem, outras abas) ─────────
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      _ultimoJson = e.newValue;
      callback(normalizarEstado(JSON.parse(e.newValue)));
    } catch {}
  });

  // ── Polling de localStorage (fallback garantido a cada 2s) ───
  setInterval(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "";
      if (!raw || raw === _ultimoJson) return;
      _ultimoJson = raw;
      callback(normalizarEstado(JSON.parse(raw)));
    } catch {}
  }, 2000);
}

inicializarFirebase();
