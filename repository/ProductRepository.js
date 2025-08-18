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
        const rows = await super.getByValue(
            "SB1010",
            ["B1_COD", "B1_DESC", "B1_GRUPO"],
            code,
            "B1_COD"
        );
        const product = rows?.[0];
        if (!product) return null;

        const structureProduct = await this.getRecursiveStructure(
            product.B1_COD,
            new Set()
        );
        return { ...product, structureProduct };
    }

    /**
     * Estrutura recursiva (BOM) com critério where-used: SG1010.G1_COMP = code
     * Se desejar a “explosão” de componentes, altere a chave para G1_COD = code.
     */
    async getRecursiveStructure(code, visited = new Set()) {
        if (visited.has(code)) return [];
        visited.add(code);

        const nodes = await super.getByValue(
            "SG1010",
            ["G1_COD", "G1_COMP", "G1_OBSERV"],
            code,
            "G1_COMP"
        );

        const enriched = await Promise.all(
            nodes.map(async (n) => {
                const subStructure = await this.getRecursiveStructure(
                    n.G1_COD,
                    visited
                );
                return { ...n, subStructure };
            })
        );

        return enriched;
    }
}

export default ProductRepository;
