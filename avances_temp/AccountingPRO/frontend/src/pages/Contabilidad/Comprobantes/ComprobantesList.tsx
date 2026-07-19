import React from 'react';
import { Title, Text, Container, Center, ThemeIcon, Button, Group } from '@mantine/core';
import { IconSettings2, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../../components/layout/TenantLayout';

export default function ComprobantesList() {
  const navigate = useNavigate();

  return (
    <TenantLayout>
      <Container size="md" py="xl">
        <Button variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/dashboard')} mb="xl">
          Volver al Dashboard
        </Button>

        <Center style={{ height: '60vh', flexDirection: 'column' }}>
          <ThemeIcon size={120} radius={120} variant="light" color="violet" mb="xl">
            <IconSettings2 size={60} stroke={1.5} />
          </ThemeIcon>
          
          <Title order={1} style={{ fontFamily: 'Inter, sans-serif' }} ta="center">
            Módulo en Construcción
          </Title>
          
          <Text c="dimmed" size="lg" ta="center" mt="md" maw={500}>
            La pantalla de captura de documentos y creación de comprobantes está siendo desarrollada en este momento.
          </Text>
        </Center>
      </Container>
    </TenantLayout>
  );
}
