import React, { useState } from 'react';
import {
  Box,
  Title,
  Text,
  Tabs,
  Paper,
  TextInput,
  Select,
  Switch,
  Button,
  Group,
  Stack,
  Divider
} from '@mantine/core';
import {
  IconSettings,
  IconCalculator,
  IconNumbers,
  IconCalendarEvent,
  IconDeviceFloppy
} from '@tabler/icons-react';
import TenantLayout from '../../../components/layout/TenantLayout';
import { useNavigate } from 'react-router-dom';

export default function AjustesModulo() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('generales');

  return (
    <TenantLayout>
      <Box>
        <Group mb="xl">
          <Button variant="light" color="gray" onClick={() => navigate('/configuracion')}>Volver</Button>
          <Box>
            <Title order={1} style={{ fontFamily: 'Inter, sans-serif', color: '#1a1b4b' }}>
              Módulo de Ajustes
            </Title>
            <Text c="dimmed">
              Configura los parámetros operativos y contables de la empresa.
            </Text>
          </Box>
        </Group>

        <Paper withBorder radius="md" p="xl" bg="white">
          <Tabs value={activeTab} onChange={setActiveTab} color="violet" variant="outline">
            <Tabs.List mb="lg">
              <Tabs.Tab value="generales" leftSection={<IconSettings size={16} />}>
                Generales
              </Tabs.Tab>
              <Tabs.Tab value="contabilidad" leftSection={<IconCalculator size={16} />}>
                Contabilidad
              </Tabs.Tab>
              <Tabs.Tab value="consecutivos" leftSection={<IconNumbers size={16} />}>
                Consecutivos
              </Tabs.Tab>
              <Tabs.Tab value="periodos" leftSection={<IconCalendarEvent size={16} />}>
                Periodos
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="generales">
              <Stack gap="md" maw={600}>
                <Title order={4}>Formato y Región</Title>
                <Select
                  label="Moneda Principal"
                  description="La moneda base para todos los reportes contables."
                  data={['COP - Peso Colombiano', 'USD - Dólar Estadounidense']}
                  defaultValue="COP - Peso Colombiano"
                />
                <Select
                  label="Zona Horaria"
                  data={['America/Bogota (GMT-5)', 'UTC']}
                  defaultValue="America/Bogota (GMT-5)"
                />
                <Select
                  label="Separador de Miles"
                  data={['Punto (.)', 'Coma (,)']}
                  defaultValue="Punto (.)"
                />
                <Divider my="sm" />
                <Button color="violet" w={150} leftSection={<IconDeviceFloppy size={18} />}>
                  Guardar
                </Button>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="contabilidad">
              <Stack gap="md" maw={600}>
                <Title order={4}>Cuentas por Defecto</Title>
                <TextInput
                  label="Cuenta de Utilidad del Ejercicio"
                  placeholder="Ej: 360505"
                  description="Cuenta para asentar la utilidad al cierre de año."
                />
                <TextInput
                  label="Cuenta de Pérdida del Ejercicio"
                  placeholder="Ej: 361005"
                />
                <TextInput
                  label="Caja General (Defecto)"
                  placeholder="Ej: 110505"
                />
                <Divider my="sm" />
                <Button color="violet" w={150} leftSection={<IconDeviceFloppy size={18} />}>
                  Guardar
                </Button>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="consecutivos">
              <Stack gap="md" maw={600}>
                <Title order={4}>Numeración de Comprobantes</Title>
                <Text size="sm" c="dimmed">
                  La numeración automática permite llevar control consecutivo. Los prefijos y contadores iniciales se definen aquí.
                </Text>
                
                <Group grow>
                  <TextInput label="Prefijo Facturas" placeholder="Ej: FE" defaultValue="FE" />
                  <TextInput label="Siguiente Número" placeholder="1" defaultValue="1" type="number" />
                </Group>
                <Group grow>
                  <TextInput label="Prefijo Recibos de Caja" placeholder="Ej: RC" defaultValue="RC" />
                  <TextInput label="Siguiente Número" placeholder="1" defaultValue="1" type="number" />
                </Group>
                
                <Divider my="sm" />
                <Button color="violet" w={150} leftSection={<IconDeviceFloppy size={18} />}>
                  Guardar
                </Button>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="periodos">
              <Stack gap="md" maw={600}>
                <Title order={4}>Cierre de Periodos</Title>
                <Text size="sm" c="dimmed">
                  Evita alteraciones en meses o años ya auditados bloqueando la edición de movimientos anteriores a una fecha específica.
                </Text>

                <Switch
                  label="Bloquear edición de periodos cerrados"
                  description="Ningún usuario podrá modificar comprobantes anteriores a la fecha de cierre."
                  defaultChecked
                />
                <Select
                  label="Mes Activo de Trabajo"
                  data={['Enero 2026', 'Febrero 2026', 'Marzo 2026', 'Abril 2026', 'Mayo 2026', 'Junio 2026']}
                  defaultValue="Mayo 2026"
                />
                <TextInput
                  label="Día de corte mensual"
                  type="number"
                  defaultValue="31"
                  description="Último día permitido para asentar movimientos en el mes."
                />

                <Divider my="sm" />
                <Button color="violet" w={150} leftSection={<IconDeviceFloppy size={18} />}>
                  Guardar
                </Button>
              </Stack>
            </Tabs.Panel>

          </Tabs>
        </Paper>
      </Box>
    </TenantLayout>
  );
}
