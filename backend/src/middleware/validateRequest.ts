import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

export const validateRequest = (schema: ZodTypeAny) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    issues: error.issues.map(issue => ({
                        field: issue.path.join('.'),
                        message: issue.message
                    }))
                });
            }
            return res.status(400).json({ error: 'Internal validation error' });
        }
    };
};
