import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import samplesRoutes from './routes/samples.js';
import reportsRoutes from './routes/reports.js';
import labsRoutes from './routes/labs.js';
import chatRoutes from './routes/chat.js';
import metricsRoutes from './routes/metrics.js';

await initDb();

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: true,
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});

app.set('io', io);

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/labs', labsRoutes);
app.use('/api/samples', samplesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/lab/metrics', metricsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || (err.message?.includes('upload') ? 400 : 500);
  res.status(status).json({ error: err.message || 'Server error' });
});

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Unauthorized'));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.sub;
    socket.userRole = payload.role;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
  }
  socket.emit('connected', { ok: true });
});

const port = Number(process.env.PORT || 4000);
server.listen(port, () => {
  console.log(`API + Socket.io listening on :${port}`);
});
