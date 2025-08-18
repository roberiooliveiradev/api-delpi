# server.js — Documentação Técnica (Inicialização da API)

> **Arquivo fonte:** `server.js`  
> **Stack:** Node.js + Express

---

## Objetivo

Responsável por inicializar a API DELPI, importando o `app` configurado em `app.js` e executando o **listener** HTTP na porta definida via variável de ambiente `PORT` (ou `3000` por padrão).

---

## Código

```js
import app from "./app.js";

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API de DELPI está online em http://localhost:${PORT}`);
});
```

---

## Funcionamento

1. Importa o **Express app** configurado em `app.js` (com rotas, middlewares e Swagger UI).
2. Define a porta:
   - `process.env.PORT` (se definida no `.env` ou ambiente de execução).
   - `3000` como fallback padrão.
3. Executa `app.listen` para abrir o servidor HTTP.
4. Exibe log no console indicando a URL da API.

---

## Diferença em relação ao `app.js`

- `app.js` **não chama** `listen` — apenas configura middlewares e rotas.
- `server.js` é o ponto de **entrada real** da aplicação, mantendo clara a separação entre:
  - Configuração do servidor (`app.js`).
  - Inicialização/execução (`server.js`).

---

## Exemplo de Execução

```bash
# Desenvolvimento
npm run start

# Produção (exemplo)
PORT=8080 node server.js
```

---

## Próximos Passos

- Adicionar **tratamento global de erros não capturados** (ex.: `process.on('uncaughtException')`, `process.on('unhandledRejection')`).
- Permitir inicialização com HTTPS quando necessário (TLS).  
- Integrar com **PM2** ou **Docker** para orquestração em produção.

