# Lançamentos Financeiros

Aplicativo de uma única tela para registrar lançamentos financeiros direto em uma planilha do Google Sheets, através de uma API já publicada em Google Apps Script.

Feito em HTML5, CSS3 e JavaScript puro (sem frameworks, sem bibliotecas). Funciona como Progressive Web App (PWA), podendo ser instalado no celular ou no computador.

## Como configurar

1. Abra o arquivo `app.js`.
2. No topo do arquivo, substitua o valor de `API_URL` pela URL da sua API publicada no Google Apps Script:

   ```js
   const API_URL = 'COLE_AQUI_A_URL_DO_APPS_SCRIPT';
   ```

3. Pronto. Nenhum outro ajuste é necessário.

## Estrutura do projeto

```
index.html          Estrutura da tela
style.css            Estilo visual (modo claro e escuro)
app.js               Lógica do formulário e envio para a API
manifest.json        Configuração do PWA
service-worker.js    Cache offline dos arquivos estáticos
icons/               Ícones do app (192px e 512px)
```

## O que o app faz

- Um único formulário com: Valor, Descrição, Categoria, Pessoa e Tipo (Receita/Despesa).
- A data é preenchida automaticamente no formato `AAAA-MM-DD`.
- Ao salvar, os dados são enviados via `fetch()` em JSON, exatamente neste formato:

  ```json
  {
    "data": "2026-07-01",
    "descricao": "Mercado Guanabara",
    "categoria": "Alimentação",
    "pessoa": "Everton",
    "tipo": "Despesa",
    "valor": "153.90"
  }
  ```

- Validação impede o envio de campos vazios ou valor zerado.
- Botão bloqueia e mostra um spinner durante o envio, depois exibe mensagem de sucesso ou erro e limpa o formulário.
- Alternância entre modo claro e escuro, com preferência salva no navegador (`localStorage`).
- Não há histórico, edição, exclusão, gráficos, dashboard ou login — apenas o registro do lançamento, como especificado.

## Publicando no GitHub Pages

1. Crie um repositório novo (pode ser público ou privado, se seu plano permitir Pages).
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. Em **Settings → Pages**, selecione a branch principal e a pasta raiz (`/`).
4. Aguarde alguns minutos e acesse a URL gerada pelo GitHub.
5. No celular, abra o link no navegador e use a opção "Adicionar à tela inicial" para instalar o app.

## Observações sobre a API

Este projeto **não altera o backend**. Ele apenas envia uma requisição `POST` com o corpo em JSON para a URL configurada. Certifique-se de que sua API do Apps Script:

- Aceita requisições `POST`.
- Está publicada com acesso para "Qualquer pessoa" (ou conforme sua necessidade).
- Grava os campos `data`, `descricao`, `categoria`, `pessoa`, `tipo` e `valor` nas colunas correspondentes da planilha.
