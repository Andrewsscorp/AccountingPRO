import React, { useState } from 'react';
import {
  Grid,
  Box,
  Title,
  Select,
  TextInput,
  Paper,
  Table,
  Button,
  ActionIcon,
  Modal,
  Group,
  Switch,
  Text,
  Badge,
  NumberInput,
  Divider
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconCalendar } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

interface TributarioTabProps {
  form: any;
}

export default function TributarioTab({ form }: TributarioTabProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Modal local state
  const [impuestoData, setImpuestoData] = useState({
    nombre: '',
    codigoDian: '',
    tarifa: 0,
    aplicaFuente: false,
    aplicaIva: false,
    aplicaIca: false
  });

  const handleOpenModal = (index?: number) => {
    if (index !== undefined) {
      setEditIndex(index);
      setImpuestoData({ ...form.values.impuestos[index] });
    } else {
      setEditIndex(null);
      setImpuestoData({
        nombre: '',
        codigoDian: '',
        tarifa: 0,
        aplicaFuente: false,
        aplicaIva: false,
        aplicaIca: false
      });
    }
    open();
  };

  const handleSaveImpuesto = () => {
    const currentImpuestos = [...(form.values.impuestos || [])];
    if (editIndex !== null) {
      currentImpuestos[editIndex] = impuestoData;
    } else {
      currentImpuestos.push(impuestoData);
    }
    form.setFieldValue('impuestos', currentImpuestos);
    close();
  };

  const handleDeleteImpuesto = (index: number) => {
    const currentImpuestos = [...(form.values.impuestos || [])];
    currentImpuestos.splice(index, 1);
    form.setFieldValue('impuestos', currentImpuestos);
  };

  return (
    <Box>
      <Grid gap="xl">
        {/* COLUMNA IZQUIERDA (Info Tributaria, Facturación, Impuestos) */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          
          <Box mb="xl">
            <Title order={5} mb="md">Información Tributaria</Title>
            <Grid gap="md">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Régimen Tributario"
                  withAsterisk
                  data={[
                    { value: 'Responsable de IVA', label: 'Responsable de IVA' },
                    { value: 'No Responsable de IVA', label: 'No Responsable de IVA' },
                    { value: 'Régimen Simple', label: 'Régimen Simple' },
                    { value: 'Régimen Especial', label: 'Régimen Especial' }
                  ]}
                  {...form.getInputProps('regimenTributarioP3')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Naturaleza Jurídica"
                  withAsterisk
                  data={[
                    { value: 'Sociedad por Acciones Simplificada (S.A.S.)', label: 'Sociedad por Acciones Simplificada (S.A.S.)' },
                    { value: 'Persona Natural', label: 'Persona Natural' },
                    { value: 'Limitada', label: 'Limitada' },
                    { value: 'Entidad Sin Ánimo de Lucro (ESAL)', label: 'Entidad Sin Ánimo de Lucro (ESAL)' }
                  ]}
                  {...form.getInputProps('naturalezaJuridica')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Actividad Económica Principal (CIIU)"
                  data={[
                    { value: '6201', label: '6201 - Actividades de desarrollo de sistemas informáticos' },
                    { value: '6920', label: '6920 - Actividades de contabilidad, teneduría de libros' },
                  ]}
                  {...form.getInputProps('actividadCiiu')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Actividad Económica Secundaria (CIIU)"
                  data={[
                    { value: '6311', label: '6311 - Procesamiento de datos, alojamiento y actividades conexas' },
                  ]}
                  {...form.getInputProps('actividadSecundariaCiiu')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Responsabilidad Fiscal"
                  data={[
                    { value: 'No Responsable', label: 'No Responsable' },
                    { value: 'Agente Retenedor', label: 'Agente Retenedor' }
                  ]}
                  {...form.getInputProps('responsabilidadFiscal')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Gran Contribuyente"
                  data={['Sí', 'No']}
                  {...form.getInputProps('granContribuyente')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Agente de Retención en la Fuente"
                  data={['Sí', 'No']}
                  {...form.getInputProps('manejaReteFuente')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Agente de Retención de IVA"
                  data={['Sí', 'No']}
                  {...form.getInputProps('agenteRetencionIva')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Autorretenedor"
                  data={['Sí', 'No']}
                  {...form.getInputProps('autorretenedor')}
                />
              </Grid.Col>
            </Grid>
          </Box>

          <Divider my="xl" />

          <Box mb="xl">
            <Title order={5} mb="md">Facturación Electrónica</Title>
            <Grid gap="md">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Obligado a Facturar Electrónicamente"
                  data={['Sí', 'No']}
                  {...form.getInputProps('obligadoFacturar')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Resolución DIAN Facturación Electrónica"
                  {...form.getInputProps('resolucionFacturacion')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  type="date"
                  label="Fecha Resolución DIAN"
                  {...form.getInputProps('fechaResolucion')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Prefijo de Facturación"
                  {...form.getInputProps('prefijoFacturacion')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Rango Autorizado Desde"
                  {...form.getInputProps('rangoDesde')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Rango Autorizado Hasta"
                  {...form.getInputProps('rangoHasta')}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  type="date"
                  label="Fecha Inicio Vigencia"
                  {...form.getInputProps('fechaInicioVigencia')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  type="date"
                  label="Fecha Fin Vigencia"
                  {...form.getInputProps('fechaFinVigencia')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Habilita Nómina Electrónica"
                  data={['Sí', 'No']}
                  {...form.getInputProps('habilitaNominaElectronica')}
                />
              </Grid.Col>
            </Grid>
          </Box>

          <Divider my="xl" />

          <Box>
            <Title order={5} mb="md">Impuestos</Title>
            <Paper withBorder radius="md">
              <Table highlightOnHover verticalSpacing="sm" striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Impuesto</Table.Th>
                    <Table.Th>Responsable</Table.Th>
                    <Table.Th>Tarifa %</Table.Th>
                    <Table.Th>Rete Fuente</Table.Th>
                    <Table.Th>Rete IVA</Table.Th>
                    <Table.Th>Rete ICA</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {form.values.impuestos && form.values.impuestos.length > 0 ? (
                    form.values.impuestos.map((imp: any, index: number) => (
                      <Table.Tr key={index}>
                        <Table.Td>{imp.nombre}</Table.Td>
                        <Table.Td>
                          <Badge color="green" variant="light">Sí</Badge>
                        </Table.Td>
                        <Table.Td>{parseFloat(imp.tarifa).toFixed(2)}</Table.Td>
                        <Table.Td>{imp.aplicaFuente ? 'Sí' : 'No'}</Table.Td>
                        <Table.Td>{imp.aplicaIva ? 'Sí' : 'No'}</Table.Td>
                        <Table.Td>{imp.aplicaIca ? 'Sí' : 'No'}</Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="flex-end">
                            <ActionIcon variant="light" color="blue" onClick={() => handleOpenModal(index)}>
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon variant="light" color="red" onClick={() => handleDeleteImpuesto(index)}>
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={7} ta="center">No hay impuestos configurados</Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
            <Button 
              variant="light" 
              color="violet" 
              leftSection={<IconPlus size={16} />} 
              mt="md"
              onClick={() => handleOpenModal()}
            >
              Agregar Impuesto
            </Button>
          </Box>

        </Grid.Col>

        {/* COLUMNA DERECHA (Info DIAN, Obligaciones) */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          
          <Paper withBorder radius="md" p="md" mb="xl" bg="white">
            <Title order={5} mb="md">Información DIAN</Title>
            <Grid gap="md">
              <Grid.Col span={12}>
                <TextInput
                  label="Código Actividad Principal DIAN"
                  placeholder="Ej. 6201"
                  {...form.getInputProps('codigoDianPrincipal')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput
                  label="Código Actividad Secundaria DIAN"
                  placeholder="Ej. 6311"
                  {...form.getInputProps('codigoDianSecundario')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Select
                  label="Código de Información Exógena"
                  data={[
                    { value: '1001', label: '1001 - Información general' }
                  ]}
                  {...form.getInputProps('codigoExogena')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Select
                  label="Responsabilidad en IVA"
                  data={[
                    { value: '48', label: '48 - Impuesto sobre las ventas - IVA' }
                  ]}
                  {...form.getInputProps('responsabilidadIva')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Select
                  label="Responsabilidad en Renta"
                  data={[
                    { value: '1', label: '1 - Declaración de renta' }
                  ]}
                  {...form.getInputProps('responsabilidadRenta')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Select
                  label="Tipo de Contribuyente"
                  data={['Persona Jurídica', 'Persona Natural']}
                  {...form.getInputProps('tipoContribuyente')}
                />
              </Grid.Col>
            </Grid>
          </Paper>

          <Paper withBorder radius="md" p="md" bg="white">
            <Title order={5} mb="md">Obligaciones Tributarias</Title>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Obligación</Table.Th>
                  <Table.Th>Periodicidad</Table.Th>
                  <Table.Th>Próximo Vencimiento</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>IVA</Table.Td>
                  <Table.Td>Bimestral</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      20/06/2026
                      <IconCalendar size={14} style={{ color: '#868e96' }} />
                    </Group>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Retención en la Fuente</Table.Td>
                  <Table.Td>Mensual</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      11/06/2026
                      <IconCalendar size={14} style={{ color: '#868e96' }} />
                    </Group>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>ICA</Table.Td>
                  <Table.Td>Bimestral</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      20/06/2026
                      <IconCalendar size={14} style={{ color: '#868e96' }} />
                    </Group>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Impuesto de Renta</Table.Td>
                  <Table.Td>Anual</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      31/03/2027
                      <IconCalendar size={14} style={{ color: '#868e96' }} />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>

        </Grid.Col>
      </Grid>

      {/* Modal Agregar Impuesto */}
      <Modal opened={opened} onClose={close} title={editIndex !== null ? "Editar Impuesto" : "Nuevo Impuesto"} centered>
        <TextInput
          label="Nombre del Impuesto"
          value={impuestoData.nombre}
          onChange={(e) => setImpuestoData({ ...impuestoData, nombre: e.currentTarget.value })}
          mb="md"
        />
        <TextInput
          label="Código DIAN"
          value={impuestoData.codigoDian}
          onChange={(e) => setImpuestoData({ ...impuestoData, codigoDian: e.currentTarget.value })}
          mb="md"
        />
        <NumberInput
          label="Tarifa (%)"
          value={impuestoData.tarifa}
          onChange={(v) => setImpuestoData({ ...impuestoData, tarifa: typeof v === 'number' ? v : 0 })}
          mb="xl"
          min={0}
          decimalScale={2}
          fixedDecimalScale
        />
        
        <Box mb="xl">
          <Text size="sm" fw={500} mb="xs">Aplica para:</Text>
          <Switch 
            label="Retención en la Fuente" 
            checked={impuestoData.aplicaFuente} 
            onChange={(e) => setImpuestoData({ ...impuestoData, aplicaFuente: e.currentTarget.checked })} 
            mb="sm" 
          />
          <Switch 
            label="Retención de IVA" 
            checked={impuestoData.aplicaIva} 
            onChange={(e) => setImpuestoData({ ...impuestoData, aplicaIva: e.currentTarget.checked })} 
            mb="sm" 
          />
          <Switch 
            label="Retención de ICA" 
            checked={impuestoData.aplicaIca} 
            onChange={(e) => setImpuestoData({ ...impuestoData, aplicaIca: e.currentTarget.checked })} 
          />
        </Box>

        <Group justify="flex-end">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button color="violet" onClick={handleSaveImpuesto}>Guardar Impuesto</Button>
        </Group>
      </Modal>

    </Box>
  );
}
