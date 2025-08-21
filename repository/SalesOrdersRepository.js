/***
 table: SC6010
 * Colunas a pesquisadas
 * codigo pedido: C6_NUM 
 * cliente: C6_CLI
 * cliente loja: C6_LOJA
 * filial ou matriz: C6_FILIAL
 * item: C6_ITEM
 * produto: C6_PRODUTO
 * quantidade do pedido: C6_QTDVEN
 * quantidade entregue: C6_QTDENT
 * data de entrega: C6_ENTREG
 * valor do item: C6_VALOR
 * informação deletada: D_E_L_E_T_
 -------------------------------------------
 table: SC5010
 * codigo pedido: C5_NUM 
 * data de emissão: C5_EMISSAO 
 -------------------------------------------
 table: SB1010
 * descrição do produto: B1_DESC
 table: SA1010
 * nome reduzido do cliente: A1_NREDUZ
*/
// repository/SalesOrdersRepository.js
import poolPromise from "./db.js";
import BaseRepository from "./BaseRepository.js";
import { buildSafeOrderBy } from "./BaseRepository.js";
import { ApiError } from "../middlewares/errorHandler.js";

/**
 * Repositório para consultas de Pedidos de Vendas
 * Tabelas: SC6010 (itens), SC5010 (cabeçalho), SB1010 (produto), SA1010 (cliente)
 * Colunas principais (SC6010): C6_NUM, C6_CLI, C6_LOJA, C6_FILIAL, C6_ITEM, C6_PRODUTO,
 *   C6_QTDVEN, C6_QTDENT, C6_ENTREG, C6_VALOR
 * Cabeçalho (SC5010): C5_NUM, C5_EMISSAO
 * Enriquecimento: SB1010.B1_DESC, SA1010.A1_NREDUZ
 */
