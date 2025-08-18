# ProductRepository.js — Documentação Técnica

> **Arquivo fonte:** `repository/ProductRepository.js`  
> **Stack:** Node.js + SQL Server (`mssql`)  
> **Depende de:** `BaseRepository.js`

---

## Objetivo

Especializar o `BaseRepository` para lidar com **produtos** no Protheus (tabela `SB1010`) e suas **estruturas (BOM)** na tabela `SG1010`.

---

## Principais Funções

### 1) `async getAllProducts({ page = 1, limit = 50, orderBy = "B1_COD" } = {})`

- Retorna lista paginada de produtos com colunas principais.  
- **Colunas**: `B1_GRUPO`, `B1_COD`, `B1_DESC`, `B1_TIPO`.  
- Usa `BaseRepository.getAll` com paginação, ordenação múltipla e total.

**Exemplo de uso:**
```js
const repo = new ProductRepository();
const result = await repo.getAllProducts({ page: 1, limit: 20, orderBy: "B1_DESC ASC" });
```

---

### 2) `async getProductByGroup(group, { page = 1, limit = 50, orderBy = "B1_COD" } = {})`

- Lista produtos de um **grupo específico**.  
- **Colunas**: `B1_COD`, `B1_GRUPO`, `B1_DESC`.  
- Filtro fixo: `B1_GRUPO = group`.  

**Exemplo de uso:**
```js
const result = await repo.getProductByGroup("CONEXOES", { page: 1, limit: 10, orderBy: "B1_DESC DESC" });
```

---

### 3) `async getProductByCode(code)`

- Retorna **um produto específico** pelo código (`B1_COD`).  
- **Colunas**: `B1_COD`, `B1_DESC`, `B1_GRUPO`.  
- Também retorna a **estrutura recursiva (BOM)** com `getRecursiveStructure`.  
- Se produto não for encontrado → retorna `null`.

**Exemplo de uso:**
```js
const produto = await repo.getProductByCode("DL000123");
```

**Resposta:**
```json
{
  "B1_COD": "DL000123",
  "B1_DESC": "Conector ABC",
  "B1_GRUPO": "CONEXOES",
  "structureProduct": [
    { "G1_COD": "DL000123", "G1_COMP": "DL000045", "G1_OBSERV": null, "subStructure": [] }
  ]
}
```

---

### 4) `async getRecursiveStructure(code, visited = new Set())`

- Monta estrutura recursiva de componentes a partir da tabela `SG1010`.  
- Critério atual: **where-used** (`SG1010.G1_COMP = code`).  
- Para explosão direta, alterar para `G1_COD = code`.  
- Previne ciclos com `visited` (Set).  

**Exemplo de uso interno:**
```js
const estrutura = await repo.getRecursiveStructure("DL000123");
```

**Resposta:**
```json
[
  {
    "G1_COD": "DL000123",
    "G1_COMP": "DL000045",
    "G1_OBSERV": "Obs opcional",
    "subStructure": []
  }
]
```

---

## Estrutura da Tabela `SB1010` (Produtos)

| Coluna    | Descrição        |
| --------- | ---------------- |
| B1_GRUPO  | Grupo do produto |
| B1_COD    | Código do produto|
| B1_DESC   | Descrição        |
| B1_TIPO   | Tipo (ACABADO, MP, etc.) |

---

## Estrutura da Tabela `SG1010` (Estrutura de Produtos)

| Coluna    | Descrição                        |
| --------- | -------------------------------- |
| G1_COD    | Código do produto pai            |
| G1_COMP   | Código do componente filho       |
| G1_OBSERV | Observações (pode ser `NULL`)    |

---

## Boas Práticas

- Sempre usar paginação (`page` + `limit`) para evitar cargas excessivas.  
- Definir `orderBy` explícito para resultados previsíveis.  
- Alterar critério de `getRecursiveStructure` se desejar **explodir** componentes em vez de **where-used**.  
- Prevenir loops em estruturas recursivas com `visited`.  

---

## Extensões Futuras

- Adicionar filtros adicionais em `getAllProducts` (ex.: descrição, tipo).  
- Cache de estruturas recursivas (para evitar recomputações).  
- API para salvar/alterar estrutura (atualmente apenas leitura).  
