// repository/BaseRepository.js
import poolPromise from "./db.js";
import sql from "mssql";

// Permite apenas letras, números e underscore em identificadores
function sanitizeIdentifier(identifier) {
    if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
        throw new Error(`Identificador inválido: ${identifier}`);
    }
    return identifier;
}

/**
 * Constrói ORDER BY seguro a partir de:
 * - string: "B1_COD"
 * - array de strings: ["B1_GRUPO ASC", "B1_COD DESC"]
 * - array de objetos: [{ column: "B1_GRUPO", dir: "ASC" }, { column: "B1_COD", dir: "DESC" }]
 */
function buildSafeOrderBy(orderBy, fallbackColumn = "1") {
    if (!orderBy) return fallbackColumn;

    const toPair = (item) => {
        if (typeof item === "string") {
            const [colName, dir] = item.trim().split(/\s+/);
            return { column: colName, dir };
        }
        if (typeof item === "object" && item !== null) {
            return { column: item.column, dir: item.dir };
        }
        throw new Error("Formato de orderBy inválido");
    };

    const parts = Array.isArray(orderBy) ? orderBy : [orderBy];

    const safeParts = parts.map((raw) => {
        const { column, dir } = toPair(raw);
        const safeCol = sanitizeIdentifier(String(column));
        const safeDir =
            dir && /^(ASC|DESC)$/i.test(dir) ? dir.toUpperCase() : "ASC";
        return `${safeCol} ${safeDir}`;
    });

    return safeParts.join(", ");
}

class BaseRepository {
    /**
     * Retorna envelope paginado:
     *  { data, page, limit, total }
     *
     * Melhorias:
     *  - Validação de paginação
     *  - Filtros estendidos: eq, like, in, gte, lte
     *  - ORDER BY múltiplas colunas
     */
    async getAll(table, columnsArray = ["*"], options = {}) {
        const pool = await poolPromise;
        const { filters = {}, page, limit, orderBy } = options;

        // Validação de paginação
        if (limit !== undefined && limit !== null) {
            const p = Number(page);
            const l = Number(limit);
            if (!Number.isInteger(p) || p < 1) {
                throw new Error(
                    "Paginação inválida: quando 'limit' é usado, 'page' deve ser inteiro >= 1."
                );
            }
            if (!Number.isInteger(l) || l < 1) {
                throw new Error(
                    "Paginação inválida: 'limit' deve ser inteiro >= 1."
                );
            }
        }

        // Sanitização
        const safeTable = sanitizeIdentifier(table);
        const safeColumns =
            columnsArray[0] === "*"
                ? "*"
                : columnsArray.map(sanitizeIdentifier).join(", ");

        // WHERE dinâmico (mesma construção será usada no COUNT e na SELECT paginada)
        const whereClauses = [];
        const requestData = pool.request();
        const requestCount = pool.request();
        const makeParam = (base, i) => `${base}_${i ?? ""}`.replace(/_$/, "");

        for (const [rawKey, rawFilter] of Object.entries(filters)) {
            const col = sanitizeIdentifier(rawKey);

            if (
                rawFilter &&
                typeof rawFilter === "object" &&
                !Array.isArray(rawFilter)
            ) {
                const { op = "eq", value } = rawFilter;

                switch (op) {
                    case "eq": {
                        const name = `param_${col}`;
                        whereClauses.push(`${col} = @${name}`);
                        requestData.input(name, value);
                        requestCount.input(name, value);
                        break;
                    }
                    case "like": {
                        const name = `param_${col}`;
                        whereClauses.push(`${col} LIKE @${name}`);
                        requestData.input(name, value);
                        requestCount.input(name, value);
                        break;
                    }
                    case "in": {
                        if (!Array.isArray(value) || value.length === 0) {
                            // IN vazio => 0 linhas
                            whereClauses.push("1 = 0");
                            break;
                        }
                        const placeholders = [];
                        value.forEach((v, i) => {
                            const name = makeParam(`param_${col}`, i);
                            placeholders.push(`@${name}`);
                            requestData.input(name, v);
                            requestCount.input(name, v);
                        });
                        whereClauses.push(
                            `${col} IN (${placeholders.join(", ")})`
                        );
                        break;
                    }
                    case "gte": {
                        const name = `param_${col}`;
                        whereClauses.push(`${col} >= @${name}`);
                        requestData.input(name, value);
                        requestCount.input(name, value);
                        break;
                    }
                    case "lte": {
                        const name = `param_${col}`;
                        whereClauses.push(`${col} <= @${name}`);
                        requestData.input(name, value);
                        requestCount.input(name, value);
                        break;
                    }
                    default:
                        throw new Error(
                            `Operador de filtro não suportado: ${op}`
                        );
                }
            } else {
                const name = `param_${col}`;
                whereClauses.push(`${col} = @${name}`);
                requestData.input(name, rawFilter);
                requestCount.input(name, rawFilter);
            }
        }

        // COUNT(*) com os mesmos filtros
        let countQuery = `SELECT COUNT(*) AS total FROM ${safeTable}`;
        if (whereClauses.length) {
            countQuery += ` WHERE ${whereClauses.join(" AND ")}`;
        }
        const countResult = await requestCount.query(countQuery);
        const total = Number(countResult.recordset?.[0]?.total ?? 0);

        // SELECT de dados (paginada se limit > 0)
        let dataQuery = `SELECT ${safeColumns} FROM ${safeTable}`;
        if (whereClauses.length) {
            dataQuery += ` WHERE ${whereClauses.join(" AND ")}`;
        }

        const fallbackOrderBy =
            safeColumns === "*"
                ? Object.keys(filters)[0] || "1"
                : safeColumns.split(", ")[0];

        const safeOrderBy = buildSafeOrderBy(orderBy, fallbackOrderBy);

        if (limit && Number(limit) > 0) {
            const offset = (Number(page) - 1) * Number(limit);
            dataQuery += ` ORDER BY ${safeOrderBy} OFFSET ${offset} ROWS FETCH NEXT ${Number(
                limit
            )} ROWS ONLY`;
        } else {
            dataQuery += ` ORDER BY ${safeOrderBy}`;
        }

        const dataResult = await requestData.query(dataQuery);

        return {
            data: dataResult.recordset,
            page: Number(page ?? 1),
            limit: Number(limit ?? dataResult.recordset.length),
            total,
        };
    }

    // Igualdade simples (usado por getProductByCode, etc.)
    async getByValue(table, columnsArray = ["*"], keyValue, keyColumn = "id") {
        const pool = await poolPromise;

        const safeTable = sanitizeIdentifier(table);
        const safeColumns =
            columnsArray[0] === "*"
                ? "*"
                : columnsArray.map(sanitizeIdentifier).join(", ");
        const safeKeyColumn = sanitizeIdentifier(keyColumn);

        const query = `SELECT ${safeColumns} FROM ${safeTable} WHERE ${safeKeyColumn} = @id`;

        const result = await pool.request().input("id", keyValue).query(query);
        return result.recordset;
    }
}

export default BaseRepository;
