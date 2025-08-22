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
        const suppliers = this.getSuppliersByProduct(code);
        if (!product) return null;
        return product;
    }

    /**
     * Estrutura recursiva (BOM) com critério where-used: SG1010.G1_COMP = code
     * Se desejar a “explosão” de componentes, altere a chave para G1_COD = code.
     */
    async getRecursiveStructure(code, visited = new Set()) {
        if (visited.has(code)) return [];
        visited.add(code);

        const nodes = await super.getByValue("SG1010", ["*"], code, "G1_COMP");

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

    async getStructureByCode(
        code,
        { page = 1, limit = 50, orderBy = "G1_COD ASC" } = {}
    ) {
        // Consulta direta na SG1010
        const rows = await super.getAll("SG1010", ["*"], {
            filters: { G1_COMP: code },
            page,
            limit,
            orderBy,
        });

        return rows;
    }

    /**
     * Retorna fornecedores e partnumbers de um produto com paginação
     * Consulta SA5010 pelo código do produto
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
     * Pesquisar produtos pela descrição
     * Consulta SB1010 pela coluna B1_DESC
     */
    async getProductsByDescription({ description, page, limit, orderBy }) {
        const term = `%${description.split(" ").join(" %")}%`; // adiciona curingas

        const columns = ["B1_GRUPO", "B1_COD", "B1_DESC", "B1_TIPO"];
        const results = await super.getAll("SB1010", columns, {
            filters: {
                B1_DESC: { op: "like", value: term },
            },
            page,
            limit,
            orderBy,
        });
        return results;
    }
}

export default ProductRepository;
