import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
        return purify.sanitize(obj);
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
