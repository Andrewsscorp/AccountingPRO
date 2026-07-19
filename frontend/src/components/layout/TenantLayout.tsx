import React, { useState, useEffect } from 'react';
import {
  AppShell,
  Group,
  Text,
  Avatar,
  ActionIcon,
  Badge,
  Divider,
  UnstyledButton,
  Box,
  Menu,
  ThemeIcon,
  TextInput,
  Button,
  Flex
} from '@mantine/core';
import {
  IconChartArcs,
  IconBell,
  IconHelp,
  IconChevronDown,
  IconBuildingBank,
  IconSearch,
  IconPlus,
  IconCalendarEvent,
  IconClock,
  IconHome,
  IconBook2,
  IconUsers,
  IconFileText,
  IconSettings
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: IconHome },
  { label: 'Contabilidad', path: '/contabilidad', icon: IconBook2 },
  { label: 'Tesorería', path: '/tesoreria', icon: IconBuildingBank },
  { label: 'Terceros', path: '/terceros', icon: IconUsers },
  { label: 'Reportes', path: '/reportes', icon: IconFileText },
  { label: 'Configuración', path: '/configuracion', icon: IconSettings }
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [activeEmpresa, setActiveEmpresa] = useState<any | null>(null);
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Esc key global handler to go back progressively
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Prevent navigating back if a modal, menu, or popover is open
        const hasOverlay = document.querySelector(
          '.mantine-Modal-root, .mantine-Menu-dropdown, .mantine-Popover-dropdown, .mantine-Select-dropdown, .mantine-DatePicker-dropdown'
        );
        if (hasOverlay) return;

        // Prevent navigating back if user is typing in an input
        const activeElement = document.activeElement;
        if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
          return;
        }

        navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    fetch('http://localhost:3000/api/empresas')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmpresas(data.data);
          const savedTenantId = localStorage.getItem('activeTenantId');
          let foundEmpresa = null;
          if (savedTenantId) {
             foundEmpresa = data.data.find((e: any) => e.codigo_empresa === savedTenantId);
          }
          if (foundEmpresa) {
             setActiveEmpresa(foundEmpresa);
          } else if (data.data.length > 0) {
             setActiveEmpresa(data.data[0]);
             localStorage.setItem('activeTenantId', data.data[0].codigo_empresa);
          }
        }
      })
      .catch(console.error);
  }, []);

  return (
    <AppShell
      header={{ height: 130 }}
      bg="gray.0"
    >
      <AppShell.Header style={{ borderBottom: 'none' }}>
        {/* TOP ROW: Logo, Centered Nav, Profile */}
        <Flex 
          h={60} 
          px="xl" 
          justify="space-between" 
          align="center" 
          style={{ borderBottom: '1px solid #eaeaea', backgroundColor: '#fff' }}
        >
          {/* Logo (Left) */}
          <Group gap="xs" style={{ cursor: 'pointer', width: 250 }} onClick={() => navigate('/dashboard')}>
            <IconChartArcs size={28} color="#5c3ce6" />
            <Text fw={800} size="lg" style={{ fontFamily: 'Inter, sans-serif' }}>AccountingPro</Text>
          </Group>

          {/* Navigation (Center) */}
          <Group gap={0} h="100%">
            {navItems.map((item) => {
              // Special case: /contabilidad should match /contabilidad but not if we had another path like /contabilidad-reports
              const isActive = location.pathname.startsWith(item.path);
              return (
                <UnstyledButton
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    height: '100%',
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    color: isActive ? '#5c3ce6' : '#495057',
                    fontWeight: isActive ? 600 : 500,
                    borderBottom: isActive ? '3px solid #5c3ce6' : '3px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Group gap={6}>
                    <item.icon size={18} stroke={isActive ? 2 : 1.5} />
                    <Text size="sm" fw={isActive ? 600 : 500}>{item.label}</Text>
                    {item.label === 'Contabilidad' && isActive && <IconChevronDown size={14} />}
                  </Group>
                </UnstyledButton>
              );
            })}
          </Group>

          {/* Profile & Actions (Right) */}
          <Group gap="md" w={250} justify="flex-end">
            <ActionIcon variant="subtle" color="gray">
              <IconBell size={20} />
              <Badge size="xs" color="violet" circle style={{ position: 'absolute', top: 4, right: 4 }}>3</Badge>
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray">
              <IconHelp size={20} />
            </ActionIcon>

            <Group gap="xs" style={{ cursor: 'pointer' }} ml="xs">
              <Avatar color="violet" radius="xl" size="sm">AS</Avatar>
              <Box>
                <Text size="xs" fw={600} lh={1.1} c="#1a1b4b">Auditor Senior</Text>
                <Text size="10px" color="dimmed">Administrador</Text>
              </Box>
              <IconChevronDown size={14} color="gray" />
            </Group>
          </Group>
        </Flex>

        {/* BOTTOM ROW: Context Bar (Company, Period, Time) */}
        <Group 
          h={70} 
          px="xl" 
          gap="xl" 
          style={{ backgroundColor: '#fff', borderBottom: '1px solid #eaeaea', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
        >
          {/* Company Selector */}
          <Menu shadow="md" width={300}>
            <Menu.Target>
              <UnstyledButton style={{ height: '100%' }}>
                <Group gap="md">
                  <ThemeIcon variant="light" color="violet" size={40} radius="md" style={{ backgroundColor: '#f3f0ff' }}>
                    {activeEmpresa && activeEmpresa.logoUrl ? <img src={activeEmpresa.logoUrl.startsWith('data:') || activeEmpresa.logoUrl.startsWith('http') ? activeEmpresa.logoUrl : `http://localhost:3000${activeEmpresa.logoUrl}`} alt="logo" width={24} height={24} style={{ objectFit: 'contain' }} /> : <IconBuildingBank size={24} color="#5c3ce6" stroke={1.5} />}
                  </ThemeIcon>
                  <Box style={{ maxWidth: 180 }}>
                    <Text size="sm" fw={700} c="#1a1b4b" truncate>{activeEmpresa ? activeEmpresa.razonSocial.toUpperCase() : 'SELECCIONAR EMPRESA'}</Text>
                    <Text size="xs" color="dimmed" truncate>{activeEmpresa ? `NIT: ${activeEmpresa.nit}` : 'Ninguna'}</Text>
                  </Box>
                  <IconChevronDown size={16} color="gray" />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Box p="xs">
                <Text size="xs" fw={600} color="dimmed" mb="xs">Seleccionar Empresa</Text>
                <TextInput placeholder="Buscar empresa..." leftSection={<IconSearch size={14} />} size="xs" mb="sm" />
                <Box py="sm" ta="center" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {empresas.length > 0 ? (
                    empresas.map(emp => (
                      <Group key={emp.id} mb="xs" align="center" wrap="nowrap" style={{ cursor: 'pointer', padding: '6px', borderRadius: '4px', backgroundColor: activeEmpresa?.id === emp.id ? '#f1f3f5' : 'transparent' }} onClick={() => { setActiveEmpresa(emp); localStorage.setItem('activeTenantId', emp.codigo_empresa); window.location.reload(); }}>
                        <ThemeIcon size="md" variant="light" color="violet">
                          {emp.logoUrl ? <img src={emp.logoUrl.startsWith('data:') || emp.logoUrl.startsWith('http') ? emp.logoUrl : `http://localhost:3000${emp.logoUrl}`} alt="logo" width={20} height={20} style={{ objectFit: 'contain' }} /> : <IconBuildingBank size={16} />}
                        </ThemeIcon>
                        <Box style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                          <Text size="sm" fw={600} truncate>{emp.razonSocial}</Text>
                          <Text size="xs" c="dimmed">NIT: {emp.nit}</Text>
                        </Box>
                      </Group>
                    ))
                  ) : (
                    <Text size="sm" c="dimmed">No hay empresas registradas</Text>
                  )}
                </Box>
                <Divider my="sm" />
                <Button variant="subtle" size="sm" color="violet" leftSection={<IconPlus size={16} />} fullWidth justify="flex-start" onClick={() => navigate('/crear-empresa')}>Crear Empresa</Button>
              </Box>
            </Menu.Dropdown>
          </Menu>

          <Divider orientation="vertical" my="sm" color="#eaeaea" />

          {/* Period Selector */}
          <Group gap="md" style={{ cursor: 'pointer' }}>
            <ThemeIcon variant="default" size={40} radius="md" style={{ border: 'none', backgroundColor: '#f8f9fa' }}>
              <IconCalendarEvent size={24} color="#495057" stroke={1.5} />
            </ThemeIcon>
            <Box>
               <Text size="xs" c="dimmed" fw={600}>Período Activo</Text>
               <Group gap="xs">
                 <Text size="sm" fw={700} c="#1a1b4b">Mayo 2026</Text>
                 <IconChevronDown size={14} color="gray" />
               </Group>
            </Box>
          </Group>

          <Divider orientation="vertical" my="sm" color="#eaeaea" />

          {/* Live Clock */}
          <Group gap="md">
            <ThemeIcon variant="default" size={40} radius="md" style={{ border: 'none', backgroundColor: '#f8f9fa' }}>
              <IconClock size={24} color="#495057" stroke={1.5} />
            </ThemeIcon>
            <Box>
               <Text size="xs" c="dimmed" fw={600}>Fecha y Hora</Text>
               <Text size="sm" fw={700} c="#1a1b4b">
                  {currentTime.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })} {' '}
                  <span style={{ color: '#5c3ce6' }}>{currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
               </Text>
            </Box>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Box p="xl" pt="md">
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
