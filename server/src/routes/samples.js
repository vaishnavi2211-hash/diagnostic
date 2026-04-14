import { Router } from 'express';
import QRCode from 'qrcode';
import { body, param, validationResult } from 'express-validator';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { randomToken } from '../utils/crypto.js';

const router = Router();

function emitToUser(io, userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}

function sampleSelect() {
  return `s.id, s.sample_code, s.qr_token, s.lab_id, s.patient_id, s.status::text,
          s.collected_at, s.dispatched_at, s.processing_at, s.completed_at,
          s.test_name, s.notes, s.created_at, s.updated_at,
          l.name AS lab_name, l.accreditation AS lab_accreditation, l.rating AS lab_rating`;
}

router.use(requireAuth);

router.post(
  '/',
  requireRole('lab'),
  [
    body('testName').optional().trim(),
    body('notes').optional().trim(),
    body('patientEmail').optional().isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const io = req.app.get('io');
    const { testName, notes, patientEmail } = req.body;

    const labR = await pool.query('SELECT id FROM labs WHERE user_id = $1', [req.user.id]);
    if (!labR.rows.length) {
      return res.status(400).json({ error: 'Lab profile missing' });
    }
    const labId = labR.rows[0].id;

    let patientId = null;
    if (patientEmail) {
      const pr = await pool.query(
        `SELECT id FROM users WHERE email = $1 AND role = 'patient'::user_role`,
        [patientEmail]
      );
      if (pr.rows.length) patientId = pr.rows[0].id;
    }

    const sampleCode = `SMP-${randomToken(3).toUpperCase()}-${randomToken(2).toUpperCase()}`;
    const qrToken = randomToken(16);

    const ins = await pool.query(
      `INSERT INTO samples (sample_code, qr_token, lab_id, patient_id, test_name, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [sampleCode, qrToken, labId, patientId, testName || null, notes || null]
    );
    
    const newId = ins.rows[0].id;
    const fetchRow = await pool.query(
      `SELECT ${sampleSelect()} FROM samples s JOIN labs l ON l.id = s.lab_id WHERE s.id = $1`,
      [newId]
    );
    const row = fetchRow.rows[0];
    const trackUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:5173'}/patient/track/${sampleCode}`;
    let qrDataUrl = null;
    try {
      qrDataUrl = await QRCode.toDataURL(trackUrl, { width: 240, margin: 1 });
    } catch (e) {
      console.warn('QR generation failed', e);
    }

    if (patientId) {
      emitToUser(io, patientId, 'notification', {
        type: 'sample_linked',
        title: 'New sample registered',
        message: `Sample ${sampleCode} is linked to your account.`,
        sampleId: row.id,
        sampleCode,
      });
    }

    res.status(201).json({
      sample: mapSample(row),
      trackUrl,
      qrDataUrl,
    });
  }
);

router.get('/', requireRole('lab'), async (req, res) => {
  const labR = await pool.query('SELECT id FROM labs WHERE user_id = $1', [req.user.id]);
  if (!labR.rows.length) return res.json({ samples: [] });
  const labId = labR.rows[0].id;
  const { rows } = await pool.query(
    `SELECT ${sampleSelect()}
     FROM samples s
     JOIN labs l ON l.id = s.lab_id
     WHERE s.lab_id = $1
     ORDER BY s.created_at DESC`,
    [labId]
  );
  res.json({ samples: rows.map(mapSample) });
});

router.get('/patient', requireRole('patient'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${sampleSelect()}
     FROM samples s
     JOIN labs l ON l.id = s.lab_id
     WHERE s.patient_id = $1
     ORDER BY s.updated_at DESC`,
    [req.user.id]
  );
  res.json({ samples: rows.map(mapSample) });
});

router.post(
  '/claim',
  requireRole('patient'),
  [body('sampleCode').trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const code = req.body.sampleCode.toUpperCase().replace(/\s/g, '');
    const found = await pool.query(
      `SELECT id, patient_id FROM samples WHERE UPPER(REPLACE(sample_code, ' ', '')) = $1`,
      [code]
    );
    if (!found.rows.length) {
      return res.status(404).json({ error: 'Sample not found' });
    }
    const s = found.rows[0];
    if (s.patient_id && s.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'Sample already linked to another patient' });
    }
    if (!s.patient_id) {
      await pool.query(
        `UPDATE samples SET patient_id = $1, updated_at = NOW() WHERE id = $2`,
        [req.user.id, s.id]
      );
    }
    const { rows } = await pool.query(
      `SELECT ${sampleSelect()} FROM samples s JOIN labs l ON l.id = s.lab_id WHERE s.id = $1`,
      [s.id]
    );
    res.json({ sample: mapSample(rows[0]) });
  }
);

router.get(
  '/track/:code',
  requireRole('patient'),
  [param('code').trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const code = req.params.code.toUpperCase();
    const { rows } = await pool.query(
      `SELECT ${sampleSelect()}
       FROM samples s
       JOIN labs l ON l.id = s.lab_id
       WHERE UPPER(s.sample_code) = $1`,
      [code]
    );
    if (!rows.length) return res.status(404).json({ error: 'Sample not found' });
    const row = rows[0];
    if (row.patient_id && row.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'This sample is linked to another account' });
    }
    res.json({ sample: mapSample(row) });
  }
);

router.patch(
  '/:id/status',
  requireRole('lab'),
  [
    param('id').isUUID(),
    body('status').isIn(['collected', 'dispatched', 'processing', 'completed']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const io = req.app.get('io');
    const { id } = req.params;
    const { status } = req.body;

    const labR = await pool.query('SELECT id FROM labs WHERE user_id = $1', [req.user.id]);
    if (!labR.rows.length) return res.status(400).json({ error: 'Lab profile missing' });
    const labId = labR.rows[0].id;

    const timeCol =
      status === 'dispatched'
        ? 'dispatched_at'
        : status === 'processing'
          ? 'processing_at'
          : status === 'completed'
            ? 'completed_at'
            : null;

    const upd = await pool.query(
      `UPDATE samples s SET status = $1::sample_status, updated_at = NOW()
       ${timeCol ? `, ${timeCol} = COALESCE(s.${timeCol}, NOW())` : ''}
       WHERE s.id = $2 AND s.lab_id = $3
       RETURNING s.id`,
      [status, id, labId]
    );

    if (!upd.rows.length) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    const { rows } = await pool.query(
      `SELECT ${sampleSelect()}
       FROM samples s
       JOIN labs l ON l.id = s.lab_id
       WHERE s.id = $1`,
      [id]
    );
    const row = rows[0];
    const patientId = row.patient_id;

    if (patientId) {
      emitToUser(io, patientId, 'notification', {
        type: 'sample_status',
        title: 'Sample status updated',
        message: `Sample ${row.sample_code} is now: ${status}.`,
        sampleId: row.id,
        status,
      });
    }

    res.json({ sample: mapSample(row) });
  }
);

router.get(
  '/:id/qr',
  requireRole('lab'),
  [param('id').isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const labR = await pool.query('SELECT id FROM labs WHERE user_id = $1', [req.user.id]);
    if (!labR.rows.length) return res.status(404).json({ error: 'Not found' });
    const { rows } = await pool.query(
      `SELECT s.sample_code FROM samples s WHERE s.id = $1 AND s.lab_id = $2`,
      [req.params.id, labR.rows[0].id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Sample not found' });
    const trackUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:5173'}/patient/track/${rows[0].sample_code}`;
    const qrDataUrl = await QRCode.toDataURL(trackUrl, { width: 280, margin: 1 });
    res.json({ trackUrl, qrDataUrl });
  }
);

router.patch(
  '/:id/link-patient',
  requireRole('lab'),
  [param('id').isUUID(), body('patientEmail').isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const labR = await pool.query('SELECT id FROM labs WHERE user_id = $1', [req.user.id]);
    if (!labR.rows.length) return res.status(400).json({ error: 'Lab profile missing' });
    const pr = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND role = 'patient'::user_role`,
      [req.body.patientEmail]
    );
    if (!pr.rows.length) {
      return res.status(404).json({ error: 'Patient email not found' });
    }
    const patientId = pr.rows[0].id;
    const upd = await pool.query(
      `UPDATE samples SET patient_id = $1, updated_at = NOW()
       WHERE id = $2 AND lab_id = $3
       RETURNING id`,
      [patientId, req.params.id, labR.rows[0].id]
    );
    if (!upd.rows.length) return res.status(404).json({ error: 'Sample not found' });
    const { rows } = await pool.query(
      `SELECT ${sampleSelect()} FROM samples s JOIN labs l ON l.id = s.lab_id WHERE s.id = $1`,
      [req.params.id]
    );
    res.json({ sample: mapSample(rows[0]) });
  }
);

function mapSample(row) {
  return {
    id: row.id,
    sampleCode: row.sample_code,
    qrToken: row.qr_token,
    labId: row.lab_id,
    patientId: row.patient_id,
    status: row.status,
    collectedAt: row.collected_at,
    dispatchedAt: row.dispatched_at,
    processingAt: row.processing_at,
    completedAt: row.completed_at,
    testName: row.test_name,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lab: {
      name: row.lab_name,
      accreditation: row.lab_accreditation,
      rating: row.lab_rating != null ? Number(row.lab_rating) : null,
    },
  };
}

export default router;
