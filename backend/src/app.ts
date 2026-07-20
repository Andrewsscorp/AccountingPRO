import express from 'express';
import cors from 'cors';
import path from 'path';
import empresasRoutes from './routes/empresas.routes';
import contabilidadRoutes from './routes/contabilidad.routes';
import firmantesRoutes from './routes/firmantes.routes';
import configuracionEmpresaRoutes from './routes/configuracionEmpresa.routes';
import importacionesRoutes from './routes/importaciones.routes';
import authRoutes from './routes/auth.routes';

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir la carpeta de uploads de manera estática
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/contabilidad', contabilidadRoutes);
import docLibreriaRoutes from './routes/docLibreria.routes';
app.use('/api/contabilidad', docLibreriaRoutes);
import comprobantesRoutes from './routes/comprobantes.routes';
app.use('/api/contabilidad', comprobantesRoutes);
app.use('/api/configuracion/firmantes', firmantesRoutes);
app.use('/api/configuracion/empresa', configuracionEmpresaRoutes);
app.use('/api/importaciones', importacionesRoutes);

import movimientosBancosRoutes from './routes/movimientosBancos.routes';
app.use('/api/tesoreria/movimientos', movimientosBancosRoutes);
import reportesRoutes from './routes/reportes.routes';
app.use('/api/reportes', reportesRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AccountingPRO API is running' });
});

export default app;
