# app.js — Documentação Técnica (Bootstrap da API)

> **Arquivo fonte:** `app.js`  
> **Stack:** Node.js + Express + CORS + dotenv + JWT + Swagger UI

---

## Objetivo

Inicializar o servidor HTTP, aplicar **middlewares globais**, montar os **routers** de sistema/produtos com seus **prefixos**, configurar **JWT** com exceções para endpoints públicos e expor a documentação **Swagger UI**.

---

## Visão Geral

```js
import "dotenv/config";
import express from "express";
import cors from "cors";
import systemRouter from "./routes/systemRoutes.js";
import productRouter from "./routes/productRoutes.js";
import { jwtAuth } from "./middlewares/jwtAuth.js";

import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import yaml from "yaml";
import fs from "fs";
```

---

## Principais Alterações

- **Autenticação JWT global** adicionada via middleware `jwtAuth`, com exceções configuradas (`/health`, `/api/docs`, `/api/openapi.json`).
- **Swagger UI** configurado para servir a documentação OpenAPI a partir de `docs-api/openapi.yaml`, com fallback mínimo em caso de falha.
- **Exportação de `app` sem `listen`**, facilitando **testes unitários** e integração.

---

## Endpoints Globais

| Recurso      | Caminho Base          | Observações                                     |
| ------------ | --------------------- | ----------------------------------------------- |
| Sistema      | `/api/system`         | Inspeção do catálogo do SQL Server              |
| Produtos     | `/api/products`       | Consulta de produtos e estrutura                |
| Healthcheck  | `/health`             | Retorna `200 OK` sem autenticação               |
| OpenAPI JSON | `/api/openapi.json`   | Retorna o documento OpenAPI em JSON             |
| Swagger UI   | `/api/docs`           | Interface interativa para documentação da API   |

---

## Middlewares

- `express.json()` — parse de corpo JSON.
- `cors()` — habilita CORS (qualquer origem por padrão; restringir em produção).
- `jwtAuth` — middleware de autenticação JWT global, com **publicPaths** configuráveis.

Exemplo de configuração do `jwtAuth`:

```js
app.use(
    jwtAuth({
        publicPaths: ["/health", "/api/docs", "/api/openapi.json"],
    })
);
```

---

## Documentação Swagger

- A documentação OpenAPI é carregada de `docs-api/openapi.yaml`.
- Caso o arquivo não seja encontrado, um fallback mínimo (`openapi: 3.0.3`) é usado.
- Endpoints:
  - `/api/docs` → Swagger UI
  - `/api/openapi.json` → Documento OpenAPI cru

---

## Healthcheck

Endpoint público para verificação de status:

```bash
curl -i http://localhost:3000/health
# → API DELPI online e saudável!
```

---

## Execução

> **Importante:** o arquivo **não chama** `app.listen` diretamente.  
> Isso facilita **testes unitários** (importando `app` em Jest, Mocha, etc.).  
> A inicialização deve ser feita em outro arquivo, por exemplo:

```js
// server.js
import app from "./app.js";
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API DELPI rodando em http://localhost:${PORT}`);
});
```

---

## Próximos Passos

1. Padronizar **tratamento global de erros** e respostas.
2. Adicionar **rate limiting** e headers de segurança (helmet).
3. Integrar métricas e logs estruturados.
4. Validar esquema OpenAPI com CI/CD.
