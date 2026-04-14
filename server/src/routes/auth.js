import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { pool } from '../db.js';
import { signToken } from '../utils/tokens.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('fullName').trim().notEmpty(),
    body('role').isIn(['patient', 'lab']),
    body('labName').optional().trim(),
    body('accreditation').optional().trim(),
    body('rating').optional().isFloat({ min: 0, max: 5 }),
    body('processingDetails').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      email,
      password,
      fullName,
      role,
      labName,
      accreditation,
      rating,
      processingDetails,
    } = req.body;

    if (role === 'lab' && !labName) {
      return res.status(400).json({ error: 'Lab name is required for lab accounts' });
    }

    const client = await pool.connect();
    try {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      const hash = await bcrypt.hash(password, 12);
      await client.query('BEGIN');
      const u = await client.query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4::user_role)
         RETURNING id, email, full_name, role, created_at`,
        [email, hash, fullName, role]
      );
      const user = u.rows[0];
      if (role === 'lab') {
        await client.query(
          `INSERT INTO labs (user_id, name, accreditation, rating, processing_details)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            user.id,
            labName,
            accreditation || 'Pending verification',
            rating ?? 4.0,
            processingDetails || 'Standard diagnostic processing pipeline.',
          ]
        );
      }
      await client.query('COMMIT');
      const token = signToken(user);
      return res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          createdAt: user.created_at,
        },
      });
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(e);
      return res.status(500).json({ error: 'Registration failed' });
    } finally {
      client.release();
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, full_name, role, created_at FROM users WHERE email = $1',
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  }
);

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  const u = rows[0];
  let lab = null;
  if (u.role === 'lab') {
    const lr = await pool.query(
      `SELECT id, name, accreditation, rating, processing_details FROM labs WHERE user_id = $1`,
      [u.id]
    );
    lab = lr.rows[0] || null;
  }
  res.json({
    user: {
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      createdAt: u.created_at,
    },
    lab,
  });
});

export default router;
