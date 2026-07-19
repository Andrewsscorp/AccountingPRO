import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Title,
  TextInput,
  Select,
  Switch,
  Group,
  Text,
  Textarea,
  ActionIcon,
  Badge,
  Box,
  Divider
} from '@mantine/core';
import { IconMapPin, IconPhone, IconDeviceMobile, IconMail, IconWorld } from '@tabler/icons-react';

interface ContactosTabProps {
  form: any;
}

export default function ContactosTab({ form }: ContactosTabProps) {
  const [usePrincipalAsCorrespondence, setUsePrincipalAsCorrespondence] = useState(false);

  // Sync correspondence address if switch is enabled
  useEffect(() => {
    if (usePrincipalAsCorrespondence) {
      form.setFieldValue('direccionCorrespondencia', form.values.direccion);
    }
  }, [form.values.direccion, usePrincipalAsCorrespondence]);

  return (
    <Grid gap="xl">
      {/* Columna Izquierda: Formulario */}
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Box mb="xl">
          <Title order={5} mb="md">Información de Contacto</Title>
          <Text size="sm" c="dimmed" mb="md">Administra los datos de contacto principales de la empresa.</Text>
          
          <Grid gap="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput 
                label="Dirección Principal" 
                withAsterisk 
                {...form.getInputProps('direccion')}
                placeholder="Ej. Calle 123 # 45-67 Oficina 502"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group justify="space-between" align="flex-end" mb={4}>
                <Text size="sm" fw={500}>Dirección Correspondencia</Text>
                <Switch 
                  label="Igual a principal" 
                  size="xs" 
                  checked={usePrincipalAsCorrespondence}
                  onChange={(e) => setUsePrincipalAsCorrespondence(e.currentTarget.checked)}
                />
              </Group>
              <TextInput 
                placeholder="Ej. Calle 123 # 45-67 Oficina 502"
                {...form.getInputProps('direccionCorrespondencia')}
                disabled={usePrincipalAsCorrespondence}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select 
                label="País" 
                withAsterisk
                data={['Colombia', 'México', 'Perú', 'Chile']} 
                {...form.getInputProps('pais')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select 
                label="Departamento" 
                withAsterisk
                data={['Antioquia', 'Cundinamarca', 'Valle del Cauca']} 
                {...form.getInputProps('departamento')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select 
                label="Ciudad" 
                withAsterisk
                data={['Medellín', 'Bogotá', 'Cali']} 
                {...form.getInputProps('ciudad')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput 
                label="Código Postal" 
                {...form.getInputProps('codigoPostal')}
                placeholder="Ej. 050001"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput 
                label="Teléfono Principal" 
                withAsterisk
                {...form.getInputProps('telefono')}
                placeholder="(604) 444 55 66"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput 
                label="Teléfono Secundario" 
                {...form.getInputProps('telefonoSecundario')}
                placeholder="(604) 322 11 22"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput 
                label="Celular Corporativo" 
                {...form.getInputProps('celularCorporativo')}
                placeholder="315 123 4567"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput 
                label="Fax" 
                {...form.getInputProps('fax')}
                placeholder="(604) 444 55 67"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput 
                label="Correo Electrónico General" 
                withAsterisk
                {...form.getInputProps('email')}
                placeholder="info@empresa.com"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput 
                label="Correo para Facturación" 
                withAsterisk
                {...form.getInputProps('emailFacturacion')}
                placeholder="facturacion@empresa.com"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput 
                label="Correo para Notificaciones" 
                {...form.getInputProps('emailNotificaciones')}
                placeholder="notificaciones@empresa.com"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput 
                label="Sitio Web" 
                {...form.getInputProps('sitioWeb')}
                placeholder="www.empresa.com"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput 
                label="Red Social - Facebook" 
                {...form.getInputProps('facebook')}
                placeholder="/EmpresaXYZ"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput 
                label="Red Social - Instagram" 
                {...form.getInputProps('instagram')}
                placeholder="@empresa.xyz"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput 
                label="Red Social - LinkedIn" 
                {...form.getInputProps('linkedin')}
                placeholder="/company/empresa-xyz"
              />
            </Grid.Col>
          </Grid>
        </Box>

        <Box>
          <Title order={5} mb="md">Horarios de Atención</Title>
          <Grid gap="md">
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select 
                label="Días de Atención" 
                data={['Lunes a Viernes', 'Lunes a Sábado', 'Todos los días']} 
                {...form.getInputProps('diasAtencion')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput 
                label="Hora de Apertura" 
                type="time"
                {...form.getInputProps('horaApertura')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput 
                label="Hora de Cierre" 
                type="time"
                {...form.getInputProps('horaCierre')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <Select 
                label="Zona Horaria" 
                data={['(UTC-05:00) Bogotá']} 
                {...form.getInputProps('zonaHoraria')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea 
                label="Observaciones" 
                placeholder="Atención presencial únicamente con cita previa."
                {...form.getInputProps('observacionesContacto')}
              />
            </Grid.Col>
          </Grid>
        </Box>
      </Grid.Col>

      {/* Columna Derecha: Mapa y Resumen */}
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Box mb="xl">
          <Title order={5} mb="md">Ubicación en el Mapa</Title>
          <Paper withBorder radius="md" p="xs" style={{ height: '250px', overflow: 'hidden' }}>
            {/* Mapa de OpenStreetMap incrustado (Iframe simple MVP) */}
            <iframe 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              scrolling="no" 
              marginHeight={0} 
              marginWidth={0} 
              src={`https://www.openstreetmap.org/export/embed.html?bbox=-75.6%2C6.2%2C-75.5%2C6.3&layer=mapnik&marker=6.2442%2C-75.5812`} 
              style={{ border: 0, borderRadius: '6px' }}
            ></iframe>
          </Paper>
        </Box>

        <Box>
          <Title order={5} mb="md">Resumen de Contacto</Title>
          <Paper withBorder radius="md" p="md" bg="#fafbfc">
            <Group align="flex-start" mb="md" wrap="nowrap">
              <IconMapPin size={20} color="#5c3ce6" style={{ marginTop: '2px', flexShrink: 0 }} />
              <Box>
                <Text size="sm" fw={500}>Dirección:</Text>
                <Text size="sm">{form.values.direccion || 'No registrada'}</Text>
                <Text size="sm">{form.values.ciudad}, {form.values.departamento} - {form.values.pais}</Text>
              </Box>
            </Group>

            <Group align="center" mb="md" wrap="nowrap">
              <IconPhone size={20} color="#5c3ce6" style={{ flexShrink: 0 }} />
              <Group gap="xs">
                <Text size="sm" fw={500}>Teléfono Principal:</Text>
                <Text size="sm">{form.values.telefono || 'No registrado'}</Text>
              </Group>
            </Group>

            <Group align="center" mb="md" wrap="nowrap">
              <IconDeviceMobile size={20} color="#5c3ce6" style={{ flexShrink: 0 }} />
              <Group gap="xs">
                <Text size="sm" fw={500}>Celular Corporativo:</Text>
                <Text size="sm">{form.values.celularCorporativo || 'No registrado'}</Text>
              </Group>
            </Group>

            <Group align="center" mb="md" wrap="nowrap">
              <IconMail size={20} color="#5c3ce6" style={{ flexShrink: 0 }} />
              <Group gap="xs">
                <Text size="sm" fw={500}>Correo General:</Text>
                <Text size="sm">{form.values.email || 'No registrado'}</Text>
              </Group>
            </Group>

            <Group align="center" wrap="nowrap">
              <IconWorld size={20} color="#5c3ce6" style={{ flexShrink: 0 }} />
              <Group gap="xs">
                <Text size="sm" fw={500}>Sitio Web:</Text>
                <Text size="sm">{form.values.sitioWeb || 'No registrado'}</Text>
              </Group>
            </Group>
          </Paper>
        </Box>
      </Grid.Col>
    </Grid>
  );
}
