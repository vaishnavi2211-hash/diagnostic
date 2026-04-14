import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { aiChat } from '../services/aiClient.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole('patient'),
  [body('message').trim().isLength({ min: 1, max: 4000 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const out = await aiChat(req.body.message, req.body.context || null);
      res.json({
        reply: out.reply,
        disclaimer: out.disclaimer || 'This assistant provides general information only. Always consult a qualified doctor for medical decisions.',
      });
    } catch (e) {
      console.error(e);
      res.status(502).json({
        error: 'Assistant temporarily unavailable',
        disclaimer: 'Always consult a qualified doctor for medical decisions.',
      });
    }
  }
);

router.post(
  '/public',
  [body('message').trim().isLength({ min: 1, max: 4000 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const out = await aiChat(req.body.message, req.body.context || null);
      res.json({
        reply: out.reply,
        disclaimer: out.disclaimer || 'This assistant provides general information only.',
      });
    } catch (e) {
      console.error(e);
      res.status(502).json({
        error: 'Assistant temporarily unavailable',
      });
    }
  }
);

export default router;
