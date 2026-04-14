import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import { body, param, validationResult } from 'express-validator';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { randomToken } from '../utils/crypto.js';
import { aiOcrFile, aiAnalyzeText } from '../services/aiClient.js';

const router = Router();
const uploadDir = path.join(process.cwd(), 'uploads', 'reports');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${randomToken(8)}${path.extname(file.originalname) || ''}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/');
    if (!ok) return cb(new Error('Only PDF or image uploads are allowed'));
    cb(null, true);
  },
});

function emitToUser(io, userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}

router.use(requireAuth);

async function runAnalysisPipeline(reportId, filePath, mimeType, originalName = '') {
  let ocrText = '';
  try {
    const ocr = await aiOcrFile(filePath, mimeType, originalName);
    ocrText = ocr.text || '';
  } catch (e) {
    console.warn('OCR skipped or failed', e.message);
    ocrText = '';
  }
  let structured = [];
  let summary = 'Analysis could not complete automatically. Please consult your physician.';
  let riskFlags = [];
  try {
    const analyzed = await aiAnalyzeText(ocrText || 'No text extracted from document.');
    structured = analyzed.structured || [];
    summary = analyzed.summary || summary;
    riskFlags = analyzed.risk_flags || [];
  } catch (e) {
    console.warn('Analyze failed', e.message);
  }

  await pool.query(
    `INSERT INTO report_analyses (report_id, raw_ocr_text, structured, summary, risk_flags)
     VALUES ($1, $2, $3::jsonb, $4, $5::jsonb)
     ON CONFLICT (report_id) DO UPDATE SET
       raw_ocr_text = EXCLUDED.raw_ocr_text,
       structured = EXCLUDED.structured,
       summary = EXCLUDED.summary,
       risk_flags = EXCLUDED.risk_flags,
       updated_at = NOW()`,
    [reportId, ocrText, JSON.stringify(structured), summary, JSON.stringify(riskFlags)]
  );

  return { structured, summary, riskFlags, ocrText };
}

router.post(
  '/lab',
  requireRole('lab'),
  upload.single('file'),
  body('sampleId').isUUID(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'file is required (PDF or image)' });
    }

    const io = req.app.get('io');
    const labR = await pool.query('SELECT id FROM labs WHERE user_id = $1', [req.user.id]);
    if (!labR.rows.length) return res.status(400).json({ error: 'Lab profile missing' });
    const labId = labR.rows[0].id;

    const sr = await pool.query(
      `SELECT s.id, s.patient_id, s.lab_id FROM samples s WHERE s.id = $1`,
      [req.body.sampleId]
    );
    if (!sr.rows.length) return res.status(404).json({ error: 'Sample not found' });
    const sample = sr.rows[0];
    if (sample.lab_id !== labId) {
      return res.status(403).json({ error: 'Sample does not belong to your lab' });
    }
    if (!sample.patient_id) {
      return res.status(400).json({ error: 'Link a patient to this sample before uploading a report' });
    }

    const reportCode = `REP-${randomToken(3).toUpperCase()}-${randomToken(2).toUpperCase()}`;
    const relPath = path.relative(process.cwd(), req.file.path);
    
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const blockchainHash = `0x${fileHash.substring(0, 60)}`;

    const ins = await pool.query(
      `INSERT INTO reports (report_code, sample_id, lab_id, patient_id, uploaded_by, storage_path, original_filename, mime_type, blockchain_hash, is_sealed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
       RETURNING id, report_code, created_at`,
      [
        reportCode,
        sample.id,
        labId,
        sample.patient_id,
        req.user.id,
        relPath,
        req.file.originalname,
        req.file.mimetype,
        blockchainHash,
      ]
    );
    const rep = ins.rows[0];

    let analysis = null;
    try {
      analysis = await runAnalysisPipeline(rep.id, req.file.path, req.file.mimetype, req.file.originalname);
    } catch (e) {
      console.error(e);
    }

    emitToUser(io, sample.patient_id, 'notification', {
      type: 'report_ready',
      title: 'Report ready',
      message: `Verified report ${reportCode} is available.`,
      reportId: rep.id,
      reportCode,
    });

    if (analysis?.riskFlags?.length) {
      emitToUser(io, sample.patient_id, 'notification', {
        type: 'risk_alert',
        title: 'Important: review your results',
        message: analysis.summary || 'Some values may need medical attention.',
        reportId: rep.id,
      });
    }

    res.status(201).json({
      report: {
        id: rep.id,
        reportCode: rep.report_code,
        createdAt: rep.created_at,
        verified: true,
        sealed: true,
      },
      analysis: analysis || null,
    });
  }
);

