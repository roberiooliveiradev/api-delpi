// repository/SystemRepository.js

import poolPromise from "./db.js";

class SystemRepository {
    // Listar todas as tabelas com nome e descrição (se existir)
    async getAllTables() {
        const pool = await poolPromise;
        const query = `
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
    `;

        const result = await pool.request().query(query);
        return result.recordset;
    }

    // Listar todas as colunas de uma tabela com nome e descrição (se existir)
    async getColumnsTable(tableName) {
        const pool = await poolPromise;
        const query = `
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
    `;

        const result = await pool
            .request()
            .input("tableName", tableName)
            .query(query);

        return result.recordset;
    }
}

export default SystemRepository;
