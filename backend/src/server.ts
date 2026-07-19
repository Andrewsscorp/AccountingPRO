import app from './app';
import empresaRoutes from './routes/empresas.routes';
import contabilidadRoutes from './routes/contabilidad.routes';
import tercerosRoutes from './routes/terceros.routes';
import globalsRoutes from './routes/globals.routes';
import tiposDocumentoRoutes from './routes/tiposDocumento.routes';
import centrosCostoRoutes from './routes/centrosCosto.routes';
import movimientosRoutes from './routes/movimientos.routes';
import comprobantesRoutes from './routes/comprobantes.routes';
import bancosRoutes from './routes/bancos.routes';
import sucursalesRoutes from './routes/sucursales.routes';
import cuentasBancariasRoutes from './routes/cuentasBancarias.routes';
import grupoOperacionesRoutes from './routes/grupoOperaciones.routes';

const PORT = process.env.PORT || 3000;

app.use('/api/empresas', empresaRoutes);
app.use('/api/contabilidad', contabilidadRoutes);
app.use('/api/contabilidad', movimientosRoutes); 
app.use('/api/contabilidad', comprobantesRoutes);
app.use('/api/terceros', tercerosRoutes);
app.use('/api/globals', globalsRoutes);
app.use('/api/tipos-documento', tiposDocumentoRoutes);
app.use('/api/centros-costo', centrosCostoRoutes);

// Tesorería
app.use('/api/tesoreria/bancos', bancosRoutes);
app.use('/api/tesoreria/sucursales', sucursalesRoutes);
app.use('/api/tesoreria/cuentas-bancarias', cuentasBancariasRoutes);
app.use('/api/tesoreria/grupos-operaciones', grupoOperacionesRoutes);

app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});
// Trigger reload after env update