router.post(
  '/patient',
  requireRole('patient'),
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required (PDF or image)' });
    }
    const reportCode = `REP-P-${randomToken(3).toUpperCase()}-${randomToken(2).toUpperCase()}`;
    const relPath = path.relative(process.cwd(), req.file.path);

    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const blockchainHash = `0x${fileHash.substring(0, 60)}`;

    const ins = await pool.query(
      `INSERT INTO reports (report_code, sample_id, lab_id, patient_id, uploaded_by, storage_path, original_filename, mime_type, blockchain_hash, is_sealed)
       VALUES ($1, NULL, NULL, $2, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, report_code, created_at`,
      [reportCode, req.user.id, relPath, req.file.originalname, req.file.mimetype, blockchainHash]
    );
    const rep = ins.rows[0];

    let analysis = null;
    try {
      analysis = await runAnalysisPipeline(rep.id, req.file.path, req.file.mimetype, req.file.originalname);
    } catch (e) {
      console.error(e);
    }

    res.status(201).json({
      report: {
        id: rep.id,
        reportCode: rep.report_code,
        createdAt: rep.created_at,
        verified: false,
        sealed: true,
      },
      analysis: analysis || null,
    });
  }
);

router.get('/', async (req, res) => {
  if (req.user.role === 'patient') {
    const { rows } = await pool.query(
      `SELECT r.id, r.report_code, r.created_at, r.is_sealed, r.lab_id, r.sample_id, r.blockchain_hash,
              l.name AS lab_name,
              ra.summary AS analysis_summary
       FROM reports r
       LEFT JOIN labs l ON l.id = r.lab_id
       LEFT JOIN report_analyses ra ON ra.report_id = r.id
       WHERE r.patient_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    return res.json({
      reports: rows.map((row) => ({
        id: row.id,
        reportCode: row.report_code,
        createdAt: row.created_at,
        sealed: row.is_sealed,
        labName: row.lab_name,
        sampleId: row.sample_id,
        verified: Boolean(row.lab_id),
        blockchainHash: row.blockchain_hash,
        summary: row.analysis_summary,
      })),
    });
  }

  if (req.user.role === 'lab') {
    const labR = await pool.query('SELECT id FROM labs WHERE user_id = $1', [req.user.id]);
    if (!labR.rows.length) return res.json({ reports: [] });
    const labId = labR.rows[0].id;
    const { rows } = await pool.query(
      `SELECT r.id, r.report_code, r.created_at, r.is_sealed, r.patient_id, r.sample_id, r.blockchain_hash,
              u.full_name AS patient_name,
              ra.summary AS analysis_summary
       FROM reports r
       JOIN users u ON u.id = r.patient_id
       LEFT JOIN report_analyses ra ON ra.report_id = r.id
       WHERE r.lab_id = $1
       ORDER BY r.created_at DESC`,
      [labId]
    );
    return res.json({
      reports: rows.map((row) => ({
        id: row.id,
        reportCode: row.report_code,
        createdAt: row.created_at,
        sealed: row.is_sealed,
        patientName: row.patient_name,
        patientId: row.patient_id,
        sampleId: row.sample_id,
        blockchainHash: row.blockchain_hash,
        summary: row.analysis_summary,
      })),
    });
  }

  return res.status(403).json({ error: 'Forbidden' });
});

router.get('/:id/download', [param('id').isUUID()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { rows } = await pool.query(
    'SELECT storage_path, original_filename, mime_type, patient_id, lab_id FROM reports WHERE id = $1',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const r = rows[0];

  if (req.user.role === 'patient' && r.patient_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.user.role === 'lab') {
    const labR = await pool.query('SELECT id FROM labs WHERE user_id = $1', [req.user.id]);
    if (!labR.rows.length || r.lab_id !== labR.rows[0].id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  const abs = path.join(process.cwd(), r.storage_path);
  if (!fs.existsSync(abs)) return res.status(404).json({ error: 'File missing' });
  res.download(abs, r.original_filename);
});

router.get('/:id', [param('id').isUUID()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { rows } = await pool.query(
    `SELECT r.*, l.name AS lab_name, l.accreditation AS lab_accreditation, l.rating AS lab_rating
     FROM reports r
     LEFT JOIN labs l ON l.id = r.lab_id
     WHERE r.id = $1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Report not found' });
  const r = rows[0];

  if (req.user.role === 'patient' && r.patient_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.user.role === 'lab') {
    const labR = await pool.query('SELECT id FROM labs WHERE user_id = $1', [req.user.id]);
    if (!labR.rows.length || r.lab_id !== labR.rows[0].id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  const ar = await pool.query(
    `SELECT structured, summary, risk_flags, raw_ocr_text, created_at, updated_at
     FROM report_analyses WHERE report_id = $1`,
    [r.id]
  );
  const analysis = ar.rows[0] || null;

  res.json({
    report: {
      id: r.id,
      reportCode: r.report_code,
      createdAt: r.created_at,
      sealed: r.is_sealed,
      verified: Boolean(r.lab_id),
      mimeType: r.mime_type,
      originalFilename: r.original_filename,
      lab: r.lab_id
        ? {
            name: r.lab_name,
            accreditation: r.lab_accreditation,
            rating: r.lab_rating != null ? Number(r.lab_rating) : null,
          }
        : null,
      blockchainHash: r.blockchain_hash,
    },
    analysis: analysis
      ? {
          structured: analysis.structured,
          summary: analysis.summary,
          riskFlags: analysis.risk_flags,
          createdAt: analysis.created_at,
          updatedAt: analysis.updated_at,
        }
      : null,
  });
});

export default router;
