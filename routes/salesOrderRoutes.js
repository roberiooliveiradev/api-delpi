import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validate } from "../middlewares/validate.js";
import SalesOrdersRepository from "../repository/SalesOrdersRepository.js";

const router = Router();
const repo = new SalesOrdersRepository();

/** Schemas (Zod) */
const listQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).default(1).optional(),
        limit: z.coerce.number().int().min(1).max(1000).default(50).optional(),
        orderBy: z.string().optional(), // CSV ex: "C6_NUM asc,C6_ITEM asc"
        num: z.string().optional(),
        cli: z.string().optional(),
        loja: z.string().optional(),
        filial: z.string().optional(),
        produto: z.string().optional(),
        emissaoFrom: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
            .optional(),
        emissaoTo: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
            .optional(),
        entregaFrom: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
            .optional(),
        entregaTo: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
            .optional(),
        pending: z.coerce.boolean().optional(),
        overdue: z.coerce.boolean().optional(), // <- NOVO
    }),
});

const numParamsSchema = z.object({
    params: z.object({
        num: z.string().min(1, "Informe o código do pedido"),
    }),
});

/** GET /api/sales-orders
 * Lista itens de pedidos com filtros e paginação
 */
router.get(
    "/",
    validate(listQuerySchema),
    asyncHandler(async (req, res) => {
        const {
            page,
            limit,
            orderBy,
            num,
            cli,
            loja,
            filial,
            produto,
            emissaoFrom,
            emissaoTo,
            entregaFrom,
            entregaTo,
            pending,
            overdue,
        } = req.query;

        const result = await repo.getAllOrders({
            page: Number(page),
            limit: Number(limit),
            orderBy: orderBy ?? ["C6_NUM ASC", "C6_ITEM ASC"],
            filters: {
                num,
                cli,
                loja,
                filial,
                produto,
                emissaoFrom,
                emissaoTo,
                entregaFrom,
                entregaTo,
                pending:
                    pending === undefined
                        ? null
                        : pending === "true" || pending === true,
                overdue:
                    overdue === undefined
                        ? null
                        : overdue === "true" || overdue === true,
            },
        });

        res.json(result);
    })
);

/** GET /api/sales-orders/:num
 * Retorna cabeçalho + itens do pedido
 */
router.get(
    "/:num",
    validate(numParamsSchema),
    asyncHandler(async (req, res) => {
        const { num } = req.params;
        const data = await repo.getOrderByNum(num);
        res.json(data);
    })
);

export default router;
