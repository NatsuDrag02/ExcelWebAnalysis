# Sistema Inteligente de Análise de Dados

Uma aplicação web BI no-code que permite explorar dados de planilhas Excel sem conhecimento técnico.

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 18+ instalado
- pnpm instalado (ou npm/yarn)

### Instalação e Execução

1. **Instalar dependências:**
   ```bash
   pnpm install
   ```
   ou
   ```bash
   npm install
   ```

2. **Rodar em modo desenvolvimento:**
   ```bash
   pnpm dev
   ```
   ou
   ```bash
   npm run dev
   ```

3. **Acessar a aplicação:**
   - Abra seu navegador em: `http://localhost:3000`

## 🧪 Como Testar

### Teste Básico (3 minutos)

1. **Faça upload de um arquivo Excel (.xlsx)**
   - Clique em "Selecionar Arquivo" ou arraste um arquivo Excel
   - O sistema detectará automaticamente:
     - Planilhas (abas)
     - Colunas e tipos de dados
     - Papéis (dimensão/métrica)

2. **Crie um gráfico:**
   - Vá para a aba "Visualizações"
   - Escolha uma **Dimensão** (ex: categoria, região, data)
   - Escolha uma **Métrica** (ex: valores, quantidades) ou use "Contagem de registros"
   - Selecione uma **Agregação** (soma, média, máximo, mínimo)
   - Escolha o **Tipo de Gráfico** (barras, linhas, pizza, área)
   - Veja a explicação em linguagem natural do gráfico

3. **Aplique filtros:**
   - Clique em "Filtros" no cabeçalho
   - Adicione um grupo de filtros
   - Selecione coluna, operador e valor
   - Veja os dados filtrados atualizarem automaticamente

### Teste com Dados de Exemplo

Você pode criar um arquivo Excel simples para testar:

**Exemplo de planilha (Vendas.xlsx):**
```
Categoria    | Data       | Valor    | Quantidade
Eletrônicos  | 2024-01-01 | 1500.00  | 5
Eletrônicos  | 2024-01-02 | 2300.00  | 8
Roupas       | 2024-01-01 | 800.00   | 12
Roupas       | 2024-01-02 | 1200.00  | 15
Casa         | 2024-01-01 | 500.00   | 3
```

**Teste sugerido:**
- Dimensão: "Categoria"
- Métrica: "Valor"
- Agregação: "Soma"
- Tipo: "Barras"

## ✨ Funcionalidades

- ✅ Upload de arquivos XLSX de qualquer estrutura
- ✅ Detecção automática de tipos de dados
- ✅ Inferência de papéis (dimensão/métrica)
- ✅ Criação de gráficos no-code
- ✅ Filtros visuais dinâmicos
- ✅ Explicações em linguagem natural
- ✅ Sugestões inteligentes de combinações
- ✅ Validação de configurações
- ✅ Interface adaptativa e intuitiva

## 📁 Estrutura do Projeto

```
intelligent-data-system/
├── app/                    # Páginas Next.js
├── components/             # Componentes React
│   ├── ui/                # Componentes de UI base
│   ├── data-visualization.tsx  # Sistema de gráficos
│   ├── filter-panel.tsx    # Painel de filtros
│   └── ...
├── lib/                    # Lógica de negócio
│   ├── excel-parser.ts    # Parser de Excel
│   ├── chart-utils.ts     # Utilitários de gráficos
│   ├── filter-engine.ts   # Motor de filtros
│   └── types.ts           # Tipos TypeScript
└── public/                # Arquivos estáticos
```

## 🛠️ Scripts Disponíveis

- `pnpm dev` - Inicia servidor de desenvolvimento
- `pnpm build` - Cria build de produção
- `pnpm start` - Inicia servidor de produção
- `pnpm lint` - Executa linter

## 📝 Notas

- O sistema funciona completamente no navegador (client-side)
- Não há necessidade de servidor backend
- Dados não são enviados para servidores externos
- Suporta arquivos Excel com múltiplas planilhas

## 🐛 Problemas Comuns

**Erro ao instalar dependências:**
- Certifique-se de ter Node.js 18+ instalado
- Tente limpar cache: `pnpm store prune` ou `npm cache clean --force`

**Erro ao rodar:**
- Verifique se a porta 3000 está livre
- Tente rodar em outra porta: `pnpm dev -- -p 3001`

**Arquivo Excel não carrega:**
- Verifique se o arquivo é .xlsx ou .xls
- Certifique-se de que o arquivo não está corrompido
- Tente com um arquivo menor primeiro


