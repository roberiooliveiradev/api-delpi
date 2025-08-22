// routes/productRoutes.js
import { Router } from "express";
import ProductRepository from "../repository/ProductRepository.js";

import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { validate } from "../middlewares/validate.js";
import { z } from "zod";

const router = Router();
const repo = new ProductRepository();

// Parser de orderBy CSV -> array
function parseOrderByCSV(raw) {
    if (!raw) return undefined;
    const items = Array.isArray(raw) ? raw : String(raw).split(",");
    return items
        .map((s) => s.trim())
        .filter(Boolean)
        .map((piece) => {
            const [col, dir] = piece.split(/\s+/);
            if (!/^[A-Za-z0-9_]+$/.test(col)) {
                throw new Error(`Coluna inválida em orderBy: ${col}`);
            }
            const normDir =
                dir && /^(ASC|DESC)$/i.test(dir) ? dir.toUpperCase() : "ASC";
            return `${col} ${normDir}`;
        });
}

const listQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(1000).default(50).optional(),
        orderBy: z.string().optional(),
    }),
});

const codeParamsSchema = z.object({
    params: z.object({
        code: z.string().min(1, "Informe o código do produto"),
    }),
});

const groupParamsSchema = z.object({
    params: z.object({
        group: z.string().min(1, "Informe o grupo"),
    }),
    query: listQuerySchema.shape.query,
});

const descriptionParamsSchema = z.object({
    params: z.object({
        description: z.string().min(1, "Informe a descrição"),
    }),
    query: listQuerySchema.shape.query,
});

// Novo schema para /structure
const structureSchema = z.object({
    params: z.object({
        code: z.string().min(1, "Informe o código do produto"),
    }),
    query: z.object({
        // recursivo por padrão
        recursive: z.coerce.boolean().default(true).optional(),
        // sentido: where-used (G1_COMP = code) | explosion (G1_COD = code)
        direction: z
            .enum(["where-used", "explosion"])
            .default("where-used")
            .optional(),
        // limite de profundidade quando recursivo
        maxDepth: z.coerce.number().int().min(1).max(50).default(10).optional(),
        // só usados quando recursive=false
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(1000).optional(),
        orderBy: z.string().optional(),
    }),
});

// GET /api/products  -> { data, page, limit, total }
router.get(
    "/",
    validate(listQuerySchema),
    asyncHandler(async (req, res) => {
        const { page = 1, limit = 50, orderBy } = req.query;
        const order = parseOrderByCSV(orderBy) || ["B1_COD ASC"];

        const result = await repo.getAllProducts({
            page: Number(page),
            limit: Number(limit),
            orderBy: order,
        });

        res.status(200).json(result);
    })
);

// GET /api/products/code/:code -> objeto único (sem paginação)
router.get(
    "/code/:code",
    validate(codeParamsSchema),
    asyncHandler(async (req, res) => {
        const { code } = req.params;
        const result = await repo.getProductByCode(code);
        if (!result)
            throw new ApiError(404, "NOT_FOUND", "Produto não encontrado");
        res.status(200).json(result);
    })
);

// GET /api/products/description/:description -> { data, page, limit, total }
router.get(
    "/description/:description",
    validate(descriptionParamsSchema),
    asyncHandler(async (req, res) => {
        const { description } = req.params;
        const { page = 1, limit = 50, orderBy } = req.query; // <- query
        const order = parseOrderByCSV(orderBy) || ["B1_DESC ASC"];

        const result = await repo.getProductsByDescription({
            description,
            page: Number(page),
            limit: Number(limit),
            orderBy: order,
        });

        res.status(200).json(result);
    })
);

// GET /api/products/code/:code/structure
// - recursive=true (padrão): retorna ÁRVORE { code, description, type, qty, um, level, children[] }
// - recursive=false: retorna UM NÍVEL com { data, page, limit, total }
router.get(
    "/code/:code/structure",
    validate(structureSchema),
    asyncHandler(async (req, res) => {
        const { code } = req.params;
        const {
            recursive = true,
            direction = "where-used",
            maxDepth = 10,
            page,
            limit,
            orderBy,
        } = req.query;

        if (recursive) {
            const tree = await repo.getStructureByCode(code, {
                recursive: true,
                direction,
                maxDepth: Number(maxDepth),
            });
            return res.status(200).json(tree);
        }

        // modo não-recursivo: respeita paginação/ordem
        const order = parseOrderByCSV(orderBy) || ["G1_COD ASC"];
        const list = await repo.getStructureByCode(code, {
            recursive: false,
            direction,
            page: Number(page ?? 1),
            limit: Number(limit ?? 50),
            orderBy: order,
        });
        return res.status(200).json(list);
    })
);

// GET /api/products/code/:code/suppliers -> { data, page, limit, total }
router.get(
    "/code/:code/suppliers",
    validate(
        z.object({
            params: z.object({
                code: z.string().min(1, "Informe o código do produto"),
            }),
            query: listQuerySchema.shape.query,
        })
    ),
    asyncHandler(async (req, res) => {
        const { code } = req.params;
        const { page = 1, limit = 50, orderBy } = req.query;
        const order = parseOrderByCSV(orderBy) || ["A5_FORNECE ASC"];

        const result = await repo.getSuppliersByProduct(code, {
            page: Number(page),
            limit: Number(limit),
            orderBy: order,
        });

        res.status(200).json(result);
    })
);

// GET /api/products/group/:group -> { data, page, limit, total }
router.get(
    "/group/:group",
    validate(groupParamsSchema),
    asyncHandler(async (req, res) => {
        const { group } = req.params;
        const { page = 1, limit = 50, orderBy } = req.query;
        const order = parseOrderByCSV(orderBy) || ["B1_COD ASC"];

        const result = await repo.getProductByGroup(group, {
            page: Number(page),
            limit: Number(limit),
            orderBy: order,
        });

        res.status(200).json(result);
    })
);

export default router;
