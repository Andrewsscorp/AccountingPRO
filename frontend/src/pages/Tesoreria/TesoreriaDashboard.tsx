import React from 'react';
import { Box, Paper, Text, Group, ThemeIcon, Title, SimpleGrid, UnstyledButton } from '@mantine/core';
import { IconBuildingBank, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../components/layout/TenantLayout';

export default function TesoreriaDashboard() {
  const navigate = useNavigate();

  const modulos = [
    { 
      title: 'Crear Cuenta Bancaria', 
      desc: 'Registrar y configurar una nueva cuenta de banco para la empresa y asociar su cuenta contable.', 
      icon: IconBuildingBank, 
      color: 'blue', 
      path: '/tesoreria/cuentas-bancarias' 
    }
  ];

  return (
    <TenantLayout>
      <Box p="xl" style={{ backgroundColor: '#f4f6f8', minHeight: '100%' }}>
        <Title order={2} mb="xl" style={{ color: '#2c2e33' }}>Módulo de Tesorería</Title>
        
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {modulos.map((mod) => {
            const Icon = mod.icon;
            return (
              <UnstyledButton 
                key={mod.title} 
                onClick={() => navigate(mod.path)}
                style={{ width: '100%', height: '100%' }}
              >
                <Paper 
                  shadow="sm" 
                  radius="md" 
                  p="xl" 
                  withBorder 
                  style={{ 
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#f8f9fa'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.05)';
                  }}
                >
                  <ThemeIcon 
                    size={48} 
                    radius="md" 
                    variant="light" 
                    color={mod.color}
                    mb="lg"
                  >
                    <Icon size={24} stroke={1.5} />
                  </ThemeIcon>

                  <Text fw={600} size="lg" mb="sm" style={{ color: '#2c2e33' }}>
                    {mod.title}
                  </Text>
                  
                  <Text size="sm" c="dimmed" style={{ flex: 1, lineHeight: 1.5 }}>
                    {mod.desc}
                  </Text>
                  
                  <Group justify="flex-end" mt="md">
                    <IconArrowRight size={20} stroke={1.5} color="#868e96" />
                  </Group>
                </Paper>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>
      </Box>
    </TenantLayout>
  );
}

