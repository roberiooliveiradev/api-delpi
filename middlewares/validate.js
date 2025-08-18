// middlewares/validate.js
export const validate = (schema) => (req, _res, next) => {
    try {
        const data = {
            params: req.params,
            query: req.query,
            body: req.body,
        };
        schema.parse(data);
        next();
    } catch (err) {
        const issue = err.errors?.[0];
        next({
            status: 400,
            code: "BAD_REQUEST",
            message: issue?.message || "Parâmetros inválidos",
            details: err.errors,
        });
    }
};
