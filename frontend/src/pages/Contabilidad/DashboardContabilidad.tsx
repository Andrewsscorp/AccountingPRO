import {
  Group,
  Text,
  Avatar,
  Card,
  SimpleGrid,
  Title,
  ThemeIcon,
  Box,
  Flex,
  ActionIcon,
  Badge,
  Divider,
  UnstyledButton,
  Button
} from '@mantine/core';
import {
  IconBook2,
  IconFileInvoice,
  IconNumbers,
  IconReceipt2,
  IconListDetails,
  IconLock,
  IconSettings,
  IconArrowRight,
  IconArrowLeft,
  IconChartArcs,
  IconBell,
  IconHelp,
  IconBuildingBank,
  IconChevronDown,
  IconFileText,
  IconBuildingStore,
  IconPlus,
  IconSearch,
  IconClock,
  IconFileImport
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../components/layout/TenantLayout';

const modulosContabilidad = [
  { title: 'Plan de Cuentas', desc: 'Administra el catálogo de cuentas (PUC) y jerarquías.', icon: IconBook2, color: 'violet', link: '/contabilidad/plan-cuentas' },
  { title: 'Tipos de Documento', desc: 'Configura facturas, recibos, notas, etc.', icon: IconFileText, color: 'blue', link: '/contabilidad/tipos-documento' },
  { title: 'Centros de Costos', desc: 'Estructura de áreas y proyectos.', icon: IconBuildingStore, color: 'cyan', link: '/contabilidad/centros-costo' },
  { title: 'Comprobantes', desc: 'Registro de asientos y comprobantes contables.', icon: IconReceipt2, color: 'green', link: '/contabilidad/comprobantes' },
  { title: 'Movimientos', desc: 'Explorador de débitos y créditos en detalle.', icon: IconListDetails, color: 'orange', link: '/contabilidad/movimientos' },
  { title: 'Libros Oficiales', desc: 'Diario, Mayor y Balances, Auxiliares.', icon: IconBook2, color: 'teal' },
  { title: 'Cierre Contable', desc: 'Cierre de mes y año, traslado de saldos.', icon: IconLock, color: 'red' },
  { title: 'Parámetros', desc: 'Cuentas de utilidad, cierre y configuraciones base.', icon: IconSettings, color: 'gray' },
  { title: 'Importar', desc: 'Carga masiva de datos contables desde plantillas.', icon: IconFileImport, color: 'pink', link: '/contabilidad/importar' },
];

import { useEffect } from 'react';

export default function DashboardContabilidad() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }
      if (e.key === 'Enter') {
        navigate('/contabilidad/comprobantes');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <TenantLayout>
      <Box>
        <Box mb="xl">
          <Title order={1} style={{ fontFamily: 'Inter, sans-serif', color: '#1a1b4b' }}>Módulo de Contabilidad</Title>
          <Text size="lg" color="dimmed" mt={4}>Núcleo financiero y repositorio oficial de operaciones.</Text>

          <Group mt="lg" gap="md">
            <Button color="violet" size="md" radius="md" leftSection={<IconPlus size={20} />} onClick={() => navigate('/contabilidad/comprobantes')}>
              Nueva Transacción
            </Button>
            <Button variant="default" size="md" radius="md" leftSection={<IconSearch size={20} />} onClick={() => navigate('/contabilidad/movimientos')}>
              Consulta Rápida
            </Button>
            <Button variant="default" size="md" radius="md" leftSection={<IconClock size={20} />} onClick={() => navigate('/contabilidad/movimientos')}>
              Últimos Comprobantes
            </Button>
          </Group>
        </Box>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
            {modulosContabilidad.map((mod) => (
                <Card key={mod.title} className="dashboard-card" shadow="sm" padding="lg" radius="md" withBorder onClick={() => {
                  if (mod.link) navigate(mod.link);
                }}>
                  <ThemeIcon variant="light" color={mod.color} size={48} radius="md" mb="md">
                    <mod.icon size={28} />
                  </ThemeIcon>
                <Text fw={700} size="lg" mb="xs">{mod.title}</Text>
                <Text size="sm" color="dimmed" mb="md" style={{ minHeight: 40 }}>{mod.desc}</Text>
                <Flex justify="flex-end">
                  <IconArrowRight size={20} color={`var(--mantine-color-${mod.color}-6)`} />
                </Flex>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
    </TenantLayout>
  );
}
