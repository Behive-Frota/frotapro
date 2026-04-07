# 🚛 Frota Pro — Gestão de Manutenção de Frota

Sistema web responsivo para gerenciamento de manutenção de frotas de veículos de médio e grande porte.

---

## ✅ Pré-requisitos

Antes de começar, instale o **Node.js** (versão 18 ou superior):

- **Windows / Mac / Linux:** https://nodejs.org/pt  
  → Baixe a versão **LTS** e siga o instalador.

Após instalar, confirme no terminal:
```bash
node --version   # deve exibir v18.x.x ou superior
npm --version    # deve exibir 9.x.x ou superior
```

---

## 🚀 Como instalar e rodar

### 1. Abra o terminal na pasta do projeto

No Windows: clique com o botão direito dentro da pasta `frota-pro` → **"Abrir no Terminal"**  
No Mac/Linux: abra o terminal e navegue até a pasta:
```bash
cd caminho/para/frota-pro
```

### 2. Instale as dependências
```bash
npm install
```
*(Aguarde — pode levar 1 a 2 minutos na primeira vez)*

### 3. Inicie o app
```bash
npm run dev
```

O navegador abrirá automaticamente em **http://localhost:3000**

---

## 📦 Gerar versão de produção (build)

Para gerar os arquivos finais otimizados para hospedar em servidor:
```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`.  
Para testar o build localmente:
```bash
npm run preview
```

---

## 🌐 Como hospedar online (opcional)

### Opção 1 — Vercel (gratuito, recomendado)
1. Crie conta em https://vercel.com
2. Instale o CLI: `npm install -g vercel`
3. Na pasta do projeto, rode: `vercel`
4. Siga as instruções — seu app terá uma URL pública em minutos.

### Opção 2 — Netlify (gratuito)
1. Rode `npm run build`
2. Acesse https://netlify.com
3. Arraste a pasta `dist/` para o painel do Netlify.

---

## 💾 Armazenamento de dados

Os dados são salvos automaticamente no **localStorage** do navegador — funcionam 100% offline.

> ⚠️ Os dados ficam armazenados no navegador do dispositivo. Ao limpar os dados do navegador, os registros serão apagados. Para backup, utilize a exportação em Excel na aba **Relatórios**.

---

## 🔧 Funcionalidades

| Módulo | Descrição |
|---|---|
| **Painel Geral** | Visão geral da frota, alertas urgentes, custos acumulados |
| **Frota** | Cadastro de veículos com placa, marca, modelo, chassi, KM, documentos |
| **Manutenções** | Registro por veículo com peças (dropdown por categoria), urgência, status |
| **Peças** | 8 categorias, +100 peças pré-cadastradas para frota brasileira |
| **Custos** | 3 modos: Peças + Mão de Obra / Nota Fiscal / Combinado |
| **Fotos** | Upload vinculado à manutenção + galeria geral por veículo |
| **Documentos** | Upload de NFs e docs vinculados à manutenção |
| **Alertas** | CRLV, seguro, licença, revisão por KM e por data |
| **Relatórios** | Exportação Excel, impressão em PDF, filtro por período |

---

## 🗂 Estrutura do projeto

```
frota-pro/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx        ← Aplicação principal
│   ├── main.jsx       ← Ponto de entrada React
│   └── index.css      ← Estilos globais
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 📱 Compatibilidade

- ✅ Chrome, Firefox, Edge, Safari (versões modernas)
- ✅ Android (Chrome)
- ✅ iOS (Safari)
- ✅ Responsivo para mobile e desktop
