import { Router } from 'express';
import { airtableService } from '../services/airtable.service';

const router = Router();

// Airtable webhook endpoint
router.post('/airtable', async (req, res, next) => {
  try {
    await airtableService.handleWebhook(req.body);
    res.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

