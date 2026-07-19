import express from 'express';
import cors from 'cors';
import path from 'path';
import empresasRoutes from './routes/empresas.routes';
import contabilidadRoutes from './routes/contabilidad.routes';
import firmantesRoutes from './routes/firmantes.routes';
import configuracionEmpresaRoutes from './routes/configuracionEmpresa.routes';
import importacionesRoutes from './routes/importaciones.routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir la carpeta de uploads de manera estática
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/empresas', empresasRoutes);
app.use('/api/contabilidad', contabilidadRoutes);
app.use('/api/configuracion/firmantes', firmantesRoutes);
app.use('/api/configuracion/empresa', configuracionEmpresaRoutes);
app.use('/api/importaciones', importacionesRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AccountingPRO API is running' });
});

export default app;
