// ════════════════════════════════════════════════════════════════════════════════
//  PAINEL DE MOTORISTAS — firebase-config.js (REDESIGN COMPLETO)
//  Configuração Firebase + credenciais admin + constantes de design
// ════════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
//  FIREBASE — Realtime Database
//  Para sincronização entre dispositivos (opcional)
// ─────────────────────────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDeUWiCEDPsYD7LpY8IyHUdeHkGabyBjgg",
  authDomain:        "painel-motoristas-efe38.firebaseapp.com",
  databaseURL:       "https://painel-motoristas-efe38-default-rtdb.firebaseio.com",
  projectId:         "painel-motoristas-efe38",
  storageBucket:     "painel-motoristas-efe38.firebasestorage.app",
  messagingSenderId: "437345440728",
  appId:             "1:437345440728:web:fc3f3b6f6f6089851698ad",
  measurementId:     "G-V7HF4JGCQ0"
};

// ─────────────────────────────────────────────────────────────────────────────
//  CREDENCIAIS DE ADMINISTRADOR
//  ⚠️ ALTERAR ANTES DE USAR EM PRODUÇÃO!
//  Usuário: dpa   |   Senha: 1234
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_USER = "dpa";
const ADMIN_PASS = "1234";

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURAÇÕES DE SEGURANÇA E COMPORTAMENTO
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  MAX_TENTATIVAS_LOGIN: 5,
  TEMPO_BLOQUEIO_MIN: 15,
  AUTO_LOGOUT_MIN: 60,
  SALT_SENHA: "painel-motoristas-v3-salt",
  DESTAQUE_DURACAO_MS: 5000,
  DESTAQUE_SOM_REFORCO_MS: 2500,
  ROTACAO_PAGINA_MS: 6000,
  POLLING_INTERVALO_MS: 2000
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTES DO PROJETO
// ─────────────────────────────────────────────────────────────────────────────
const DOCA_IDS = ["1","2","3","4","5","6","7","8","9","10","11","12"];

const TIPOS_VEICULO = ["CARRETA", "TRUCK", "VAN", "BITRUCK", "RODOTREM", "VUC"];

const STATUS_OPCOES = [
  { valor: "AGUARDANDO MOTORISTA",  classe: "aguardando",  cor: "#F5B731" },
  { valor: "CARREGAMENTO",          classe: "carregando",  cor: "#4BA9F2" },
  { valor: "CARREGAMENTO FINALIZADO", classe: "carregamento-finalizado", cor: "#4BA9F2" },
  { valor: "DESCARREGAMENTO",       classe: "descargando", cor: "#4BA9F2" },
  { valor: "DESCARREGAMENTO FINALIZADO", classe: "descarga-finalizada", cor: "#4BA9F2" },
  { valor: "EM CONFERÊNCIA",        classe: "conferencia", cor: "#F07B3B" },
  { valor: "LIBERADO",              classe: "liberado",    cor: "#00FF9D" }
];

// ─────────────────────────────────────────────────────────────────────────────
//  MAPA DE CORES POR STATUS (para uso no CSS e JS)
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CORES = {
  "AGUARDANDO MOTORISTA":  "#F5B731",
  "CARREGAMENTO":          "#4BA9F2",
  "CARREGAMENTO FINALIZADO": "#4BA9F2",
  "DESCARREGAMENTO":       "#4BA9F2",
  "DESCARREGAMENTO FINALIZADO": "#4BA9F2",
  "EM CONFERÊNCIA":        "#F07B3B",
  "LIBERADO":              "#00FF9D"
};

const STORAGE_KEY   = "painel-motoristas:v4";
const SESSION_KEY   = "painel-motoristas:session";
const CANAL         = "painel-motoristas";
const EXPORT_NAME   = "painel-motoristas-backup";

// ─────────────────────────────────────────────────────────────────────────────
//  ESTADO PADRÃO
// ─────────────────────────────────────────────────────────────────────────────
const DOCA_PADRAO = {
  status:     "AGUARDANDO MOTORISTA",
  motorista:  "",
  placa:      "",
  veiculo:    "",
  tipo:       "CARRETA",
  paletizada: false,
  atualizadoEm: null
};

const ESTADO_PADRAO = {
  docas:     Object.fromEntries(DOCA_IDS.map(id => [id, { ...DOCA_PADRAO }])),
  historico: [],
  versao: 4,
  atualizadoEm: Date.now()
};
