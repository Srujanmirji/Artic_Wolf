import express from 'express';
import cors from 'cors';
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

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
