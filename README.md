# Painel de Motoristas — Redesign Completo v4

Painel profissional de controle de docas de carga e descarga para motoristas, com tela TV (exibição) e painel administrativo (controle).

## 📁 Estrutura do Projeto

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Painel TV — exibição de status das 12 docas |
| `controle.html` | Painel administrativo — cadastro/edição de docas |
| `script.js` | Lógica compartilhada (auth, Firebase, sync, validações) |
| `styles.css` | Design system do painel TV |
| `controle.css` | Estilos do painel de controle |
| `firebase-config.js` | Config Firebase + credenciais admin + constantes |
| `manifest.json` | Manifesto PWA |
| `sw.js` | Service Worker (offline) |
| `abrir.bat` | Script para abrir no Windows |
| `backup-original/` | Cópia dos arquivos originais |
| `referencias-design/` | Referências de UX/Design baixadas do GitHub |

## 🔐 Credenciais do Administrador

⚠️ **Altere antes de usar em produção!**

No arquivo `firebase-config.js`:
```
Usuário: dpa
Senha: 1234
```

## 🚀 Funcionalidades

### Segurança
- Hash SHA-256 com salt para senhas
- Bloqueio após 5 tentativas de login falhas (15 min)
- Auto-logout após 60 min de inatividade
- Confirmação ao sair com dados não salvos

### Painel TV
- Grid de 12 docas com rotação automática (6s por página)
- Contador de docas livres/ocupadas
- Histórico de últimos atendimentos
- Relógio em tempo real
- Modo tela cheia (F11)
- Destaque em tela cheia ao publicar (5s + som)
- Navegação automática para a página da doca alterada
- PWA: instalável como app, funciona offline

### Painel Admin
- Validação de placa brasileira (ABC-1234 / ABC1D23 Mercosul)
- Formatação automática de placa
- Exportar / Importar dados em JSON
- Histórico editável
- Indicador de conexão Firebase
- Status de publicação (pendente / salvando / publicado)

## 🎨 Design

- Tipografia hierárquica (doca → status → nome gigante → placa → tipo)
- Paleta escura com acents verde neon, amarelo e azul
- Animações suaves (expandir, glow, fade-in)
- Efeito vidro (glassmorphism)
- Responsivo para TVs e mobile
- Suporte a prefers-reduced-motion

## 📦 Instalação PWA

1. Abra `index.html` em Chrome/Edge
2. Clique no ícone de instalação na barra de endereços
3. O app será instalado e funcionará offline

## 🔥 Firebase — Sincronização entre Dispositivos (Opcional)

Para que qualquer alteração em um dispositivo seja refletida em todos os outros em tempo real, configure o Firebase Realtime Database.

**Consulte o guia completo:** [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md)

**Resumo rápido:**
1. Acesse https://console.firebase.google.com e crie um projeto
2. Ative o Realtime Database
3. Defina as regras como: `{ "rules": { ".read": true, ".write": true } }`
4. Crie um app Web e copie as credenciais para `firebase-config.js`
5. Sem o Firebase, o sistema funciona apenas localmente (sem sync entre dispositivos)


## 🛠️ Como Usar

1. Dê duplo clique em `abrir.bat` para abrir o painel TV
2. Clique no ícone de cadeado (canto inferior direito) para acessar o admin
3. Use `controle.html` para editar as docas e publicar na tela

## 📄 Licença

Livre para uso e modificação.
