# productRoutes.js — Documentação Técnica (Rotas de Produtos)

> **Arquivo fonte:** `routes/productRoutes.js`  
> **Stack:** Node.js + Express + Zod + Middlewares customizados (`asyncHandler`, `validate`, `errorHandler`)  
> **Depende de:** `ProductRepository.js`

---

## Objetivo

Expor rotas REST para consulta de **produtos** e suas estruturas no Protheus, com:

- **Paginação e ordenação múltipla** (`page`, `limit`, `orderBy`).
- **Validação de parâmetros e query** via **Zod**.
- **Tratamento assíncrono** com `asyncHandler`.
- **Padronização de erros** com `ApiError`.

---

## Rotas Disponíveis

### 1. `GET /api/products`

Lista produtos paginados.

- **Query Params**
  - `page` → número da página (mín. 1, padrão 1).
  - `limit` → tamanho da página (1–200, padrão 50).
  - `orderBy` → CSV de colunas, com direção opcional (`ASC`/`DESC`).  
    Ex.: `B1_COD`, `B1_DESC desc`, `B1_GRUPO asc,B1_COD asc`.

- **Exemplo de Requisição**
  ```bash
  curl -X GET "http://localhost:3000/api/products?page=2&limit=20&orderBy=B1_DESC desc"
  ```

- **Resposta de Sucesso (200)**
  ```json
  {
    "data": [
      { "B1_GRUPO": "CONEXOES", "B1_COD": "DL000001", "B1_DESC": "Terminal 1 via", "B1_TIPO": "ACABADO" }
    ],
    "page": 2,
    "limit": 20,
    "total": 123
  }
  ```

---

### 2. `GET /api/products/code/:code`

Retorna **um produto específico** pelo código, incluindo a **estrutura recursiva (BOM)**.

- **Parâmetros de Path**
  - `code` → código do produto (obrigatório).

- **Exemplo de Requisição**
  ```bash
  curl -X GET "http://localhost:3000/api/products/code/DL000123"
  ```

- **Resposta de Sucesso (200)**
  ```json
  {
    "B1_COD": "DL000123",
    "B1_DESC": "Conector ABC 2 vias",
    "B1_GRUPO": "CONEXOES",
    "structureProduct": [
      { "G1_COD": "DL000123", "G1_COMP": "DL000045", "G1_OBSERV": null, "subStructure": [] }
    ]
  }
  ```

- **Erros**
  - `404 NOT_FOUND` → quando o código não existe.
  - `401 UNAUTHORIZED` → sem token JWT válido.

---

### 3. `GET /api/products/group/:group`

Lista produtos de um grupo específico, com paginação e ordenação múltipla.

- **Parâmetros de Path**
  - `group` → identificador do grupo (ex.: `CONEXOES`).

- **Query Params**
  - `page` (>= 1, padrão 1)
  - `limit` (1–200, padrão 50)
  - `orderBy` (CSV de colunas com direção)

- **Exemplo de Requisição**
  ```bash
  curl -X GET "http://localhost:3000/api/products/group/CONEXOES?page=1&limit=10&orderBy=B1_DESC desc"
  ```

- **Resposta de Sucesso (200)**
  ```json
  {
    "data": [
      { "B1_COD": "DL000010", "B1_GRUPO": "CONEXOES", "B1_DESC": "Terminal 10 vias" }
    ],
    "page": 1,
    "limit": 10,
    "total": 45
  }
  ```

---

## Validações

- **Zod Schemas**:
  - `listQuerySchema` → valida `page`, `limit`, `orderBy`.
  - `codeParamsSchema` → exige parâmetro `code` não vazio.
  - `groupParamsSchema` → exige parâmetro `group` e valida query de paginação.

- **Função parseOrderByCSV**  
  - Converte CSV de colunas em array de strings normalizadas (`ASC`/`DESC`).  
  - Rejeita colunas inválidas com regex `^[A-Za-z0-9_]+$`.

---

## Tratamento de Erros

- Uso do `ApiError` para erros customizados (ex.: `404 Produto não encontrado`).
- `asyncHandler` encapsula erros assíncronos, evitando repetição de `try/catch`.

---

## Segurança

- As rotas são protegidas pelo middleware **jwtAuth** (configurado globalmente no `app.js`).
- Necessário enviar header `Authorization: Bearer <token>` em todas as requisições.

---

## Próximos Passos

1. Adicionar suporte a **filtros adicionais** (ex.: descrição, status).
2. Implementar **cache** para consultas repetidas.
3. Melhorar **padronização de erros** (payload JSON consistente).

