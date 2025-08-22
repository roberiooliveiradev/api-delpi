// repository/ProductRepository.js
import BaseRepository from "./BaseRepository.js";

class ProductRepository extends BaseRepository {
    async getAllProducts({ page = 1, limit = 50, orderBy = "B1_COD" } = {}) {
        const columns = ["B1_GRUPO", "B1_COD", "B1_DESC", "B1_TIPO"];
        return super.getAll("SB1010", columns, { page, limit, orderBy });
    }

    async getProductByGroup(
        group,
        { page = 1, limit = 50, orderBy = "B1_COD" } = {}
    ) {
        const columns = ["B1_COD", "B1_GRUPO", "B1_DESC"];
        return super.getAll("SB1010", columns, {
            filters: { B1_GRUPO: group },
            page,
            limit,
            orderBy,
        });
    }

    async getProductByCode(code) {
        const rows = await super.getByValue("SB1010", ["*"], code, "B1_COD");
        const product = rows?.[0];
        // const suppliers = this.getSuppliersByProduct(code); // opcional, assíncrono
        if (!product) return null;
        return product;
    }

    /**
     * Busca os "filhos" na SG1010 de acordo com o sentido.
     * - whereUsed: G1_COMP = code  -> quem usa "code" como componente
     * - explosion: G1_COD  = code  -> componentes de "code"
     */
    async _fetchBomEdges(code, { direction }) {
        const isWhereUsed = direction === "where-used";
        const filterKey = isWhereUsed ? "G1_COMP" : "G1_COD";
        const columns = ["G1_COD", "G1_COMP", "G1_QUANT"];
        const { data } = await super.getAll("SG1010", columns, {
            filters: { [filterKey]: code },
            orderBy: "G1_COD ASC",
        });
        return data ?? [];
    }

    /**
     * Cache de produtos por código (SB1010) para enriquecer os nós da estrutura.
     */
    async _getProductFromCache(cod, cache) {
        if (cache.has(cod)) return cache.get(cod);
        const rows = await super.getByValue(
            "SB1010",
            ["B1_COD", "B1_DESC", "B1_TIPO", "B1_UM"], // <- inclui B1_UM
            cod,
            "B1_COD"
        );
        const prod = rows?.[0] ?? null;
        cache.set(cod, prod);
        return prod;
    }

    /**
     * Monta árvore recursiva com proteção a ciclos e limite de profundidade.
     * direction:
     *   - "where-used" (padrão): SG1010.G1_COMP = code
     *   - "explosion":            SG1010.G1_COD  = code
     *
     * Retorno (exemplo de nó):
     * {
     *   code: "ABC123",
     *   description: "PARAFUSO...",
     *   type: "PA/MP/..",
     *   qty: 2.5,        // quantidade na aresta que liga ao pai (se existir)
     *   um: "UN",
     *   level: 0,
     *   parent: null,
     *   children: [ ...mesmo formato... ]
     * }
     */
    async getRecursiveStructure(
        code,
        {
            direction = "where-used", // "where-used" | "explosion"
            maxDepth = 10,
            _depth = 0,
            _parent = null,
            _edgeQty = null,
            _edgeUM = null,
            _visitedPath = new Set(), // detecta ciclo por caminho
            _productCache = new Map(),
        } = {}
    ) {
        if (_depth > maxDepth) return null;

        // Marcação do caminho para evitar loops (ciclo por caminho, não global)
        const pathKey = `${_parent ?? "ROOT"}->${code}`;
        if (_visitedPath.has(pathKey)) return null;
        _visitedPath.add(pathKey);

        const prod = await this._getProductFromCache(code, _productCache);

        const node = {
            code,
            description: prod?.B1_DESC ?? null,
            type: prod?.B1_TIPO ?? null,
            qty: _edgeQty, // quantidade do vínculo com o pai
            um: _edgeUM,
            level: _depth,
            parent: _parent,
            children: [],
        };

        // Busca arestas (filhos no sentido escolhido)
        const edges = await this._fetchBomEdges(code, { direction });

        // Define para cada aresta qual é o "próximo código" a expandir
        const nextKey = direction === "where-used" ? "G1_COD" : "G1_COMP";

        for (const e of edges) {
            const childCode =
                e[direction === "where-used" ? "G1_COD" : "G1_COMP"];
            const childProd = await this._getProductFromCache(
                childCode,
                _productCache
            );
            const childUM = childProd?.B1_UM ?? null;

            const child = await this.getRecursiveStructure(childCode, {
                direction,
                maxDepth,
                _depth: _depth + 1,
                _parent: code,
                _edgeQty: e.G1_QUANT ?? null,
                _edgeUM: childUM, // <- UM vem do produto do filho
                _visitedPath,
                _productCache,
            });
            if (child) node.children.push(child);
        }

        return node;
    }

    /**
     * API amigável para consumir a estrutura.
     * - recursive: true (padrão) usa getRecursiveStructure
     * - direction: "where-used" ou "explosion"
     * - maxDepth: limite de profundidade
     * OBS: paginação/ordenação só se aplicam ao modo não recursivo.
     */
    async getStructureByCode(
        code,
        {
            recursive = true,
            direction = "where-used",
            maxDepth = 10,
            page,
            limit,
            orderBy = "G1_COD ASC",
        } = {}
    ) {
        if (recursive) {
            return this.getRecursiveStructure(code, { direction, maxDepth });
        }
        const filterKey = direction === "where-used" ? "G1_COMP" : "G1_COD";
        return super.getAll(
            "SG1010",
            ["G1_COD", "G1_COMP", "G1_QUANT", "G1_OBSERV"],
            {
                filters: { [filterKey]: code },
                page,
                limit,
                orderBy,
            }
        );
    }

    /**
     * Retorna fornecedores e partnumbers de um produto com paginação (SA5010)
     */
    async getSuppliersByProduct(
        code,
        { page = 1, limit = 50, orderBy = "A5_FORNECE ASC" } = {}
    ) {
        const result = await super.getAll("SA5010", ["*"], {
            filters: { A5_PRODUTO: code },
            page,
            limit,
            orderBy,
        });
        return result;
    }

    /**
     * Pesquisa por descrição (SB1010) com ranking de relevância
     */
    async getProductsByDescription({ description, page = 1, limit = 50 }) {
        const desc = description.toUpperCase();
        const words = desc.split(/\s+/).filter(Boolean);

        const filters = {
            or: [
                { B1_DESC: { op: "like", value: `%${desc}%` } },
                { B1_DESC: { op: "like", value: `%${words.join("% ")}%` } },
                ...words.map((w) => ({
                    B1_DESC: { op: "like", value: `%${w}%` },
                })),
            ],
        };

        const columns = ["B1_GRUPO", "B1_COD", "B1_DESC", "B1_TIPO"];

        const extraColumns = [
            `CASE 
                WHEN B1_DESC LIKE '%${desc}%' THEN 3
                WHEN B1_DESC LIKE '%${words.join("% ")}%' THEN 2
                WHEN ${words
                    .map((w) => `B1_DESC LIKE '%${w}%'`)
                    .join(" AND ")} THEN 1
                ELSE 0 
            END AS relevance`,
        ];

        const orderBy = [
            { column: "relevance", dir: "DESC" },
            { column: "B1_DESC", dir: "ASC" },
            { column: "B1_COD", dir: "ASC" },
        ];

        return super.getAll("SB1010", columns, {
            filters,
            page,
            limit,
            orderBy,
            extraColumns,
        });
    }
}

export default ProductRepository;
