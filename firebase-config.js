// ══════════════════════════════════════════════════════
//  CONFIGURAÇÃO — Painel de Motoristas
// ══════════════════════════════════════════════════════
//
//  PARA ATIVAR SYNC ENTRE DISPOSITIVOS:
//  1. Acesse https://console.firebase.google.com
//  2. Crie um projeto gratuito
//  3. Adicione um app Web → copie as credenciais abaixo
//  4. Vá em "Realtime Database" → Criar banco de dados
//  5. Nas Regras, cole e publique:
//       { "rules": { ".read": true, ".write": true } }
//
//  Se databaseURL ficar vazio, o painel funciona apenas
//  localmente (sem sync entre dispositivos).
// ══════════════════════════════════════════════════════

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDeUWiCEDPsYD7LpY8IyHUdeHkGabyBjgg",
  authDomain:        "painel-motoristas-efe38.firebaseapp.com",
  databaseURL:       "https://painel-motoristas-efe38-default-rtdb.firebaseio.com",
  projectId:         "painel-motoristas-efe38",
  storageBucket:     "painel-motoristas-efe38.firebasestorage.app",
  messagingSenderId: "437345440728",
  appId:             "1:437345440728:web:fc3f3b6f6f6089851698ad"
};

// Credenciais de administrador — altere aqui
const ADMIN_USER = "dpa";
const ADMIN_PASS = "1234";
