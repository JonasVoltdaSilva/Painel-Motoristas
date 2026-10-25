// ════════════════════════════════════════════════════════════════════════════════
//  PAINEL DE MOTORISTAS — script.js (REDESIGN COMPLETO v4)
//  Lógica compartilhada: Auth, Armazenamento, Firebase, Sync, Validações
// ════════════════════════════════════════════════════════════════════════════════

// ────────── SEGURANÇA / AUTH ──────────
let tentativasLogin = 0;
let bloqueadoAte = 0;

function estaBloqueado() {
  return Date.now() < bloqueadoAte;
}

function tempoRestanteBloqueio() {
  return Math.ceil((bloqueadoAte - Date.now()) / 1000 / 60);
}

function resetarTentativas() {
  tentativasLogin = 0;
  bloqueadoAte = 0;
}

function registrarFalhaLogin() {
  tentativasLogin++;
  if (tentativasLogin >= CONFIG.MAX_TENTATIVAS_LOGIN) {
    bloqueadoAte = Date.now() + CONFIG.TEMPO_BLOQUEIO_MIN * 60 * 1000;
  }
}

async function hashSenha(senha) {
  const salt = CONFIG.SALT_SENHA;
  const buf  = new TextEncoder().encode(String(salt + senha || ""));
  const hBuf = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verificarLogin(usuario, senha) {
  if (estaBloqueado()) return "bloqueado";
  const u    = (usuario || "").toLowerCase().trim();
  const user = typeof ADMIN_USER !== "undefined" ? ADMIN_USER : "dpa";
  const pass = typeof ADMIN_PASS !== "undefined" ? ADMIN_PASS : "";
  const [senhaH, passH] = await Promise.all([hashSenha(senha), hashSenha(pass)]);
  if (u === user && senhaH === passH) {
    resetarTentativas();
    return "admin";
  }
  registrarFalhaLogin();
  return null;
}

function salvarSessao(tipo) {
  sessionStorage.setItem(SESSION_KEY, tipo);
  sessionStorage.setItem("painel-motoristas:login-at", Date.now().toString());
}
function tipoSessao()       { return sessionStorage.getItem(SESSION_KEY); }
function deslogar()         { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem("painel-motoristas:login-at"); }

function sessaoExpirada() {
  const at = sessionStorage.getItem("painel-motoristas:login-at");
  if (!at) return true;
  return Date.now() - parseInt(at, 10) > CONFIG.AUTO_LOGOUT_MIN * 60 * 1000;
}

// ────────── VALIDAÇÕES ──────────
function validarPlaca(placa) {
  if (!placa) return true;
  const p = placa.replace(/\s/g, "").toUpperCase();
  const padraoMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  const padraoAntigo   = /^[A-Z]{3}-?[0-9]{4}$/;
  return padraoMercosul.test(p) || padraoAntigo.test(p);
}

function formatarPlaca(placa) {
  if (!placa) return "";
  const p = placa.replace(/\s/g, "").toUpperCase();
  if (/^[A-Z]{3}[0-9]{4}$/.test(p)) return p.slice(0,3) + "-" + p.slice(3);
  return p;
}

// ────────── ARMAZENAMENTO ──────────
function normalizarEstado(raw) {
  const docas = {};
  DOCA_IDS.forEach(id => {
    docas[id] = { ...DOCA_PADRAO, ...((raw?.docas || {})[id] || {}) };
  });
  return {
    docas,
    historico: Array.isArray(raw?.historico) ? raw.historico : [],
    versao: raw?.versao || 4,
    atualizadoEm: raw?.atualizadoEm || Date.now()
  };
}

function carregar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizarEstado(raw ? JSON.parse(raw) : null);
  } catch {
    return normalizarEstado(null);
  }
}

function exportarJSON() {
  const estado = carregar();
  const blob = new Blob([JSON.stringify(estado, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${EXPORT_NAME}-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target.result);
        const estado = normalizarEstado(dados);
        _salvarLocal(estado);
        resolve(estado);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    reader.readAsText(file);
  });
}

// ────────── FIREBASE + SYNC ──────────
let _dbRef         = null;
let _firebaseAtivo = false;
let _bc            = null;
let _ultimoFirebaseError = null;

function inicializarFirebase() {
  try {
    const cfg = typeof FIREBASE_CONFIG !== "undefined" ? FIREBASE_CONFIG : null;
    if (!cfg || !cfg.databaseURL) return false;
    if (!firebase?.initializeApp) return false;

    // Evita reinicializar o Firebase se já estiver ativo
    if (_firebaseAtivo && _dbRef) return true;

    // Se já existe uma app inicializada, reutiliza; senão, inicializa nova
    let app;
    try {
      app = firebase.app();
    } catch {
      app = firebase.initializeApp(cfg);
    }

    _dbRef = firebase.database().ref("/painel");
    _firebaseAtivo = true;
    return true;
  } catch (e) {
    _ultimoFirebaseError = e;
    _firebaseAtivo = false;
    return false;
  }
}

function _salvarLocal(estado) {
  const payload = { ...estado, _ts: Date.now(), atualizadoEm: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  try {
    if (_bc) _bc.postMessage(payload);
  } catch {}
}

function salvar(estado) {
  _salvarLocal(estado);
  if (_dbRef) {
    _dbRef.set(estado).catch((e) => {
      _ultimoFirebaseError = e;
      console.warn("Firebase sync falhou:", e);
    });
  }
}

function inscrever(callback) {
  let _ultimoJson = localStorage.getItem(STORAGE_KEY) || "";

  if (_dbRef) {
    _dbRef.on("value", (snap) => {
      const val = snap.val();
      if (!val) return;
      try { _ultimoJson = localStorage.getItem(STORAGE_KEY) || ""; } catch {}
      callback(normalizarEstado(val));
    }, (err) => {
      _ultimoFirebaseError = err;
      console.warn("Firebase listener error:", err);
    });
  }

  try {
    _bc = new BroadcastChannel(CANAL);
    _bc.onmessage = (e) => {
      try {
        _ultimoJson = localStorage.getItem(STORAGE_KEY) || "";
        callback(normalizarEstado(e.data));
      } catch {}
    };
  } catch {}

  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      _ultimoJson = e.newValue;
      callback(normalizarEstado(JSON.parse(e.newValue)));
    } catch {}
  });

  setInterval(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "";
      if (!raw || raw === _ultimoJson) return;
      _ultimoJson = raw;
      callback(normalizarEstado(JSON.parse(raw)));
    } catch {}
  }, CONFIG.POLLING_INTERVALO_MS);
}

function filtrarHistorico(historico, { doca = "", status = "", busca = "" } = {}) {
  return (historico || []).filter(h => {
    const okDoca  = !doca  || String(h.doca)  === doca;
    const okStat  = !status || (h.status || "").toUpperCase().includes(status.toUpperCase());
    const okBusca = !busca || (h.motorista || "").toUpperCase().includes(busca.toUpperCase()) ||
                   (h.placa || "").toUpperCase().includes(busca.toUpperCase());
    return okDoca && okStat && okBusca;
  });
}

inicializarFirebase();
