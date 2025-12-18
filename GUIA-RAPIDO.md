# 🚀 Guia Rápido - Como Rodar e Testar

## Passo 1: Instalar Dependências

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

**Ou se tiver pnpm instalado:**
```bash
pnpm install
```

⏱️ Isso pode levar 1-2 minutos na primeira vez.

---

## Passo 2: Iniciar o Servidor

Após instalar as dependências, execute:

```bash
npm run dev
```

**Ou com pnpm:**
```bash
pnpm dev
```

Você verá uma mensagem como:
```
✓ Ready in 2.3s
○ Local:        http://localhost:3000
```

---

## Passo 3: Abrir no Navegador

Abra seu navegador e acesse:
```
http://localhost:3000
```

---

## 🧪 Teste Rápido (3 minutos)

### 1. Faça Upload de um Excel
- Clique em "Selecionar Arquivo" ou arraste um arquivo .xlsx
- Aguarde o processamento (você verá mensagens de progresso)

### 2. Crie um Gráfico
- Vá para a aba **"Visualizações"**
- **Agrupar por:** Escolha uma coluna (ex: categoria, região)
- **Mostrar:** Escolha uma métrica numérica ou "Contagem de registros"
- **Agregação:** Escolha soma, média, máximo, mínimo ou contagem
- **Tipo de Gráfico:** Escolha barras, linhas, pizza ou área
- Veja a explicação em linguagem natural aparecer!

### 3. Aplique Filtros
- Clique no botão **"Filtros"** no topo
- Clique em **"Adicionar Grupo de Filtros"**
- Selecione uma coluna, operador e valor
- Veja os dados filtrados atualizarem automaticamente

---

## 📊 Exemplo de Planilha para Testar

Crie um arquivo Excel chamado `teste.xlsx` com:

| Categoria    | Data       | Valor    | Quantidade |
|-------------|------------|----------|------------|
| Eletrônicos | 2024-01-01 | 1500.00  | 5          |
| Eletrônicos | 2024-01-02 | 2300.00  | 8          |
| Roupas      | 2024-01-01 | 800.00   | 12         |
| Roupas      | 2024-01-02 | 1200.00  | 15         |
| Casa        | 2024-01-01 | 500.00   | 3          |

**Teste sugerido:**
- Dimensão: `Categoria`
- Métrica: `Valor`
- Agregação: `Soma`
- Tipo: `Barras`

Resultado esperado: Um gráfico mostrando a soma de valores por categoria!

---

## ⚠️ Problemas?

**Erro ao instalar:**
- Certifique-se de ter Node.js instalado: `node --version` (deve ser 18+)
- Tente limpar cache: `npm cache clean --force`

**Porta 3000 ocupada:**
- Pare outros servidores ou use outra porta: `npm run dev -- -p 3001`

**Arquivo não carrega:**
- Verifique se é .xlsx ou .xls
- Tente com um arquivo menor primeiro

---

## ✅ Checklist de Teste

- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor rodando (`npm run dev`)
- [ ] Aplicação aberta no navegador (localhost:3000)
- [ ] Upload de arquivo Excel funcionando
- [ ] Gráfico criado com sucesso
- [ ] Filtros aplicados e funcionando
- [ ] Explicação em linguagem natural aparecendo

**Se todos os itens estão marcados, o sistema está funcionando perfeitamente! 🎉**


