# 📘 Documentação da API DELPI

> Projeto Node.js + Express + SQL Server com autenticação JWT, Swagger UI e repositórios genéricos.

---

## 📂 Estrutura da Documentação

### 🔹 Documentação OpenAPI
- [OpenAPI (Swagger)](openapi.md)

### 🔹 Aplicação
- [app.js](app.md) — Configuração principal do Express e Swagger.
- [server.js](server.md) — Ponto de entrada (listener).

### 🔹 Middlewares
- [jwtAuth.js](jwtAuth.md) — Autenticação JWT (Bearer).
- [middlewares diversos](middlewares.md) — AsyncHandler, Validate (Zod), ErrorHandler, Logger, CORS, Security, etc.

### 🔹 Repositórios (Repository Layer)
- [db.js](db.md) — Conexão global com SQL Server.
- [BaseRepository.js](BaseRepository.md) — Repositório genérico com paginação, filtros e orderBy seguro.
- [ProductRepository.js](ProductRepository.md) — Consultas a produtos (SB1010) e estrutura (SG1010).
- [SystemRepository.js](SystemRepository.md) — Consulta de metadados do SQL Server (tabelas/colunas).

### 🔹 Rotas (Routes Layer)
- [productRoutes.js](productRoutes.md) — Endpoints `/api/products` (paginação, grupos, estruturas).
- [systemRoutes.js](systemRoutes.md) — Endpoints `/api/system` (tabelas e colunas).

---

## 🚀 Principais Funcionalidades

- **Autenticação JWT global** com exceções configuráveis.
- **Consulta de produtos** (`/api/products`) com filtros, paginação e ordenação múltipla.
- **Estrutura recursiva de produtos (BOM)** a partir de `SG1010`.
- **Inspeção do catálogo SQL Server** (`/api/system`).
- **Swagger UI** em `/api/docs` + endpoint OpenAPI JSON em `/api/openapi.json`.
- **Healthcheck público** (`/health`).

---

## 🔒 Segurança

- Autenticação com **JWT (Bearer)** obrigatória em quase todos os endpoints.  
- Middlewares de proteção: CORS restritivo, Helmet, Rate Limiting.  
- Logs estruturados com `pino-http` + `requestId`.  
- Tratamento de erros padronizado (`ApiError`).

---

## 🛠️ Boas Práticas Implementadas

- **Separação de responsabilidades**: app.js (configuração) vs. server.js (execução).  
- **Repositório genérico (BaseRepository)** com filtros estendidos (`eq`, `like`, `in`, `gte`, `lte`).  
- **Validação declarativa com Zod** para rotas.  
- **Documentação sincronizada com OpenAPI 3.0.3**.  
- **Fallback seguro** para Swagger se `openapi.yaml` não for encontrado.

---

## 📌 Próximos Passos

- Adicionar suporte a **refresh tokens** e roles/permissions.  
- Expandir endpoints de catálogo para incluir **constraints e FKs**.  
- Criar cache para consultas repetidas (Redis/memory).  
- Integração CI/CD para validar e publicar OpenAPI automaticamente.  
- Testes unitários e de integração (Jest/Mocha).

---

## 📑 Referências

- Swagger UI: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)  
- Healthcheck: [http://localhost:3000/health](http://localhost:3000/health)  

