// ────────── ESTADO PADRÃO ──────────
const ESTADO_PADRAO = {
  doca:       "01",
  status:     "AGUARDANDO MOTORISTA",
  motorista:  "",
  placa:      "",
  veiculo:    "",
  tipo:       "CARRETA",
  paletizada: false,
  historico:  [],
};

const STORAGE_KEY = "painel-motoristas:v1";
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

function _salvarLocal(estado) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  try {
    const bc = new BroadcastChannel(CANAL);
    bc.postMessage(estado);
    bc.close();
  } catch {}
}

// ────────── FIREBASE ──────────
let _dbRef        = null;
let _firebaseAtivo = false;

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

function salvar(estado) {
  _salvarLocal(estado);
  if (_dbRef) _dbRef.set(estado).catch(() => {});
}

function inscrever(callback) {
  if (_dbRef) {
    _dbRef.on("value", (snap) => {
      const val = snap.val();
      if (val) callback({ ...ESTADO_PADRAO, ...val });
    });
    return;
  }
  // Fallback local
  try {
    const bc = new BroadcastChannel(CANAL);
    bc.onmessage = (e) => callback(e.data);
  } catch {}
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try { callback(JSON.parse(e.newValue)); } catch {}
    }
  });
}

// Inicializa Firebase ao carregar o script
inicializarFirebase();
