import { Request, Response, NextFunction } from 'express';
import { AppError, createErrorResponse } from '../utils/errors';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn(`Error ${err.statusCode}: ${err.message}`, {
      code: err.code,
      path: req.path,
      method: req.method,
      details: err.details,
    });

    res.status(err.statusCode).json(createErrorResponse(err));
    return;
  }

  // Unknown error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json(createErrorResponse(err));
};

