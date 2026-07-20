import React, { useEffect, useState } from 'react';
import { Container, Title, Paper, Table, Text, Button, Group, Badge, Loader, Center, ActionIcon, TextInput, Select, Checkbox, ScrollArea } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconFileExport, IconArrowLeft, IconSearch, IconDownload } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { exportBalancePDF, exportBalanceExcel } from '../../../utils/exportBalance';

export default function BalancePrueba() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState<any[]>([]);
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [fechaHasta, setFechaHasta] = useState<Date | null>(new Date());
  const [mostrarCuentas, setMostrarCuentas] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuentas, setSelectedCuentas] = useState<number[]>([]);

  const fetchBalance = async () => {
    if (!fechaDesde || !fechaHasta) return;
    setLoading(true);
    try {
      const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';
      const desdeIso = fechaDesde.toISOString();
      const hastaIso = fechaHasta.toISOString();
      
      const res = await fetch(`http://localhost:8080/api/fast-balance?fechaDesde=${desdeIso}&fechaHasta=${hastaIso}`, {
        headers: { 'x-tenant-id': tenantId }
      });
      const data = await res.json();
      if (data.success) {
        setCuentas(data.data);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []); // Only fetch on mount

  const handleExportPDF = async () => {
    const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';
    const res = await fetch(`http://localhost:3000/api/configuracion/empresa`, { headers: { 'x-tenant-id': tenantId } });
    const data = await res.json();
    exportBalancePDF(filteredCuentas, resumenTotales, data.success ? data.data : null, { desde: fechaDesde, hasta: fechaHasta });
  };

  const handleExportExcel = async () => {
    const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';
    const res = await fetch(`http://localhost:3000/api/configuracion/empresa`, { headers: { 'x-tenant-id': tenantId } });
    const data = await res.json();
    exportBalanceExcel(filteredCuentas, resumenTotales, data.success ? data.data : null, { desde: fechaDesde, hasta: fechaHasta });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
  };

  // Filtrado
  const filteredCuentas = cuentas.filter(c => {
    // 1. Mostrar cuentas select
    if (mostrarCuentas === 'Con Movimiento') {
      if (c.debitos === 0 && c.creditos === 0) return false;
    } else if (mostrarCuentas === 'Ocultar Cero') {
      if (c.saldoInicial === 0 && c.debitos === 0 && c.creditos === 0 && c.saldoFinal === 0) return false;
    } else if (mostrarCuentas === 'Solo Seleccionadas') {
      if (!selectedCuentas.includes(c.id)) return false;
    }
    
    // 2. Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return c.codigo.toLowerCase().includes(term) || c.nombre.toLowerCase().includes(term);
    }
    
    return true;
  });

  // Calcular totales para el Resumen
  const calcularTotalRaiz = (codigo: string) => {
    const raiz = cuentas.find(c => c.codigo === codigo && c.nivel === 1);
    return raiz ? {
      saldoInicial: raiz.saldoInicial,
      debitos: raiz.debitos,
      creditos: raiz.creditos,
      saldoFinal: raiz.saldoFinal,
      naturaleza: raiz.naturaleza
    } : { saldoInicial: 0, debitos: 0, creditos: 0, saldoFinal: 0, naturaleza: '' };
  };

  const resumenTotales = {
    activo: calcularTotalRaiz('1'),
    pasivo: calcularTotalRaiz('2'),
    patrimonio: calcularTotalRaiz('3'),
    ingresos: calcularTotalRaiz('4'),
    gastos: calcularTotalRaiz('5'),
    costos: calcularTotalRaiz('6'),
  };

  // Cuadre: Total Débitos de movimiento vs Créditos (a nivel 1 es sumar 1,2,3,4,5,6...)
  // But wait! The UI shows "CUADRE" based on global Debitos and Creditos sum of ALL detail accounts OR level 1.
  // Actually, CUADRE is debits sum vs credits sum of root accounts.
  let cuadreDebitos = 0;
  let cuadreCreditos = 0;
  
  Object.values(resumenTotales).forEach(t => {
    cuadreDebitos += t.debitos;
    cuadreCreditos += t.creditos;
  });

  const handleToggleCuenta = (id: number) => {
    setSelectedCuentas(current => 
      current.includes(id) ? current.filter(cId => cId !== id) : [...current, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedCuentas.length === filteredCuentas.length) {
      setSelectedCuentas([]);
    } else {
      setSelectedCuentas(filteredCuentas.map(c => c.id));
    }
  };

  const isAllSelected = filteredCuentas.length > 0 && selectedCuentas.length === filteredCuentas.length;
  const isIndeterminate = selectedCuentas.length > 0 && selectedCuentas.length !== filteredCuentas.length;

  return (
    <Container fluid py="md" px="xl">
      <Group justify="space-between" mb="xl">
        <Group>
          <ActionIcon variant="light" size="lg" onClick={() => navigate('/contabilidad')}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Text c="dimmed" size="sm">Tesorería / Reportes / Balance de Prueba</Text>
            <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconFileExport size={24} /> Módulo de Reportes / Balance de Prueba
            </Title>
          </div>
        </Group>
        <Group>
          <Button leftSection={<IconFileExport size={16} />} color="violet" onClick={handleExportExcel} variant="outline">
            Exportar Excel
          </Button>
          <Button leftSection={<IconDownload size={16} />} color="gray" onClick={handleExportPDF} variant="outline">
            Descargar PDF
          </Button>
        </Group>
      </Group>

      <Paper shadow="sm" p="md" radius="md" withBorder mb="xl">
        <Group grow mb="md" align="flex-end">
          <DateInput
            label="Desde"
            value={fechaDesde}
            onChange={setFechaDesde}
            valueFormat="DD/MMM/YYYY"
          />
          <DateInput
            label="Hasta"
            value={fechaHasta}
            onChange={setFechaHasta}
            valueFormat="DD/MMM/YYYY"
          />
          <Select
            label="Mostrar Cuentas"
            value={mostrarCuentas}
            onChange={(val) => setMostrarCuentas(val || 'Todas')}
            data={['Todas', 'Con Movimiento', 'Ocultar Cero', 'Solo Seleccionadas']}
          />
          <TextInput
            label=" "
            placeholder="Buscar cuenta..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
          />
          <Button 
            onClick={fetchBalance} 
            loading={loading}
            color="violet"
            style={{ alignSelf: 'flex-end', height: 36 }}
          >
            Consultar
          </Button>
        </Group>

        <Group justify="space-between" mb="sm" align="center">
          <Title order={4}>Detalle de Cuentas</Title>
          <Group>
            {mostrarCuentas === 'Solo Seleccionadas' && (
              <Button variant="light" color="gray" onClick={() => setMostrarCuentas('Todas')} size="sm">
                Mostrar Todas
              </Button>
            )}
            <Button 
              color="violet" 
              size="sm"
              disabled={selectedCuentas.length === 0}
              onClick={() => setMostrarCuentas('Solo Seleccionadas')}
            >
              Filtrar Seleccionadas ({selectedCuentas.length})
            </Button>
          </Group>
        </Group>
        <ScrollArea h="calc(100vh - 460px)" offsetScrollbars>
        <Table striped highlightOnHover withTableBorder stickyHeader>
          <Table.Thead bg="gray.1">
            <Table.Tr>
              <Table.Th style={{ width: 40 }}>
                <Checkbox 
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={handleToggleAll}
                />
              </Table.Th>
              <Table.Th>Cuenta</Table.Th>
              <Table.Th>Nombre de la Cuenta</Table.Th>
              <Table.Th ta="center">Nat.</Table.Th>
              <Table.Th ta="right">Saldo Inicial</Table.Th>
              <Table.Th ta="right">Débitos</Table.Th>
              <Table.Th ta="right">Créditos</Table.Th>
              <Table.Th ta="right">Saldo Final</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Center p="xl"><Loader /></Center>
                </Table.Td>
              </Table.Tr>
            ) : filteredCuentas.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text c="dimmed" ta="center" p="md">No hay datos para mostrar</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredCuentas.map((c) => (
                <Table.Tr 
                  key={c.id} 
                  onClick={() => handleToggleCuenta(c.id)}
                  style={{ cursor: 'pointer' }}
                  bg={selectedCuentas.includes(c.id) ? 'violet.0' : undefined}
                >
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedCuentas.includes(c.id)}
                      onChange={() => handleToggleCuenta(c.id)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Text fw={c.nivel <= 3 ? 600 : 400} style={{ paddingLeft: `${(c.nivel - 1) * 15}px` }}>
                      {c.codigo}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={c.nivel <= 3 ? 600 : 400} style={{ paddingLeft: `${(c.nivel - 1) * 15}px` }}>
                      {c.nombre}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">{c.naturaleza === 'DEBITO' ? 'D' : 'C'}</Table.Td>
                  <Table.Td ta="right">{formatCurrency(c.saldoInicial)}</Table.Td>
                  <Table.Td ta="right">{formatCurrency(c.debitos)}</Table.Td>
                  <Table.Td ta="right">{formatCurrency(c.creditos)}</Table.Td>
                  <Table.Td ta="right">{formatCurrency(c.saldoFinal)}</Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        </ScrollArea>
      </Paper>

      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Title order={4} mb="sm">Resumen de Totales</Title>
        <Table striped withTableBorder>
          <Table.Thead bg="gray.1">
            <Table.Tr>
              <Table.Th>Resumen</Table.Th>
              <Table.Th ta="center">Naturaleza</Table.Th>
              <Table.Th ta="right">Saldo Inicial</Table.Th>
              <Table.Th ta="right">Débito</Table.Th>
              <Table.Th ta="right">Crédito</Table.Th>
              <Table.Th ta="right">Saldo Final</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600}>ACTIVO</Table.Td>
              <Table.Td ta="center">D</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.activo.saldoInicial)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.activo.debitos)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.activo.creditos)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.activo.saldoFinal)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>PASIVO</Table.Td>
              <Table.Td ta="center">C</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.pasivo.saldoInicial)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.pasivo.debitos)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.pasivo.creditos)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.pasivo.saldoFinal)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>PATRIMONIO</Table.Td>
              <Table.Td ta="center">C</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.patrimonio.saldoInicial)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.patrimonio.debitos)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.patrimonio.creditos)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.patrimonio.saldoFinal)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>INGRESOS</Table.Td>
              <Table.Td ta="center">C</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.ingresos.saldoInicial)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.ingresos.debitos)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.ingresos.creditos)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.ingresos.saldoFinal)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>GASTOS</Table.Td>
              <Table.Td ta="center">D</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.gastos.saldoInicial)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.gastos.debitos)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.gastos.creditos)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.gastos.saldoFinal)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>COSTOS</Table.Td>
              <Table.Td ta="center">D</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.costos.saldoInicial)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.costos.debitos)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.costos.creditos)}</Table.Td>
              <Table.Td ta="right">{formatCurrency(resumenTotales.costos.saldoFinal)}</Table.Td>
            </Table.Tr>
            
            {/* CUADRE */}
            <Table.Tr bg="gray.1">
              <Table.Td fw={700}>CUADRE</Table.Td>
              <Table.Td ta="center">-</Table.Td>
              <Table.Td ta="right">-</Table.Td>
              <Table.Td ta="right" fw={700}>{formatCurrency(cuadreDebitos)}</Table.Td>
              <Table.Td ta="right" fw={700}>{formatCurrency(cuadreCreditos)}</Table.Td>
              <Table.Td ta="right" fw={700}>
                {Math.abs(cuadreDebitos - cuadreCreditos) < 0.01 ? (
                  <Badge color="green" variant="filled">0.00</Badge>
                ) : (
                  <Text fw={700} c={Math.abs(cuadreDebitos - cuadreCreditos) < 1 ? 'green' : 'red'}>
                    {formatCurrency(Math.abs(cuadreDebitos - cuadreCreditos))}
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Paper>
    </Container>
  );
}
