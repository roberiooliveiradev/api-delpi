# BaseRepository.js — Documentação Técnica

> **Arquivo fonte:** `repository/BaseRepository.js`  
> **Stack:** Node.js + SQL Server (`mssql`)  
> **Depende de:** `db.js` (pool de conexões)

---

## Objetivo

Fornecer um repositório **genérico e seguro** para consultas de leitura ao SQL Server, com recursos de:

- Paginação e total de registros.
- Ordenação por múltiplas colunas (ASC/DESC).
- Filtros estendidos (`eq`, `like`, `in`, `gte`, `lte`).
- Sanitização de identificadores para prevenir injeção SQL.

---

## Principais Funções

### 1. `sanitizeIdentifier(identifier)`

- Permite apenas letras, números e underscore (`^[A-Za-z0-9_]+$`).
- Qualquer caractere inválido gera erro.

### 2. `buildSafeOrderBy(orderBy, fallbackColumn = "1")`

Constrói um `ORDER BY` seguro a partir de:

- String simples (`"B1_COD"`).
- Array de strings (`["B1_GRUPO ASC", "B1_COD DESC"]`).
- Array de objetos (`[{ column: "B1_GRUPO", dir: "ASC" }, { column: "B1_COD", dir: "DESC" }]`).

Valida colunas e normaliza direção (`ASC`/`DESC`).

---

### 3. `async getAll(table, columnsArray = ["*"], options = {})`

Executa uma consulta paginada com filtros, ordenação e contagem total.

**Parâmetros:**

- `table: string` → Nome da tabela (ex.: `"SB1010"`).  
- `columnsArray?: string[]` → Colunas a projetar (`"*"` ou lista de strings).  
- `options?: { filters?: object, page?: number, limit?: number, orderBy?: any }`  

**Recursos:**

- **Paginação**: `page` e `limit` obrigatórios para uso de paginação.  
- **Filtros**: objeto `coluna -> valor` ou `{ op, value }`.  
  - `eq`: igualdade (`col = @param`).  
  - `like`: `LIKE @param`.  
  - `in`: lista (`col IN (...)`).  
  - `gte`: maior ou igual.  
  - `lte`: menor ou igual.  
- **ORDER BY** múltiplo via `buildSafeOrderBy`.  
- **Retorno**:  
  ```json
  {
    "data": [ ... ],
    "page": 1,
    "limit": 50,
    "total": 123
  }
  ```

**Exemplo:**
```js
const repo = new BaseRepository();
const result = await repo.getAll("SB1010", ["B1_COD", "B1_DESC"], {
  filters: {
    B1_ATIVO: { op: "eq", value: "1" },
    B1_DESC: { op: "like", value: "%Terminal%" },
    B1_COD: { op: "in", value: ["DL0001", "DL0002"] }
  },
  page: 1,
  limit: 20,
  orderBy: ["B1_DESC ASC", "B1_COD DESC"]
});
```

---

### 4. `async getByValue(table, columnsArray = ["*"], keyValue, keyColumn = "id")`

Consulta simples por igualdade.

**Parâmetros:**

- `table: string` → Nome da tabela.  
- `columnsArray: string[]` → Colunas a projetar.  
- `keyValue: any` → Valor da chave.  
- `keyColumn: string` → Coluna da chave (padrão `"id"`).  

**Retorno:** `recordset` do SQL Server (array de objetos).

**Exemplo:**
```js
const repo = new BaseRepository();
const produto = await repo.getByValue(
  "SB1010",
  ["B1_COD", "B1_DESC"],
  "DL000123",
  "B1_COD"
);
```

---

## Retorno Padrão de `getAll`

```json
{
  "data": [ { "B1_COD": "DL0001", "B1_DESC": "Terminal 1 via" } ],
  "page": 1,
  "limit": 20,
  "total": 345
}
```

---

## Segurança

- Identificadores validados com regex (impede injeção via nomes de colunas/tabelas).  
- Valores sempre parametrizados (`request.input`).  
- `IN` vazio gera `1 = 0` (nenhuma linha).

---

## Tratamento de Erros

- Filtros com operadores inválidos lançam erro.  
- Paginação inválida (`limit` sem `page`, valores < 1) lança erro.  
- Colunas inválidas em `orderBy` lançam erro.

---

## Boas Práticas

- Sempre definir `page` + `limit` ao usar paginação.  
- Definir `orderBy` explícito para resultados consistentes.  
- Evitar `columnsArray = ["*"]` em produção (prefira colunas específicas).  

---

## Extensões Futuras

- Suporte a operadores adicionais (`between`, `!=`, `not in`).  
- Keyset pagination para grandes volumes.  
- Cache (Redis/memory) para consultas frequentes.  
- Whitelist de tabelas/colunas por contexto.

