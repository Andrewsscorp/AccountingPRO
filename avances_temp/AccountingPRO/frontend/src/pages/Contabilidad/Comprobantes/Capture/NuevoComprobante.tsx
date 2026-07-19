import React, { useState, useEffect } from 'react';
import { Title, Text, Box, Button, Group, Flex, Breadcrumbs, Anchor, Loader, Center } from '@mantine/core';
import { IconFileInvoice, IconDeviceFloppy, IconBan, IconPrinter, IconChevronDown } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../../../components/layout/TenantLayout';

import EncabezadoForm from './EncabezadoForm';
import DetalleGrid from './DetalleGrid';
import TotalesAnexos from './TotalesAnexos';

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
        const [resTd, resPuc, resTerc, resCc] = await Promise.all([
          fetch(`http://localhost:3000/api/tipos-documento/${tenantId}/tipos-documento`).then(r => r.json()),
          fetch(`http://localhost:3000/api/contabilidad/${tenantId}/plan-cuentas`).then(r => r.json()),
          fetch(`http://localhost:3000/api/terceros/${tenantId}/terceros`).then(r => r.json()),
          fetch(`http://localhost:3000/api/centros-costo/${tenantId}/centros-costo`).then(r => r.json())
        ]);

        if (resTd.success) setTiposDocumento(resTd.data);
        if (resPuc.success) setPlanCuentas(resPuc.data.filter((c: any) => c.movimiento)); // Solo cuentas de movimiento
        if (resTerc.success) setTerceros(resTerc.data);
        if (resCc.success) setCentrosCosto(resCc.data);

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
      alert("Debe incluir al menos dos movimientos válidos");
      return;
    }
    
    if (Math.abs(diferencia) > 0.01) {
      alert(`El comprobante está descuadrado por ${Math.abs(diferencia)}`);
      return;
    }

    if (!encabezado.tipoDocumentoId || !encabezado.fecha || !encabezado.concepto) {
      alert("Faltan campos obligatorios en el encabezado");
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
        alert("Comprobante guardado con éxito: " + data.data.prefijo + data.data.numero);
        
        if (data.warning) {
          alert("AVISO AUTOMÁTICO:\n\n" + data.warning);
        }

        // Refresh TiposDocumento to get the updated consecutive number
        try {
          const resTd = await fetch(`http://localhost:3000/api/tipos-documento/${tenantId}/tipos-documento`).then(r => r.json());
          if (resTd.success) setTiposDocumento(resTd.data);
        } catch (e) {
          console.error("Error refreshing Tipos Documentos", e);
        }

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
      } else {
        alert("Error al guardar: " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al servidor");
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
      <Box pb="xl">
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
            <Button color="violet" leftSection={<IconDeviceFloppy size={18} />} onClick={handleGuardar} disabled={!isHeaderValid}>Guardar</Button>
            <Button variant="light" color="red" leftSection={<IconBan size={18} />}>Anular</Button>
            <Button variant="default" leftSection={<IconPrinter size={18} />} rightSection={<IconChevronDown size={14} />}>Imprimir</Button>
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

        <TotalesAnexos 
          comentarios={comentarios} 
          setComentarios={setComentarios} 
          debitoTotal={debitoTotal} 
          creditoTotal={creditoTotal} 
          diferencia={diferencia} 
        />

        {/* Footer shortcuts */}
        <Flex mt="xl" justify="space-between" align="center" style={{ borderTop: '1px solid #e9ecef', paddingTop: '16px' }}>
          <Group gap="xl">
            <Text size="sm" color="dimmed">Creado por: <b>Auditor Senior</b></Text>
            <Text size="sm" color="dimmed">Última modificación: <b>-</b></Text>
          </Group>
          <Group gap="md">
            <Text size="xs" fw={600}><Kbd>Enter</Kbd> Nueva línea</Text>
            <Text size="xs" fw={600}><Kbd>Tab</Kbd> Siguiente campo</Text>
            <Text size="xs" fw={600}><Kbd>Ctrl</Kbd> + <Kbd>S</Kbd> Guardar</Text>
          </Group>
        </Flex>
      </Box>
    </TenantLayout>
  );
}

// Helper para Kbd (teclas rápidas)
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <Box component="span" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', color: '#495057' }}>
      {children}
    </Box>
  );
}