export default class SalesOrdersRepository extends BaseRepository {
    /**
     * Lista itens de pedidos (com join em cabeçalho/produto/cliente), com filtros e paginação
     * @param {Object} opts
     * @param {number} opts.page
     * @param {number} opts.limit
     * @param {string|string[]} opts.orderBy - ex: "C6_NUM asc,C6_ITEM asc" | ["C6_NUM ASC","C6_ITEM ASC"]
     * @param {Object} opts.filters - { num, cli, loja, filial, produto, emissaoFrom, emissaoTo, pending }
     */
    async getAllOrders({
        page = 1,
        limit = 50,
        orderBy = ["C6_NUM ASC", "C6_ITEM ASC"],
        filters = {},
    } = {}) {
        const pool = await poolPromise;

        // Normaliza / valida ORDER BY usando util do BaseRepository (anti-injeção)
        const safeOrderBy = buildSafeOrderBy(
            Array.isArray(orderBy)
                ? orderBy
                : String(orderBy)
                      .split(",")
                      .map((s) => s.trim()),
            "C6_NUM"
        );

        // Filtros permitidos
        const {
            num = null,
            cli = null,
            loja = null,
            filial = null,
            produto = null,
            emissaoFrom = null, // 'YYYY-MM-DD'
            emissaoTo = null, // 'YYYY-MM-DD'
            pending = null, // true => (QTDENT < QTDVEN); false => (QTDENT >= QTDVEN)
            entregaFrom = null,
            entregaTo = null,
            overdue = null,
        } = filters;

        // WHERE dinâmico
        const where = [];
        if (num) where.push("s6.C6_NUM = @num");
        if (cli) where.push("s6.C6_CLI = @cli");
        if (loja) where.push("s6.C6_LOJA = @loja");
        if (filial) where.push("s6.C6_FILIAL = @filial");
        if (produto) where.push("s6.C6_PRODUTO = @produto");
        if (emissaoFrom)
            where.push("s5.C5_EMISSAO >= REPLACE(@emissaoFrom, '-', '')");
        if (emissaoTo)
            where.push("s5.C5_EMISSAO <= REPLACE(@emissaoTo,   '-', '')");
        if (entregaFrom)
            where.push("s6.C6_ENTREG   >= REPLACE(@entregaFrom,     '-', '')");
        if (entregaTo)
            where.push("s6.C6_ENTREG   <= REPLACE(@entregaTo,     '-', '')");
        if (pending === true) where.push("s6.C6_QTDENT < s6.C6_QTDVEN");
        if (pending === false) where.push("s6.C6_QTDENT >= s6.C6_QTDVEN");
        if (overdue === true) {
            // hoje no formato 112 (YYYYMMDD)
            where.push(`
            s6.C6_ENTREG < CONVERT(VARCHAR(8), GETDATE(), 112)
            AND s6.C6_QTDENT < s6.C6_QTDVEN
            `);
        }
        where.push("ISNULL(s6.D_E_L_E_T_, '') <> '*'");
        where.push("ISNULL(s5.D_E_L_E_T_, '') <> '*'");

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

        // ORDER BY seguro já montado
        const orderSql = safeOrderBy ? `ORDER BY ${safeOrderBy}` : "";

        // Paginação (OFFSET/FETCH)
        const offset = (page - 1) * limit;

        // Query base (itens + cabeçalho + descrições)
        const baseSelect = `
      FROM SC6010 s6
      LEFT JOIN SC5010 s5 ON s5.C5_NUM = s6.C6_NUM
      LEFT JOIN SB1010 b1 ON b1.B1_COD = s6.C6_PRODUTO
      LEFT JOIN SA1010 a1 ON a1.A1_COD = s6.C6_CLI AND a1.A1_LOJA = s6.C6_LOJA
      ${whereSql}
    `;

        // Total
        const countSql = `SELECT COUNT(*) AS total ${baseSelect}`;

        // Página
        const pageSql = `
      SELECT
        s6.C6_NUM,
        s5.C5_EMISSAO,
        s6.C6_FILIAL,
        s6.C6_CLI,
        s6.C6_LOJA,
        a1.A1_NREDUZ,
        s6.C6_ITEM,
        s6.C6_PRODUTO,
        b1.B1_DESC,
        s6.C6_QTDVEN,
        s6.C6_QTDENT,
        s6.C6_ENTREG,
        s6.C6_VALOR
      ${baseSelect}
      ${orderSql}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

        // Execução parametrizada
        const request = pool.request();
        if (num) request.input("num", num);
        if (cli) request.input("cli", cli);
        if (loja) request.input("loja", loja);
        if (filial) request.input("filial", filial);
        if (produto) request.input("produto", produto);
        if (emissaoFrom) request.input("emissaoFrom", emissaoFrom);
        if (emissaoTo) request.input("emissaoTo", emissaoTo);
        if (entregaFrom) request.input("entregaFrom", entregaFrom);
        if (entregaTo) request.input("entregaTo", entregaTo);

        request.input("offset", offset);
        request.input("limit", limit);

        const total = (await request.query(countSql)).recordset[0]?.total ?? 0;
        const data = (await request.query(pageSql)).recordset;

        return { data, page, limit, total };
    }

    /**
     * Retorna o pedido (cabeçalho) + itens do pedido (array)
     * @param {string|number} num - Código do pedido (C5/C6_NUM)
     */
    async getOrderByNum(num) {
        const pool = await poolPromise;

        const headerSql = `
      SELECT TOP (1)
        s5.C5_NUM,
        s5.C5_EMISSAO,
        s6.C6_FILIAL,
        s6.C6_CLI,
        s6.C6_LOJA,
        a1.A1_NREDUZ
      FROM SC5010 s5
      INNER JOIN SC6010 s6 ON s6.C6_NUM = s5.C5_NUM
      LEFT JOIN SA1010 a1 ON a1.A1_COD = s6.C6_CLI AND a1.A1_LOJA = s6.C6_LOJA
      WHERE s5.C5_NUM = @num
    `;

        const itemsSql = `
      SELECT
        s6.C6_NUM,
        s6.C6_ITEM,
        s6.C6_PRODUTO,
        b1.B1_DESC,
        s6.C6_QTDVEN,
        s6.C6_QTDENT,
        s6.C6_ENTREG,
        s6.C6_VALOR
      FROM SC6010 s6
      LEFT JOIN SB1010 b1 ON b1.B1_COD = s6.C6_PRODUTO
      WHERE s6.C6_NUM = @num
      ORDER BY s6.C6_ITEM ASC
    `;

        const req = pool.request().input("num", num);
        const header = (await req.query(headerSql)).recordset[0] || null;
        if (!header) {
            throw new ApiError(
                404,
                "NOT_FOUND",
                `Pedido "${num}" não encontrado`
            );
        }
        const items = (await req.query(itemsSql)).recordset;

        return { ...header, items };
    }
}
