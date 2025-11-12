import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError, errorCodes } from '../utils/errors';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorDetails: Record<string, string[]> = {};
        errors.array().forEach((error) => {
          const field = error.type === 'field' ? error.path : 'general';
          if (!errorDetails[field]) {
            errorDetails[field] = [];
          }
          errorDetails[field].push(error.msg);
        });

        const validationError = new AppError(422, errorCodes.VALIDATION_ERROR, 'Validation failed', errorDetails);
        return next(validationError);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

