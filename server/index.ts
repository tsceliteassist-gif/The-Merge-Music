import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'node:http';
import { Server } from 'socket.io';
import { env } from './config.js';
import { apiLimiter } from './middleware/rateLimit.js';
import liveRoutes from './routes/live.js';
import giftRoutes from './routes/gifts.js';
import reportRoutes from './routes/reports.js';
import { payments, stripeRawBody, stripeWebhook } from './routes/payments.js';
import { installSocketHandlers } from './socket/index.js';

const app = express();
const server = http.createServer(app);
const corsOptions = { origin: env.CLIENT_URL, credentials: true };
const io = new Server(server, { cors: corsOptions });

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(corsOptions));
app.post('/api/payments/webhook', stripeRawBody, stripeWebhook);
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'the-merge-api' }));
app.use('/api/live', liveRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', payments);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

installSocketHandlers(io);
server.listen(env.PORT, () => console.log(`The Merge API listening on ${env.PORT}`));
