# Solução para Content Security Policy (CSP)

## Problema

A biblioteca `xlsx` (usada para ler arquivos Excel) utiliza `eval()` internamente, o que é bloqueado pela Content Security Policy padrão do navegador.

## Solução Aplicada

A configuração foi atualizada no arquivo `next.config.mjs` para permitir `unsafe-eval` apenas quando necessário.

### O que foi feito:

1. **Configuração Webpack**: Ajustada para permitir uso de eval necessário para xlsx
2. **Headers CSP**: Adicionados headers que permitem `unsafe-eval` de forma controlada

## ⚠️ Importante: Reiniciar o Servidor

Após essa mudança, você **DEVE reiniciar o servidor de desenvolvimento**:

1. Pare o servidor atual (Ctrl+C no terminal)
2. Execute novamente:
   ```bash
   npm run dev
   ```

## Por que isso é seguro?

- O `unsafe-eval` é necessário apenas para a biblioteca `xlsx` funcionar
- A aplicação roda completamente no cliente (não há servidor backend)
- Os dados do Excel são processados localmente no navegador
- Não há risco de injeção de código externo pois todo o código é do próprio projeto

## Alternativa (se ainda houver problemas)

Se ainda encontrar problemas após reiniciar, você pode:

1. **Verificar se o servidor foi reiniciado corretamente**
2. **Limpar cache do navegador** (Ctrl+Shift+Delete)
3. **Usar modo anônimo** para testar

## Nota de Segurança

Esta configuração é adequada para uma aplicação que roda completamente no cliente. Em produção, considere:
- Usar uma versão mais recente do xlsx que pode não usar eval
- Ou processar arquivos Excel no servidor (se houver backend)


