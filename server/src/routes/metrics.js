import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('lab'), async (req, res) => {
  const labR = await pool.query('SELECT id FROM labs WHERE user_id = $1', [req.user.id]);
  if (!labR.rows.length) {
    return res.json({
      totalSamples: 0,
      pendingTests: 0,
      completedReports: 0,
      avgTurnaroundHours: null,
      delayedSamples: 0,
    });
  }
  const labId = labR.rows[0].id;

  const counts = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status <> 'completed')::int AS pending,
       COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
     FROM samples WHERE lab_id = $1`,
    [labId]
  );

  const repCount = await pool.query(
    `SELECT COUNT(*)::int AS n FROM reports WHERE lab_id = $1`,
    [labId]
  );

  const turnaround = await pool.query(
    `SELECT
       AVG(EXTRACT(EPOCH FROM (completed_at - collected_at)) / 3600) AS avg_hours,
       COUNT(*) FILTER (
         WHERE completed_at IS NOT NULL
         AND EXTRACT(EPOCH FROM (completed_at - collected_at)) / 3600 > 72
       )::int AS delayed
     FROM samples
     WHERE lab_id = $1`,
    [labId]
  );

  const c = counts.rows[0];
  const t = turnaround.rows[0];

  res.json({
    totalSamples: c.total,
    pendingTests: c.pending,
    completedSamples: c.completed,
    completedReports: repCount.rows[0].n,
    avgTurnaroundHours: t.avg_hours != null ? Number(t.avg_hours.toFixed(2)) : null,
    delayedSamples: t.delayed,
  });
});

export default router;
