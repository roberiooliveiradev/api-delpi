// routes/systemRoutes.js
import { Router } from "express";
import SystemRepository from "../repository/SystemRepository.js";

// Middlewares utilitários (criados nas etapas anteriores)
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { validate } from "../middlewares/validate.js";

import { z } from "zod";

const router = Router();
const repo = new SystemRepository();

/**
 * Schema de validação
 * - tablename: somente letras, números e underline (compatível com sanitize de identificadores)
 */
const tableColumnsSchema = z.object({
    params: z.object({
        tablename: z
            .string()
            .regex(
                /^[A-Za-z0-9_]+$/,
                "Nome de tabela inválido (use apenas letras, números e _)"
            ),
    }),
});

/**
 * GET /api/system/tables
 * Lista todas as tabelas de usuário (com descrição quando houver).
 */
router.get(
    "/tables",
    asyncHandler(async (_req, res) => {
        const result = await repo.getAllTables();
        res.status(200).json(result);
    })
);

/**
 * GET /api/system/tables/:tablename/columns
 * Lista colunas da tabela (mantém ordem física por column_id).
 * - Se a tabela não existir (array vazio), retorna 404 padronizado.
 */
router.get(
    "/tables/:tablename/columns",
    validate(tableColumnsSchema),
    asyncHandler(async (req, res) => {
        const { tablename } = req.params;
        const result = await repo.getColumnsTable(tablename);

        if (!result || result.length === 0) {
            throw new ApiError(
                404,
                "NOT_FOUND",
                `Tabela "${tablename}" não encontrada`
            );
        }

        res.status(200).json(result);
    })
);

export default router;
