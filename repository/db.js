// repository/db.js

import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

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

// Conexão global
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
