# SystemRepository.js — Documentação Técnica

> **Arquivo fonte:** `repository/SystemRepository.js`  
> **Stack:** Node.js + SQL Server (`mssql`)  
> **Depende de:** `db.js` (pool de conexões)

---

## Objetivo

Fornecer acesso ao **catálogo do SQL Server**, permitindo:

- Listar todas as **tabelas de usuário** (com descrições, se houver).  
- Listar todas as **colunas de uma tabela** (com descrições, se houver).  

Essas informações são extraídas de **`sys.tables`**, **`sys.columns`** e **`sys.extended_properties`**.

---

## Principais Funções

### 1) `async getAllTables()`

Retorna todas as tabelas de usuário com descrições (quando cadastradas via `MS_Description`).

**Query executada:**
```sql
SELECT 
  t.name AS TableName,
  ep.value AS Description
FROM sys.tables t
LEFT JOIN sys.extended_properties ep
  ON ep.major_id = t.object_id
  AND ep.minor_id = 0
  AND ep.class = 1
  AND ep.name = 'MS_Description'
ORDER BY t.name;
```

**Exemplo de uso:**
```js
const repo = new SystemRepository();
const tables = await repo.getAllTables();
```

**Resposta:**
```json
[
  { "TableName": "SB1010", "Description": "Cadastro de produtos" },
  { "TableName": "SA1010", "Description": null }
]
```

---

### 2) `async getColumnsTable(tableName)`

Retorna todas as colunas de uma tabela, com descrições quando houver (`MS_Description`).

**Query executada:**
```sql
SELECT 
  c.name AS ColumnName,
  ep.value AS Description
FROM sys.columns c
INNER JOIN sys.tables t ON c.object_id = t.object_id
LEFT JOIN sys.extended_properties ep
  ON ep.major_id = c.object_id
  AND ep.minor_id = c.column_id
  AND ep.class = 1
  AND ep.name = 'MS_Description'
WHERE t.name = @tableName
ORDER BY c.column_id;
```

**Exemplo de uso:**
```js
const columns = await repo.getColumnsTable("SB1010");
```

**Resposta:**
```json
[
  { "ColumnName": "B1_COD", "Description": "Código do produto" },
  { "ColumnName": "B1_DESC", "Description": "Descrição" }
]
```

---

## Observações

- Usa **parâmetro SQL seguro** (`@tableName`) para evitar injeção.  
- Descrições vêm de `MS_Description` (padrão do SQL Server para metadados).  
- Ordena colunas por `column_id` → garante ordem física da tabela.  

---

## Integração com Rotas

- `GET /api/system/tables` → usa `getAllTables()`.  
- `GET /api/system/tables/:tablename/columns` → usa `getColumnsTable(tableName)`.  

---

## Extensões Futuras

- Suporte a **schemas** além do padrão (`dbo`).  
- Endpoint para criar/alterar descrições (`MS_Description`).  
- Consultar **foreign keys** e **constraints** para enriquecer o catálogo.  
- Listar **views** (`sys.views`) além de tabelas.  

