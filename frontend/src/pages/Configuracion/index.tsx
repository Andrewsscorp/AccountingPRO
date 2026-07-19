import {
  Box,
  Title,
  Text,
  SimpleGrid,
  Card,
  ThemeIcon,
  Flex
} from '@mantine/core';
import {
  IconBuildingBank,
  IconSettings,
  IconArrowRight
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../components/layout/TenantLayout';

export default function Configuracion() {
  const navigate = useNavigate();

  return (
    <TenantLayout>
      <Box>
        <Title order={1} mb={8} style={{ fontFamily: 'Inter, sans-serif', color: '#1a1b4b' }}>
          Módulo de Configuración
        </Title>
        <Text c="dimmed" mb="xl" size="lg">
          Administra los parámetros generales del sistema y su funcionamiento.
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          <Card 
            className="dashboard-card" 
            shadow="sm" 
            padding="xl" 
            radius="md" 
            withBorder 
            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            onClick={() => navigate('/configuracion/empresa')}
          >
            <ThemeIcon variant="light" color="violet" size={56} radius="md" mb="xl">
              <IconBuildingBank size={32} />
            </ThemeIcon>
            <Title order={3} mb="sm" style={{ fontFamily: 'Inter, sans-serif' }}>Datos de Empresa</Title>
            <Text size="sm" c="dimmed" mb="xl" style={{ minHeight: 60, lineHeight: 1.6 }}>
              Administra la información general de la empresa, datos fiscales, logo, direcciones y configuraciones corporativas.
            </Text>
            <Flex justify="flex-end">
              <IconArrowRight size={24} color="var(--mantine-color-violet-6)" />
            </Flex>
          </Card>

          <Card 
            className="dashboard-card" 
            shadow="sm" 
            padding="xl" 
            radius="md" 
            withBorder 
            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            onClick={() => navigate('/configuracion/ajustes')}
          >
            <ThemeIcon variant="light" color="orange" size={56} radius="md" mb="xl">
              <IconSettings size={32} />
            </ThemeIcon>
            <Title order={3} mb="sm" style={{ fontFamily: 'Inter, sans-serif' }}>Módulo de Ajustes</Title>
            <Text size="sm" c="dimmed" mb="xl" style={{ minHeight: 60, lineHeight: 1.6 }}>
              Configuración de periodos contables, formatos, numeraciones y preferencias globales del sistema.
            </Text>
            <Flex justify="flex-end">
              <IconArrowRight size={24} color="var(--mantine-color-orange-6)" />
            </Flex>
          </Card>
        </SimpleGrid>
      </Box>
    </TenantLayout>
  );
}
