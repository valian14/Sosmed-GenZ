import { Request, Response, NextFunction } from 'express';

const escapeHtml = (unsafe: string) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
        return escapeHtml(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (typeof obj === 'object' && obj !== null) {
        const sanitizedObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                sanitizedObj[key] = sanitizeObject(obj[key]);
            }
        }
        return sanitizedObj;
    }
    return obj;
};

export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        const sanitized = sanitizeObject(req.query);
        for (const key in req.query) {
            delete req.query[key];
        }
        Object.assign(req.query, sanitized);
    }
    next();
};
