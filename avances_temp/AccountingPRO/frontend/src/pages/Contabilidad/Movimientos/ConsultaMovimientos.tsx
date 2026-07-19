import React, { useState, useEffect } from 'react';
import { 
  Box, Title, Text, Group, Button, TextInput, Table, Radio, Card,
  Select, Collapse, ActionIcon, Pagination, Badge, Stack, LoadingOverlay,
  Menu, Paper, Switch
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { 
  IconFileSpreadsheet, IconFileTypePdf, IconPrinter, IconChevronDown,
  IconChevronUp, IconSearch, IconFileDescription, IconArrowDownRight, IconArrowUpRight, IconScale
} from '@tabler/icons-react';
import '@mantine/dates/styles.css'; // Asegurar que los estilos de fechas estén cargados
import TenantLayout from '../../../components/layout/TenantLayout';
import ExportPdfModal from '../../../components/contabilidad/ExportPdfModal';

export default function ConsultaMovimientos() {
  const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalDebitos, setTotalDebitos] = useState(0);
  const [totalCreditos, setTotalCreditos] = useState(0);
  const [diferencia, setDiferencia] = useState(0);

  // Modal states
  const [pdfModalOpened, setPdfModalOpened] = useState(false);

  // Filters
  const [tipoConsulta, setTipoConsulta] = useState('Documento');
  const [filtrosAvanzadosAbiertos, setFiltrosAvanzadosAbiertos] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState('20');

  // Form values
  const [tipoDocumentoId, setTipoDocumentoId] = useState<string | null>(null);
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [cuentaId, setCuentaId] = useState<string | null>(null);
  const [terceroId, setTerceroId] = useState<string | null>(null);
  const [centroCostoId, setCentroCostoId] = useState<string | null>(null);
  const [fechaInicial, setFechaInicial] = useState<string | null>(null);
  const [fechaFinal, setFechaFinal] = useState<string | null>(null);

  // Advanced Filters
  const [montoMin, setMontoMin] = useState('');
  const [montoMax, setMontoMax] = useState('');
  const [naturaleza, setNaturaleza] = useState<string | null>('TODOS');
  const [concepto, setConcepto] = useState('');
  const [estadoDocumento, setEstadoDocumento] = useState<string | null>('TODOS');
  const [usuarioCreacion, setUsuarioCreacion] = useState('');
  const [incluirSubcentros, setIncluirSubcentros] = useState(false);

  // Options for selects
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [terceros, setTerceros] = useState<any[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<any[]>([]);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [
    page, limit, tipoConsulta, tipoDocumentoId, numeroDocumento, cuentaId, 
    terceroId, centroCostoId, fechaInicial, fechaFinal, montoMin, montoMax, 
    naturaleza, concepto, estadoDocumento, usuarioCreacion, incluirSubcentros
  ]);

  const fetchOptions = async () => {
    try {
      // Fetch Tipos Documento
      const resTd = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/tipos-documento`);
      const dataTd = await resTd.json();
      if (dataTd.success) setTiposDocumento(dataTd.data.map((d: any) => ({ value: String(d.id), label: `${d.codigo} - ${d.nombre}` })));

      // Fetch Cuentas
      const resC = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/plan-cuentas`);
      const dataC = await resC.json();
      if (dataC.success) setCuentas(dataC.data.map((c: any) => ({ value: String(c.id), label: `${c.codigo} - ${c.nombre}` })));

      // Fetch Terceros
      const resT = await fetch(`http://localhost:3000/api/empresas/${tenantId}/terceros`);
      const dataT = await resT.json();
      if (dataT.success) setTerceros(dataT.data.map((t: any) => ({ value: String(t.id), label: `${t.identificacion} - ${t.nombreComercial || t.razonSocial || (t.nombre1 + ' ' + (t.apellido1 || ''))}` })));

      // Fetch Centros
      const resCc = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/centros-costo`);
      const dataCc = await resCc.json();
      if (dataCc.success) setCentrosCosto(dataCc.data.map((c: any) => ({ value: String(c.id), label: `${c.codigo} - ${c.nombre}` })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async () => {
    // Validaciones para no traer toda la base de datos al cambiar de pestaña
    if (tipoConsulta === 'Cuenta' && !cuentaId) { setData([]); setTotalItems(0); return; }
    if (tipoConsulta === 'Tercero' && !terceroId) { setData([]); setTotalItems(0); return; }
    if (tipoConsulta === 'Centro de Costos' && !centroCostoId) { setData([]); setTotalItems(0); return; }

    setLoading(true);
    try {
      const payload = {
        tipoFiltro: tipoConsulta,
        tipoDocumentoId,
        numeroDocumento,
        cuentaId,
        terceroId,
        centroCostoId,
        fechaInicial: fechaInicial ? new Date(fechaInicial).toISOString() : undefined,
        fechaFinal: fechaFinal ? new Date(fechaFinal).toISOString() : undefined,
        montoMin, montoMax, naturaleza, concepto, estadoDocumento, usuarioCreacion, incluirSubcentros,
        tenantId,
        page,
        limit: Number(limit)
      };

      const res = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/movimientos/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data || []);
        setTotalItems(result.total || 0);
        setTotalDebitos(result.totalDebitos || 0);
        setTotalCreditos(result.totalCreditos || 0);
        setDiferencia(result.diferencia || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);
  };

  const renderFilterFields = () => {
    const renderFechas = () => (
      <Group grow style={{ flex: 2 }}>
        <DateInput
          label="Fecha Inicial"
          placeholder="DD/MM/AAAA"
          value={fechaInicial}
          onChange={setFechaInicial}
          clearable
          valueFormat="DD/MM/YYYY"
        />
        <DateInput
          label="Fecha Final"
          placeholder="DD/MM/AAAA"
          value={fechaFinal}
          onChange={setFechaFinal}
          clearable
          valueFormat="DD/MM/YYYY"
        />
      </Group>
    );

    switch (tipoConsulta) {
      case 'Documento':
        return (
          <>
            <Select
              label="Tipo de Documento"
              placeholder="Todos"
              data={tiposDocumento}
              value={tipoDocumentoId}
              onChange={setTipoDocumentoId}
              clearable
              searchable
              style={{ flex: 1 }}
            />
            <TextInput
              label="Número de Documento"
              placeholder="Ej: CE-00004310"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            {renderFechas()}
            <Select
              label="Tercero (Opcional)"
              placeholder="Buscar tercero..."
              data={terceros}
              value={terceroId}
              onChange={setTerceroId}
              clearable
              searchable
              limit={20}
              style={{ flex: 1.5 }}
            />
          </>
        );
      case 'Cuenta':
        return (
          <>
            <Select
              label="Cuenta Contable"
              placeholder="Seleccione cuenta"
              data={cuentas}
              value={cuentaId}
              onChange={setCuentaId}
              clearable
              searchable
              style={{ flex: 2 }}
            />
            {renderFechas()}
          </>
        );
      case 'Tercero':
        return (
          <>
            <Select
              label="Tercero"
              placeholder="Buscar tercero..."
              data={terceros}
              value={terceroId}
              onChange={setTerceroId}
              clearable
              searchable
              limit={20}
              style={{ flex: 2 }}
            />
            {renderFechas()}
          </>
        );
      case 'Centro de Costos':
        return (
          <>
            <Select
              label="Centro de Costos"
              placeholder="Buscar centro..."
              data={centrosCosto}
              value={centroCostoId}
              onChange={setCentroCostoId}
              clearable
              searchable
              style={{ flex: 2 }}
            />
            {renderFechas()}
          </>
        );
    }
  };

  return (
    <TenantLayout>
      <Box p="md" pos="relative">
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        
        <Group justify="space-between" mb="md">
          <Box>
            <Group gap="xs">
              <IconFileSpreadsheet size={28} color="#6741d9" />
              <Title order={2} style={{ color: '#2c2e33' }}>Consulta de Movimientos</Title>
            </Group>
            <Text size="sm" c="dimmed">Consulte los movimientos contables según los criterios que necesite.</Text>
          </Box>
          <Group>
            <Button variant="outline" color="green" leftSection={<IconFileSpreadsheet size={16} />}>Exportar Excel</Button>
            <Button variant="outline" color="red" leftSection={<IconFileTypePdf size={16} />} onClick={() => setPdfModalOpened(true)}>Exportar PDF</Button>
            <Button variant="default" leftSection={<IconPrinter size={16} />}>Imprimir</Button>
          </Group>
        </Group>

        {/* Panel de Búsqueda */}
        <Paper withBorder p="md" radius="md" mb="md">
          <Text fw={600} mb="xs">Consultar por</Text>
          <Radio.Group value={tipoConsulta} onChange={(v) => { setTipoConsulta(v); setPage(1); }} mb="md">
            <Group>
              <Radio value="Documento" label="Documento" />
              <Radio value="Cuenta" label="Cuenta" />
              <Radio value="Tercero" label="Tercero" />
              <Radio value="Centro de Costos" label="Centro de Costos" />
            </Group>
          </Radio.Group>

          <Group align="flex-end" mb="xs">
            {renderFilterFields()}
            <Button color="violet" onClick={() => { setPage(1); handleSearch(); }} leftSection={<IconSearch size={16} />}>
              Consultar
            </Button>
          </Group>

          <Button variant="subtle" size="xs" onClick={() => setFiltrosAvanzadosAbiertos((o) => !o)} leftSection={filtrosAvanzadosAbiertos ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}>
            Más filtros
          </Button>
          {filtrosAvanzadosAbiertos && (
             <Box mt="md" p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                <Text fw={600} mb="md" size="sm">Filtros Avanzados</Text>
                <Group grow mb="sm">
                  <TextInput label="Valor Mínimo" placeholder="Ej: 10000" type="number" value={montoMin} onChange={(e) => setMontoMin(e.currentTarget.value)} />
                  <TextInput label="Valor Máximo" placeholder="Ej: 5000000" type="number" value={montoMax} onChange={(e) => setMontoMax(e.currentTarget.value)} />
                  <Select label="Naturaleza" data={[{value: 'TODOS', label: 'Todos'}, {value: 'DEBITO', label: 'Solo Débitos'}, {value: 'CREDITO', label: 'Solo Créditos'}]} value={naturaleza} onChange={setNaturaleza} />
                </Group>
                <Group grow mb="sm">
                  <TextInput label="Concepto / Detalle" placeholder="Buscar palabras clave..." value={concepto} onChange={(e) => setConcepto(e.currentTarget.value)} />
                  <Select label="Estado Documento" data={[{value: 'TODOS', label: 'Todos'}, {value: 'ASENTADO', label: 'Asentados'}, {value: 'BORRADOR', label: 'Borradores'}, {value: 'ANULADO', label: 'Anulados'}]} value={estadoDocumento} onChange={setEstadoDocumento} />
                  <TextInput label="Usuario Registro" placeholder="Buscar usuario..." value={usuarioCreacion} onChange={(e) => setUsuarioCreacion(e.currentTarget.value)} />
                </Group>
                {tipoConsulta === 'Centro de Costos' && (
                  <Switch 
                    label="Incluir movimientos de subcentros (Jerarquía)" 
                    checked={incluirSubcentros} 
                    onChange={(event) => setIncluirSubcentros(event.currentTarget.checked)} 
                    mt="md"
                  />
                )}
             </Box>
          )}
        </Paper>

        {/* Indicadores */}
        <Group grow mb="md">
          <Card withBorder radius="md" p="md">
            <Group>
              <Box style={{ backgroundColor: '#f1f3f5', padding: '10px', borderRadius: '50%' }}>
                <IconFileDescription size={24} color="#868e96" />
              </Box>
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Movimientos</Text>
                <Text fw={700} size="xl">{totalItems}</Text>
                <Text size="xs" c="dimmed">registros encontrados</Text>
              </Box>
            </Group>
          </Card>
          
          <Card withBorder radius="md" p="md">
            <Group>
              <Box style={{ backgroundColor: '#eebefa', padding: '10px', borderRadius: '50%' }}>
                <IconArrowDownRight size={24} color="#0ca678" />
              </Box>
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Débitos</Text>
                <Text fw={700} size="xl" c="green">{formatCurrency(totalDebitos)}</Text>
              </Box>
            </Group>
          </Card>

          <Card withBorder radius="md" p="md">
            <Group>
              <Box style={{ backgroundColor: '#ffe3e3', padding: '10px', borderRadius: '50%' }}>
                <IconArrowUpRight size={24} color="#fa5252" />
              </Box>
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Créditos</Text>
                <Text fw={700} size="xl" c="red">{formatCurrency(totalCreditos)}</Text>
              </Box>
            </Group>
          </Card>

          <Card withBorder radius="md" p="md">
            <Group>
              <Box style={{ backgroundColor: '#e7f5ff', padding: '10px', borderRadius: '50%' }}>
                <IconScale size={24} color="#228be6" />
              </Box>
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Diferencia</Text>
                <Text fw={700} size="xl" c={diferencia === 0 ? "green" : "red"}>{formatCurrency(Math.abs(diferencia))}</Text>
                <Text size="xs" c={diferencia === 0 ? "green" : "red"} fw={600}>{diferencia === 0 ? "Balanceado" : "Descuadrado"}</Text>
              </Box>
            </Group>
          </Card>
        </Group>

        {/* Grilla */}
        <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
          <Table striped highlightOnHover verticalSpacing="sm" style={{ minWidth: 1000 }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Documento</Table.Th>
                <Table.Th>Tipo Doc.</Table.Th>
                <Table.Th>Cuenta</Table.Th>
                <Table.Th>Descripción Cuenta</Table.Th>
                <Table.Th>Concepto</Table.Th>
                <Table.Th>Tercero</Table.Th>
                <Table.Th>Centro de Costo</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Débito</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Crédito</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Saldo</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.length > 0 ? data.map((row, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{new Date(row.fecha).toLocaleDateString()}</Table.Td>
                  <Table.Td c="blue" style={{ cursor: 'pointer', fontWeight: 600 }}>{row.documento}</Table.Td>
                  <Table.Td>{row.tipoDocumento}</Table.Td>
                  <Table.Td>{row.cuenta}</Table.Td>
                  <Table.Td>{row.descripcionCuenta}</Table.Td>
                  <Table.Td>{row.concepto}</Table.Td>
                  <Table.Td>{row.tercero}</Table.Td>
                  <Table.Td>{row.centroCosto}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(row.debito)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(row.credito)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right', color: row.saldo < 0 ? 'red' : 'inherit' }}>{formatCurrency(row.saldo)}</Table.Td>
                </Table.Tr>
              )) : (
                <Table.Tr>
                  <Table.Td colSpan={11} style={{ textAlign: 'center', padding: '30px' }}>
                    <Text c="dimmed">No se encontraron movimientos para los filtros seleccionados.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
          
          <Box p="sm" style={{ borderTop: '1px solid #dee2e6' }}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Mostrando {data.length > 0 ? (page - 1) * Number(limit) + 1 : 0} a {Math.min(page * Number(limit), totalItems)} de {totalItems} registros
              </Text>
              <Group>
                <Select
                  value={limit}
                  onChange={(v) => { setLimit(v || '20'); setPage(1); }}
                  data={['10', '20', '50', '100']}
                  style={{ width: 80 }}
                  size="sm"
                />
                <Text size="sm" c="dimmed">por página</Text>
                <Pagination total={Math.max(1, Math.ceil(totalItems / Number(limit)))} value={page} onChange={setPage} color="violet" size="sm" />
              </Group>
            </Group>
          </Box>
        </Paper>
      </Box>

      <ExportPdfModal 
        opened={pdfModalOpened}
        onClose={() => setPdfModalOpened(false)}
        tenantId={tenantId}
        dataset={data}
        filtrosActuales={{
          tipoFiltro: tipoConsulta,
          tipoDocumentoId,
          numeroDocumento,
          cuentaId,
          terceroId,
          centroCostoId,
          fechaInicial: fechaInicial ? new Date(fechaInicial).toISOString() : undefined,
          fechaFinal: fechaFinal ? new Date(fechaFinal).toISOString() : undefined,
          montoMin, montoMax, naturaleza, concepto, estadoDocumento, usuarioCreacion, incluirSubcentros
        }}
      />
    </TenantLayout>
  );
}
