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

// ────────── HASH SHA-256 ──────────
async function hashSenha(senha) {
  const buf    = new TextEncoder().encode(String(senha || ""));
  const hBuf   = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ────────── CONFIG (senhas como hash — nunca em texto puro) ──────────
const CONFIG_KEY = "painel-motoristas:config:v1";

async function getConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const cfg = JSON.parse(raw);
      if (cfg.adminHash && cfg.viewerHash) return cfg;
    }
  } catch {}
  if (_dbRef) {
    try {
      const snap = await firebase.database().ref("/config").once("value");
      const cfg  = snap.val();
      if (cfg?.adminHash && cfg?.viewerHash) {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
        return cfg;
      }
    } catch {}
  }
  return null;
}

async function salvarConfig(adminPass, viewerPass) {
  const [adminHash, viewerHash] = await Promise.all([hashSenha(adminPass), hashSenha(viewerPass)]);
  const cfg = { adminHash, viewerHash };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  if (_dbRef) firebase.database().ref("/config").set(cfg).catch(() => {});
  return cfg;
}

async function precisaConfigurar() {
  return !(await getConfig());
}

// ────────── AUTH ──────────
async function verificarLogin(usuario, senha) {
  const cfg = await getConfig();
  if (!cfg) return null;
  const h = await hashSenha(senha);
  const u = (usuario || "").toLowerCase().trim();
  const adminUser  = typeof ADMIN_USER  !== "undefined" ? ADMIN_USER  : "dpa";
  const viewerUser = typeof VIEWER_USER !== "undefined" ? VIEWER_USER : "visualizar";
  if (u === adminUser  && h === cfg.adminHash)  return "admin";
  if (u === viewerUser && h === cfg.viewerHash) return "viewer";
  return null;
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
