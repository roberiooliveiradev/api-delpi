# systemRoutes.js — Documentação Técnica (Rotas de Sistema)

> **Arquivo fonte:** `routes/systemRoutes.js`  
> **Stack:** Node.js + Express + Zod + Middlewares customizados (`asyncHandler`, `validate`, `errorHandler`)  
> **Depende de:** `SystemRepository.js`

---

## Objetivo

Expor rotas REST para inspeção do **catálogo do SQL Server**, permitindo listar **tabelas** e **colunas** (com descrições quando houver), mantendo a **ordem física** das colunas por `column_id`.

---

## Rotas Disponíveis

### 1) `GET /api/system/tables`

Lista todas as tabelas de usuário com possível descrição (`MS_Description`).

- **Exemplo de Requisição**
  ```bash
  curl -X GET "http://localhost:3000/api/system/tables" -H "Authorization: Bearer <token>"
  ```

- **Resposta de Sucesso (200)**
  ```json
  [
    { "TableName": "SB1010", "Description": "Cadastro de produtos" },
    { "TableName": "SA1010", "Description": null }
  ]
  ```

---

### 2) `GET /api/system/tables/:tablename/columns`

Lista as colunas da tabela informada, com descrições (`MS_Description`) quando houver, mantendo a ordem por `column_id`.

- **Parâmetros de Path**
  - `tablename` → **somente** letras, números e underline (`^[A-Za-z0-9_]+$`).  
    *Validação realizada via Zod (`tableColumnsSchema`).*

- **Exemplo de Requisição**
  ```bash
  curl -X GET "http://localhost:3000/api/system/tables/SB1010/columns" -H "Authorization: Bearer <token>"
  ```

- **Resposta de Sucesso (200)**
  ```json
  [
    { "ColumnName": "B1_COD", "Description": "Código do produto" },
    { "ColumnName": "B1_DESC", "Description": "Descrição" }
  ]
  ```

- **Erros**
  - `404 NOT_FOUND` → quando a tabela **não existe** (array vazio), o handler converte para erro padronizado:
    ```json
    { "code": "NOT_FOUND", "message": "Tabela \"<nome>\" não encontrada" }
    ```
  - `400 BAD_REQUEST` → quando `tablename` não passa na validação (regex).  
  - `401 UNAUTHORIZED` → sem token JWT válido.

---

## Validações

- **Zod Schema**
  ```ts
  const tableColumnsSchema = z.object({
    params: z.object({
      tablename: z.string().regex(/^[A-Za-z0-9_]+$/, "Nome de tabela inválido (use apenas letras, números e _)"),
    }),
  });
  ```

- O schema garante compatibilidade com a lógica de **sanitização de identificadores** no repositório.

---

## Tratamento de Erros

- `asyncHandler` encapsula erros assíncronos (evita múltiplos `try/catch`).  
- `ApiError` é utilizado para padronizar erros de domínio (ex.: `404 NOT_FOUND`).  
- Erros de validação Zod são tratados pelo middleware `validate` retornando `400` com detalhes.

---

## Segurança

- As rotas são protegidas pelo middleware **jwtAuth** (configurado no `app.js`).  
- É necessário enviar o header `Authorization: Bearer <token>` para acesso.

---

## Próximos Passos

1. Adicionar endpoint detalhado (`/tables/:tablename/columns/details`) incluindo tipo de dado, `is_nullable`, `max_length` etc.  
2. Suportar **schemas** explícitos (ex.: `/tables/:schema/:tablename/columns` ou `?schema=...`).  
3. Cache leve para consultas de catálogo frequentes.

