import { Router } from 'express';
import { body } from 'express-validator';
import { userService } from '../services/user.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { transformUserToFrontendFormat } from '../utils/userTransform';

const router = Router();

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await userService.getUserById(req.user!.id);
    res.json({
      success: true,
      data: { user: transformUserToFrontendFormat(user) },
    });
  } catch (error) {
    next(error);
  }
});

// Update current user
router.put(
  '/me',
  authenticate,
  validate([
    body('name').optional().isString().trim(),
    body('bio').optional().isString().trim(),
    body('profilePictureUrl').optional().isURL(),
    body('expertiseAreas').optional().isArray(),
    body('industryFocus').optional().isArray(),
    body('startupStage').optional().isString().trim(),
  ]),
  async (req: AuthRequest, res, next) => {
    try {
      const user = await userService.updateUser(req.user!.id, req.body);
      res.json({
        success: true,
        data: { user: transformUserToFrontendFormat(user) },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({
      success: true,
      data: { user: transformUserToFrontendFormat(user) },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

