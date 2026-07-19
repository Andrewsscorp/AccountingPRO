import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CrearEmpresa from './pages/CrearEmpresa';
import DashboardContabilidad from './pages/Contabilidad/DashboardContabilidad';
import PlanCuentas from './pages/Contabilidad/PlanCuentas';
import TiposDocumento from './pages/Contabilidad/TiposDocumento/TiposDocumento';
import CentrosCosto from './pages/Contabilidad/CentrosCosto/CentrosCosto';
import ConsultaMovimientos from './pages/Contabilidad/Movimientos/ConsultaMovimientos';
import NuevoComprobante from './pages/Contabilidad/Comprobantes/Capture/NuevoComprobante';
import ImportarMovimientos from './pages/Contabilidad/Importar/ImportarMovimientos';
import Terceros from './pages/Terceros/Terceros';
import Configuracion from './pages/Configuracion';
import AjustesModulo from './pages/Configuracion/Ajustes';
import DatosEmpresa from './pages/Configuracion/Empresa';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/crear-empresa" element={<CrearEmpresa />} />
        <Route path="/contabilidad" element={<DashboardContabilidad />} />
        <Route path="/contabilidad/plan-cuentas" element={<PlanCuentas />} />
        <Route path="/contabilidad/tipos-documento" element={<TiposDocumento />} />
        <Route path="/contabilidad/centros-costo" element={<CentrosCosto />} />
        <Route path="/contabilidad/movimientos" element={<ConsultaMovimientos />} />
        <Route path="/contabilidad/comprobantes" element={<NuevoComprobante />} />
        <Route path="/contabilidad/importar" element={<ImportarMovimientos />} />
        <Route path="/terceros" element={<Terceros />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/configuracion/ajustes" element={<AjustesModulo />} />
        <Route path="/configuracion/empresa" element={<DatosEmpresa />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
