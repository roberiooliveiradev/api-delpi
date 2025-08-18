# db.js — Documentação Técnica (Conexão com SQL Server)

> **Arquivo fonte:** `repository/db.js`  
> **Stack:** Node.js + [`mssql`](https://www.npmjs.com/package/mssql) + dotenv

---

## Objetivo

Estabelecer uma conexão global com o **SQL Server** usando `mssql` e variáveis de ambiente, disponibilizando um **pool de conexões reutilizável** (`poolPromise`) para os repositórios.

---

## Configuração

### Estrutura do `dbConfig`
```js
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false, // true se Azure
        trustServerCertificate: true, // necessário em redes locais
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};
```

### Variáveis de Ambiente

```dotenv
DB_USER=usuario
DB_PASSWORD=senha_forte
DB_HOST=servidor_ou_ip
DB_DATABASE=nome_do_banco
DB_PORT=1433
```

- **DB_USER**: usuário do banco (preferencialmente somente leitura).  
- **DB_PASSWORD**: senha do usuário.  
- **DB_HOST**: servidor ou IP do SQL Server.  
- **DB_DATABASE**: banco de dados alvo.  
- **DB_PORT**: porta do SQL Server (padrão 1433).  

---

## Conexão Global

```js
const poolPromise = sql
    .connect(dbConfig)
    .then((pool) => {
        console.log("Conectado ao SQL Server com sucesso!");
        return pool;
    })
    .catch((err) => {
        console.error("Erro ao conectar no SQL Server:", err);
        throw err;
    });

export default poolPromise;
```

- Utiliza **promessa global** (`poolPromise`).  
- Garante **singleton** (uma conexão por processo).  
- Loga sucesso ou falha no console.  

---

## Uso em Repositórios

Exemplo de uso em qualquer repositório:

```js
import poolPromise from "./db.js";

export async function exemplo() {
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("status", "ATIVO")
        .query("SELECT TOP (10) * FROM SB1010 WHERE B1_ATIVO = @status");
    return result.recordset;
}
```

---

## Boas Práticas

- Nunca versionar arquivos `.env`.  
- Usuário do banco deve ter **privilégios mínimos** necessários.  
- Ajustar `pool.max` conforme a carga esperada.  
- Usar `options.encrypt = true` em ambientes de produção/Azure.  
- Em redes locais com certificados **self-signed**, manter `trustServerCertificate = true`.  
- Configurar **healthchecks** periódicos (`SELECT 1`) para monitorar disponibilidade.

---

## Troubleshooting

- **`ELOGIN`** → usuário/senha inválidos ou sem permissão.  
- **`ESOCKET` / timeout** → firewall ou porta incorreta.  
- **Azure** → requer `encrypt: true` e `trustServerCertificate: false` (ou certificado válido).  
- **Host inválido** → verificar `DB_HOST` (não usar `http://`).  

---

## Extensões Futuras

- Suporte a **failover partner** / AlwaysOn (`MultiSubnetFailover`).  
- Métricas do pool para Prometheus.  
- Separar conexões de leitura/escrita (read replicas).

