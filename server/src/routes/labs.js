import { Router } from 'express';
import { param, validationResult } from 'express-validator';
import { pool } from '../db.js';

const router = Router();

router.get(
  '/:id',
  [param('id').isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { rows } = await pool.query(
      `SELECT l.id, l.name, l.accreditation, l.rating, l.processing_details, l.created_at,
              u.email AS contact_email
       FROM labs l
       JOIN users u ON u.id = l.user_id
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Lab not found' });
    const row = rows[0];
    res.json({
      lab: {
        id: row.id,
        name: row.name,
        accreditation: row.accreditation,
        rating: row.rating != null ? Number(row.rating) : null,
        processingDetails: row.processing_details,
        createdAt: row.created_at,
        contactEmail: row.contact_email,
      },
    });
  }
);

export default router;
