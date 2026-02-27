import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import forecastRoutes from './routes/forecastRoutes';
import scenarioRoutes from './routes/scenarioRoutes';
import newsRoutes from './routes/newsRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import syncRoutes from './routes/syncRoutes';
import sentimentRoutes from './routes/sentimentRoutes';
import newsImpactRoutes from './routes/newsImpactRoutes';
import transferRoutes from './routes/transferRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://www.aagam.pro', 'https://artic-wolf-51cx.vercel.app']
        : true,
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Global Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use('/api', apiLimiter);

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/sales', inventoryRoutes); // Using for /api/sales/upload
app.use('/api/inventory', inventoryRoutes); // Using for /api/inventory/metrics
app.use('/api/forecast', forecastRoutes);
app.use('/api/scenario', scenarioRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/sentiment', sentimentRoutes);
app.use('/api/news-impact', newsImpactRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler to prevent leaking sensitive stack traces
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Server Error:', err.message);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(err.status || 500).json({
        error: isProd ? 'Internal Server Error' : err.message,
        // Optional: Provide request ID for tracking
        reqId: req.headers['x-request-id'] || 'N/A'
    });
});

// Export the app for Vercel Serverless Functions
export default app;

// Only start the server if not running on Vercel
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
