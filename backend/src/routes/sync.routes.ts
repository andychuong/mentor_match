import { Router } from 'express';
import { airtableService } from '../services/airtable.service';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Manual sync trigger (admin only)
router.post(
  '/airtable/:userId',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      await airtableService.syncUserToAirtable(req.params.userId);
      res.json({
        success: true,
        message: 'Sync initiated',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get sync status
router.get('/status/:userId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // Only allow users to check their own status or admins
    if (req.params.userId !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
      return;
    }

    const { prisma } = await import('../config/database');
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        airtableSyncStatus: true,
        airtableRecordId: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        syncStatus: user.airtableSyncStatus,
        airtableRecordId: user.airtableRecordId,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

