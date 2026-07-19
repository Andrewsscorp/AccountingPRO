import {
  Group,
  Text,
  Card,
  SimpleGrid,
  Title,
  ThemeIcon,
  Button,
  Box,
  Flex
} from '@mantine/core';
import {
  IconBuildingBank,
  IconReceipt2,
  IconUsers,
  IconChartBar,
  IconUserDollar,
  IconFileInvoice,
  IconDeviceDesktopAnalytics,
  IconSettings,
  IconFileText,
  IconUserPlus,
  IconListSearch,
  IconScale,
  IconCash,
  IconReceiptRefund,
  IconTrendingUp,
  IconSitemap,
  IconCalendarEvent,
  IconCoin,
  IconCalendarDue,
  IconArrowRight,
  IconPlus
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TenantLayout from '../components/layout/TenantLayout';

const modules = [
  { title: 'Contabilidad', desc: 'Comprobantes, movimientos, libros y cierres contables.', icon: IconReceipt2, color: 'violet', path: '/contabilidad' },
  { title: 'Tesorería', desc: 'Bancos, recibos, egresos y conciliaciones.', icon: IconBuildingBank, color: 'green' },
  { title: 'Terceros', desc: 'Administración e información de terceros.', icon: IconUsers, color: 'blue', path: '/terceros' },
  { title: 'Reportes', desc: 'Estados financieros y reportes gerenciales.', icon: IconChartBar, color: 'orange' },
  { title: 'Cuentas por Cobrar', desc: 'Facturas, abonos, cartera y estados de cuenta.', icon: IconUserDollar, color: 'teal' },
  { title: 'Cuentas por Pagar', desc: 'Facturas proveedor, pagos y vencimientos.', icon: IconFileInvoice, color: 'red' },
  { title: 'Activos Fijos', desc: 'Administración de activos fijos e intangibles.', icon: IconDeviceDesktopAnalytics, color: 'yellow' },
  { title: 'Configuración', desc: 'Parámetros del sistema, usuarios y permisos.', icon: IconSettings, color: 'gray', path: '/configuracion' },
];

const quickAccess = [
  { title: 'Nuevo Comprobante', icon: IconFileText, color: 'violet' },
  { title: 'Nuevo Tercero', icon: IconUserPlus, color: 'blue' },
  { title: 'Consultar Movimientos', icon: IconListSearch, color: 'green', path: '/contabilidad/movimientos' },
  { title: 'Balance de Prueba', icon: IconScale, color: 'orange' },
  { title: 'Recibo de Caja', icon: IconCash, color: 'teal' },
  { title: 'Comprobante de Egreso', icon: IconReceiptRefund, color: 'red' },
];

const stats = [
  { title: 'Comprobantes hoy', value: '125', icon: IconReceipt2, color: 'violet' },
  { title: 'Movimientos este mes', value: '15.420', icon: IconTrendingUp, color: 'green' },
  { title: 'Terceros activos', value: '2.154', icon: IconUsers, color: 'blue' },
  { title: 'Centros de costos', value: '48', icon: IconSitemap, color: 'orange' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeEmpresa, setActiveEmpresa] = useState<any | null>(null);

  useEffect(() => {
    // Just fetch to show the current active company data in the local stats
    fetch('http://localhost:3000/api/empresas')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const savedTenantId = localStorage.getItem('activeTenantId');
          if (savedTenantId) {
             const foundEmpresa = data.data.find((e: any) => e.codigo_empresa === savedTenantId);
             setActiveEmpresa(foundEmpresa);
          } else if (data.data.length > 0) {
             setActiveEmpresa(data.data[0]);
          }
        }
      })
      .catch(console.error);
  }, []);

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
        <Group justify="space-between" align="flex-start" mb="xl">
          <Box>
            <Title order={1} style={{ fontFamily: 'Inter, sans-serif', color: '#1a1b4b' }}>Bienvenido,</Title>
            <Text size="lg" color="dimmed" mt={4} mb="md">Auditor Senior</Text>
            
            {/* AREA 1: Crear Transaccion */}
            <Button 
              size="lg" 
              color="violet" 
              radius="md" 
              leftSection={<IconPlus size={24} />} 
              onClick={() => navigate('/contabilidad/comprobantes')}
              style={{ boxShadow: '0 4px 14px 0 rgba(92, 60, 230, 0.39)' }}
            >
              Crear Transacción
            </Button>
          </Box>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
          {modules.map((mod) => (
            <Card key={mod.title} className="dashboard-card" shadow="sm" padding="lg" radius="md" withBorder onClick={() => mod.path ? navigate(mod.path) : null}>
              <ThemeIcon variant="light" color={mod.color} size={48} radius="md" mb="md">
                <mod.icon size={28} />
              </ThemeIcon>
              <Text fw={700} size="lg" mb="xs">{mod.title}</Text>
              <Text size="sm" color="dimmed" mb="md" style={{ minHeight: 40 }}>{mod.desc}</Text>
              <Flex justify="flex-end">
                <IconArrowRight size={20} color="var(--mantine-color-violet-6)" />
              </Flex>
            </Card>
          ))}
        </SimpleGrid>

        <Title order={3} mb="md" style={{ fontFamily: 'Inter, sans-serif' }}>Accesos rápidos</Title>
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md" mb="xl">
          {quickAccess.map((item) => (
            <Card key={item.title} className="dashboard-card" shadow="sm" padding="sm" radius="md" withBorder onClick={() => item.path ? navigate(item.path) : null}>
              <Group gap="sm">
                <ThemeIcon variant="light" color={item.color} size="md">
                  <item.icon size={18} />
                </ThemeIcon>
                <Text size="sm" fw={500}>{item.title}</Text>
              </Group>
            </Card>
          ))}
        </SimpleGrid>

        <Title order={3} mb="md" style={{ fontFamily: 'Inter, sans-serif' }}>Indicadores principales</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {stats.map((stat) => (
            <Card key={stat.title} className="dashboard-card" shadow="sm" padding="lg" radius="md" withBorder>
              <Group align="flex-start" wrap="nowrap">
                <ThemeIcon variant="light" color={stat.color} size={48} radius="md">
                  <stat.icon size={24} />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="xl">{stat.value}</Text>
                  <Text size="sm" color="dimmed">{stat.title}</Text>
                </div>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Box>
    </TenantLayout>
  );
}
