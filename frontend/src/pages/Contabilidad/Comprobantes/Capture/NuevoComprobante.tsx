import React, { useState, useEffect } from 'react';
import { Title, Text, Box, Button, Group, Flex, Breadcrumbs, Anchor, Loader, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFileInvoice, IconDeviceFloppy, IconBan, IconPrinter, IconChevronDown, IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../../../components/layout/TenantLayout';

import EncabezadoForm from './EncabezadoForm';
import DetalleGrid from './DetalleGrid';
import TotalesAnexos from './TotalesAnexos';
import PostSaveModal from '../../../../components/contabilidad/PostSaveModal';

type RowData = {
  id: string;
  cuentaId: string | null;
  cuentaRef: any;
  terceroId: string | null;
  centroCostoId: string | null;
  debito: number | '';
  credito: number | '';
  observacion: string;
};

export default function NuevoComprobante() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
  const [planCuentas, setPlanCuentas] = useState<any[]>([]);
  const [terceros, setTerceros] = useState<any[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<any[]>([]);
  
  const [empresa, setEmpresa] = useState<any>(null);
  const [postSaveModalOpen, setPostSaveModalOpen] = useState(false);
  const [lastSavedComprobante, setLastSavedComprobante] = useState<any>(null);

  const [encabezado, setEncabezado] = useState({
    tipoDocumentoId: null,
    numero: '',
    fecha: new Date(),
    afecta: 'CONTABLE_TRIBUTARIA',
    concepto: '',
    referencia: ''
  });

  const [rows, setRows] = useState<RowData[]>([
    { id: '1', cuentaId: null, cuentaRef: null, terceroId: null, centroCostoId: null, debito: '' as number | '', credito: '' as number | '', observacion: '' }
  ]);

  const [comentarios, setComentarios] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';
        
        // Fetch all dependencies concurrently
        const [resTd, resPuc, resTerc, resCc, resEmp] = await Promise.all([
          fetch(`http://localhost:3000/api/tipos-documento/${tenantId}/tipos-documento`).then(r => r.json()),
          fetch(`http://localhost:3000/api/contabilidad/${tenantId}/plan-cuentas`).then(r => r.json()),
          fetch(`http://localhost:3000/api/terceros/${tenantId}/terceros`).then(r => r.json()),
          fetch(`http://localhost:3000/api/centros-costo/${tenantId}/centros-costo`).then(r => r.json()),
          fetch(`http://localhost:3000/api/empresas`).then(r => r.json())
        ]);

        if (resTd.success) setTiposDocumento(resTd.data);
        if (resPuc.success) setPlanCuentas(resPuc.data.filter((c: any) => c.movimiento)); // Solo cuentas de movimiento
        if (resTerc.success) setTerceros(resTerc.data);
        if (resCc.success) setCentrosCosto(resCc.data);
        if (resEmp.success) {
          const act = resEmp.data.find((e: any) => e.codigo_empresa === tenantId);
          setEmpresa(act || resEmp.data[0]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data for capture:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const debitoTotal = rows.reduce((sum, row) => sum + (Number(row.debito) || 0), 0);
  const creditoTotal = rows.reduce((sum, row) => sum + (Number(row.credito) || 0), 0);
  const diferencia = debitoTotal - creditoTotal;

  // Header Validation Logic
  const selectedTd = tiposDocumento.find(td => td.id.toString() === encabezado.tipoDocumentoId);
  const isAutomatic = !(selectedTd?.numeraciones?.[0]?.permiteManual === true);
  const isHeaderValid = !!(encabezado.tipoDocumentoId && encabezado.fecha && (isAutomatic || encabezado.numero));

  const handleGuardar = async () => {
    const validRows = rows.filter(r => r.cuentaId && (Number(r.debito) > 0 || Number(r.credito) > 0));
    
    if (validRows.length < 2) {
      notifications.show({ title: 'Atención', message: "Debe incluir al menos dos movimientos válidos", color: 'orange' });
      return;
    }
    
    if (Math.abs(diferencia) > 0.01) {
      notifications.show({ title: 'Descuadre', message: `El comprobante está descuadrado por ${Math.abs(diferencia)}`, color: 'red' });
      return;
    }

    if (!encabezado.tipoDocumentoId || !encabezado.fecha || !encabezado.concepto) {
      notifications.show({ title: 'Faltan datos', message: "Faltan campos obligatorios en el encabezado", color: 'red' });
      return;
    }

    const payload = { encabezado, movimientos: validRows };
    const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';

    try {
      const res = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/comprobantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        const docNumber = (data.data.prefijo || '') + data.data.numero;
        notifications.show({
          title: 'Guardado exitoso',
          message: `El comprobante ${docNumber} se ha guardado correctamente.`,
          color: 'green',
          icon: <IconCheck size={16} />
        });
        
        if (data.warning) {
          notifications.show({
            title: 'Aviso Automático',
            message: data.warning,
            color: 'blue'
          });
        }

        // Set Last Saved Comprobante for Modal
        setLastSavedComprobante({
          ...encabezado,
          numero: docNumber,
          comentarios: comentarios,
          movimientos: validRows.map(m => {
            const cta = planCuentas.find(c => c.id.toString() === m.cuentaId?.toString());
            const ter = terceros.find(t => t.id.toString() === m.terceroId?.toString());
            const cc = centrosCosto.find(c => c.id.toString() === m.centroCostoId?.toString());
            return { ...m, cuentaRef: cta, terceroRef: ter, centroCostoRef: cc };
          })
        });

        // Open Modal
        setPostSaveModalOpen(true);

      } else {
        notifications.show({ title: 'Error al guardar', message: data.message, color: 'red' });
      }
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error de conexión', message: "No se pudo conectar con el servidor.", color: 'red' });
    }
  };

  const handleCloseModal = async () => {
    setPostSaveModalOpen(false);
    
    // Reset Form
    setEncabezado({
      tipoDocumentoId: null,
      numero: '',
      fecha: new Date(),
      afecta: 'CONTABLE_TRIBUTARIA',
      concepto: '',
      referencia: ''
    });
    setRows([{ id: Math.random().toString(), cuentaId: null, cuentaRef: null, terceroId: null, centroCostoId: null, debito: '', credito: '', observacion: '' }]);
    setComentarios('');

    // Refresh TiposDocumento
    const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';
    try {
      const resTd = await fetch(`http://localhost:3000/api/tipos-documento/${tenantId}/tipos-documento`).then(r => r.json());
      if (resTd.success) setTiposDocumento(resTd.data);
    } catch (e) {
      console.error("Error refreshing Tipos Documentos", e);
    }
  };

  if (loading) {
    return (
      <TenantLayout>
        <Center h="100%">
          <Loader color="violet" type="dots" />
        </Center>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Box p="md">
        {/* Breadcrumbs */}
        <Breadcrumbs mb="xs" style={{ fontSize: '12px' }}>
          <Anchor href="#" c="dimmed" onClick={(e) => { e.preventDefault(); navigate('/contabilidad'); }}>Contabilidad</Anchor>
          <Anchor href="#" c="dimmed" onClick={(e) => { e.preventDefault(); navigate('/contabilidad/comprobantes'); }}>Comprobantes</Anchor>
          <Text size="xs" fw={500} c="dark">Nuevo Comprobante</Text>
        </Breadcrumbs>

        {/* Header Actions */}
        <Flex justify="space-between" align="center" mb="lg">
          <Group gap="sm">
            <IconFileInvoice size={28} color="var(--mantine-color-violet-6)" />
            <Title order={2} style={{ fontFamily: 'Inter, sans-serif', color: '#1a1b4b' }}>Nuevo Comprobante</Title>
          </Group>

          <Group gap="sm">
            <Button variant="outline" color="violet" leftSection={<IconDeviceFloppy size={18} />}>Guardar Borrador</Button>
            <Button color="violet" leftSection={<IconDeviceFloppy size={18} />} onClick={handleGuardar} disabled={!isHeaderValid || Math.abs(diferencia) > 0.01}>Guardar</Button>
            <Button variant="light" color="red" onClick={() => navigate('/contabilidad/comprobantes')} leftSection={<IconBan size={18} />}>Cancelar</Button>
          </Group>
        </Flex>

        {/* Form Sections */}
        <EncabezadoForm 
          data={encabezado} 
          onChange={setEncabezado} 
          tiposDocumento={tiposDocumento} 
        />

        <DetalleGrid 
          rows={rows} 
          onChange={setRows} 
          planCuentas={planCuentas} 
          terceros={terceros} 
          centrosCosto={centrosCosto} 
          disabled={!isHeaderValid}
          conceptoGlobal={encabezado.concepto}
          diferencia={diferencia}
        />

        <Box mt="md">
          <TotalesAnexos 
            debitoTotal={debitoTotal}
            creditoTotal={creditoTotal}
            diferencia={diferencia}
            comentarios={comentarios}
            setComentarios={setComentarios}
          />
        </Box>
      </Box>

      {/* Post Save Modal */}
      <PostSaveModal
        opened={postSaveModalOpen}
        onClose={handleCloseModal}
        comprobante={lastSavedComprobante}
        empresa={empresa}
      />
    </TenantLayout>
  );
}
