// ────────── ESTADO INICIAL ──────────
const ESTADO_PADRAO = {
  doca:        "01",
  status:      "CARREGAMENTO FINALIZADO",
  motorista:   "ARIANA GRANDE",
  placa:       "6969-ARI",
  veiculo:     "POP STAR",
  tipo:        "CARRETA",       // CARRETA, TRUCK, VAN, ...
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
const CANAL       = "painel-motoristas";

// ────────── PERSISTÊNCIA ──────────
function carregar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...ESTADO_PADRAO };
    return { ...ESTADO_PADRAO, ...JSON.parse(raw) };
  } catch {
    return { ...ESTADO_PADRAO };
  }
}

function salvar(estado) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  try {
    const bc = new BroadcastChannel(CANAL);
    bc.postMessage(estado);
    bc.close();
  } catch {}
}

// ────────── INSCRIÇÃO EM MUDANÇAS ──────────
function inscrever(callback) {
  // mesma janela / outras abas: BroadcastChannel
  try {
    const bc = new BroadcastChannel(CANAL);
    bc.onmessage = (e) => callback(e.data);
  } catch {}
  // fallback: evento storage (outras abas no mesmo browser)
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try { callback(JSON.parse(e.newValue)); } catch {}
    }
  });
}
