import { Router } from 'express';
import { body } from 'express-validator';
import { authService } from '../services/auth.service';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validation';
import { authenticate, AuthRequest } from '../middleware/auth';
import { transformUserToFrontendFormat } from '../utils/userTransform';

const router = Router();

router.post(
  '/login',
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      res.json({
        success: true,
        data: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: result.tokens.expiresIn,
          user: transformUserToFrontendFormat(result.user),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/refresh',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ]),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/logout', authenticate, async (_req: AuthRequest, res) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can add token blacklisting here if needed
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

router.post(
  '/reset-password',
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
  ]),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      await authService.requestPasswordReset(email);

      // Always return success for security (don't reveal if user exists)
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/reset-password/confirm',
  authLimiter,
  validate([
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ]),
  async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      await authService.confirmPasswordReset(token, newPassword);

      res.json({
        success: true,
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

