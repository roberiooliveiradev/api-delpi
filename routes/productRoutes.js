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
        limit: z.coerce.number().int().min(1).max(200).default(50).optional(),
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

// GET /api/products/code/:code/structure -> { data, page, limit, total }
router.get(
    "/code/:code/structure",
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
        const order = parseOrderByCSV(orderBy) || ["G1_COD ASC"];

        const result = await repo.getStructureByCode(code, {
            page: Number(page),
            limit: Number(limit),
            orderBy: order,
        });
        res.status(200).json(result);
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
