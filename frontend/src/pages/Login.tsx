import {
  Card,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Group,
  Box,
  Divider,
  Center
} from '@mantine/core';
import { IconChartArcs, IconUser, IconLock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Para efectos de prototipo, simplemente redirigimos al dashboard
    navigate('/dashboard');
  };

  return (
    <Box bg="gray.0" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card shadow="md" padding="xl" radius="md" withBorder w={450}>
        <Group justify="center" gap="sm" mb="xs">
          <IconChartArcs size={40} color="#5c3ce6" />
          <Text fw={800} size="32px" style={{ fontFamily: 'Inter, sans-serif' }}>AccountingPro</Text>
        </Group>

        <Text ta="center" size="sm" c="dimmed" mb="xl" fw={500}>
          Sistema Contable y Financiero
        </Text>

        <TextInput
          label="Usuario"
          placeholder="Administrador"
          rightSection={<IconUser size={16} stroke={1.5} color="gray" />}
          mb="md"
          styles={{ label: { marginBottom: 5, fontWeight: 500 } }}
        />

        <PasswordInput
          label="Contraseña"
          placeholder="********"
          rightSection={<IconLock size={16} stroke={1.5} color="gray" />}
          mb="xl"
          styles={{ label: { marginBottom: 5, fontWeight: 500 } }}
        />

        <Button
          fullWidth
          size="md"
          color="violet"
          onClick={handleLogin}
          mb="xl"
        >
          Ingresar
        </Button>

        <Divider mb="md" />

        <Center>
          <Box ta="center">
            <Text size="xs" c="dimmed" fw={500} mb={2}>Versión 1.0.0</Text>
            <Text size="xs" c="dimmed">
              © 2026 <Text component="span" c="violet.7" fw={500}>AccountingPro</Text>. Todos los derechos reservados.
            </Text>
          </Box>
        </Center>
      </Card>
    </Box>
  );
}
