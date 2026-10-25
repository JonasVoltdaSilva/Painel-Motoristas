# 🔥 Configuração Firebase — Sincronização entre Dispositivos

Este guia explica como ativar o sync em tempo real entre TVs, computadores, celulares e tablets usando o **Firebase Realtime Database**.

---

## 1. Criar o Projeto no Firebase

1. Acesse: https://console.firebase.google.com
2. Faça login com sua conta Google
3. Clique em **"Adicionar projeto"**
4. Dê um nome (ex: `painel-motoristas`) e continue
5. Desative o Google Analytics (opcional) e crie o projeto

---

## 2. Ativar o Realtime Database

1. No menu esquerdo do Firebase Console, clique em **"Build" → "Realtime Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha uma região próxima de você (ex: `southamerica-east1` para São Paulo)
4. Clique em **Avançar**

---

## 3. Configurar as Regras de Segurança (IMPORTANTE)

Para que qualquer dispositivo possa ler e gravar (sem login Firebase), configure as regras como públicas:

1. No Realtime Database, clique na aba **"Regras"**
2. Substitua tudo por:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

3. Clique em **Publicar**

> ⚠️ **Atenção:** Isso deixa o banco público. Qualquer pessoa com a URL do seu databaseURL pode ler/escrever. Para produção, recomenda-se autenticação Firebase Auth.

---

## 4. Obter as Credenciais do App Web

1. No menu esquerdo, clique no ícone de **engrenagem ⚙️** (ao lado de "Visão geral do projeto")
2. Clique em **"Configurações do projeto"**
3. Role até a seção **"Seus aplicativos"**
4. Clique em **"Adicionar item"** → selecione a ícone da web `</>`
5. Dê um nome ao app (ex: `painel-tv`) e registre
6. Copie o objeto de configuração que aparece (ele contém `apiKey`, `databaseURL`, etc.)

---

## 5. Colar as Credenciais no Projeto

Abra o arquivo `firebase-config.js` na raiz do projeto e substitua o objeto `FIREBASE_CONFIG`:

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "SUA_API_KEY_AQUI",
  authDomain:        "SEU_PROJETO.firebaseapp.com",
  databaseURL:       "https://SEU_PROJETO-default-rtdb.firebaseio.com",
  projectId:         "SEU_PROJETO_ID",
  storageBucket:     "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId:             "SEU_APP_ID"
};
```

> As credenciais que já estão no arquivo são de exemplo e **não funcionarão** para o seu projeto. Você deve colocar as suas próprias.

---

## 6. Como a Sincronização Funciona

Depois de configurado corretamente:

| Ação | O que acontece |
|------|---------------|
| Alguém clica em **Publicar na tela** no controle | Os dados são salvos no Firebase Realtime Database instantaneamente |
| Qualquer TV aberta em outro dispositivo | Recebe a atualização via listener do Firebase em tempo real |
| Qualquer outra aba do navegador | Recebe via `BroadcastChannel` ou evento `storage` |
| Sem internet | Funciona localmente via `localStorage`; quando voltar a internet, sincroniza com o Firebase |

---

## 7. Testar a Sincronização

1. Abra `controle.html` em um computador e faça login (`dpa` / `1234`)
2. Abra `index.html` em outro dispositivo (ou outra aba) — este é o painel TV
3. No controle, selecione uma doca, preencha motorista/placa e clique em **Publicar na tela**
4. O painel TV deve atualizar automaticamente com destaque em tela cheia e som
5. O indicador verde ao lado de "CONTROLE" deve ficar aceso (Firebase conectado)

---

## 8. Solução de Problemas

| Problema | Solução |
|----------|---------|
| O indicador Firebase fica vermelho (desconectado) | Verifique se o `databaseURL` está correto em `firebase-config.js` |
| Dados não aparecem em outros dispositivos | Verifique se as regras do Realtime Database estão como `.read: true, .write: true` |
| Erro ao inicializar Firebase | Confirme que todas as credenciais foram copiadas corretamente |
| Funciona localmente mas não sincroniza | Verifique se há acesso à internet e se o domínio do databaseURL está acessível |

---

## 9. Estrutura de Dados no Firebase

Os dados são salvos no caminho `/painel` do seu Realtime Database:

```json
{
  "painel": {
    "docas": {
      "1": { "status": "AGUARDANDO MOTORISTA", "motorista": "", "placa": "", ... },
      "2": { "status": "CARREGAMENTO", "motorista": "JOÃO SILVA", "placa": "ABC-1234", ... },
      ...
    },
    "historico": [ ... ],
    "versao": 4,
    "atualizadoEm": 1730000000000
  }
}
```

---

## 10. Credenciais de Administrador (Painel Controle)

As credenciais para acessar o painel de controle estão em `firebase-config.js`:

```javascript
const ADMIN_USER = "dpa";
const ADMIN_PASS = "1234";
```

⚠️ Altere essas credenciais antes de usar em produção!

---

## 📁 Arquivos do Projeto

```
Painel-Motoristas-main/
├── firebase-config.js   ← Coloque aqui suas credenciais do Firebase
├── script.js            ← Lógica de sync com Firebase (não editar)
├── index.html           ← Painel TV
├── controle.html        ← Painel administrativo
├── styles.css           ← Estilos da TV
├── controle.css         ← Estilos do controle
├── manifest.json        ← PWA
├── sw.js                ← Service Worker (offline)
├── abrir.bat            ← Atalho Windows
├── FIREBASE_SETUP.md    ← Este arquivo
└── README.md            ← Documentação geral
```

---

Pronto! Com o Firebase configurado, qualquer alteração feita em um dispositivo será refletida em todos os outros em tempo real. 🚀
