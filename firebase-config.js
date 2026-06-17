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
  apiKey:            "",
  authDomain:        "",
  databaseURL:       "",
  projectId:         "",
  storageBucket:     "",
  messagingSenderId: "",
  appId:             ""
};

// Usuários (não são segredos — senhas são definidas no primeiro acesso)
const ADMIN_USER  = "dpa";
const VIEWER_USER = "visualizar";
