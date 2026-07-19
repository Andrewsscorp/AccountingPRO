import React, { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Button,
  Group,
  Paper,
  Tabs,
  Grid,
  TextInput,
  Select,
  Textarea,
  Switch,
  Badge,
  ActionIcon,
  ThemeIcon,
  FileButton,
  FileInput,
  ColorInput
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import {
  IconHistory,
  IconBuildingBank,
  IconPhoneCall,
  IconReceiptTax,
  IconUser,
  IconBook2,
  IconCashBanknote,
  IconBuilding,
  IconDots,
  IconUpload,
  IconTrash,
  IconInfoCircle,
  IconDeviceFloppy,
  IconRefresh,
  IconCheck,
  IconX,
  IconMapPin
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import TenantLayout from '../../../components/layout/TenantLayout';
import FirmantesTab from './FirmantesTab';
import ContactosTab from './ContactosTab';
import TributarioTab from './TributarioTab';
import { calcularDV } from '../../../utils/calcularDV';

const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function DatosEmpresa() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('informacion_general');
  const [loading, setLoading] = useState(false);

  const tenantId = localStorage.getItem('tenantId') || 'EMP000004';

  const form = useForm({
    initialValues: {
      razonSocial: '',
      nombreComercial: '',
      tipoPersona: 'JURIDICA',
      nit: '',
      dv: '',
      estado: 'Activa',
      fechaConstitucion: '',
      regimenFiscalP1: 'Responsable de IVA',
      actividadCiiu: '',
      actividadSecundaria: '',
      objetoSocial: '',
      anioFiscalInicio: '',
      anioFiscalFin: '',
      moneda: 'COP',
      decimales: '2',
      manejaNiif: true,
      direccion: '',
      ciudad: '',
      departamento: '',
      pais: '',
      telefono: '',
      email: '',
      sitioWeb: '',
      logoUrl: '',
      direccionCorrespondencia: '',
      codigoPostal: '',
      telefonoSecundario: '',
      celularCorporativo: '',
      fax: '',
      emailFacturacion: '',
      emailNotificaciones: '',
      facebook: '',
      instagram: '',
      linkedin: '',
      xTwitter: '',
      youtube: '',
      diasAtencion: '',
      horaApertura: '',
      horaCierre: '',
      zonaHoraria: '(UTC-05:00) Bogotá',
      observacionesContacto: '',
      latitud: 6.2442,
      longitud: -75.5812,

      // Tributario
      naturalezaJuridica: 'Sociedad por Acciones Simplificada (S.A.S.)',
      actividadSecundariaCiiu: '',
      responsabilidadFiscal: 'No Responsable',
      granContribuyente: 'No',
      agenteRetencionIva: 'No',
      autorretenedor: 'No',
      resolucionFacturacion: '',
      fechaResolucion: '',
      prefijoFacturacion: '',
      rangoDesde: '',
      rangoHasta: '',
      fechaInicioVigencia: '',
      fechaFinVigencia: '',
      habilitaNominaElectronica: 'No',
      codigoDianPrincipal: '',
      codigoDianSecundario: '',
      codigoExogena: '1001',
      responsabilidadIva: '48',
      responsabilidadRenta: '1',
      tipoContribuyente: 'Persona Jurídica',
      impuestos: []
    }
  });

  const fetchData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/configuracion/empresa`, {
        headers: { 'x-tenant-id': tenantId }
      });
      const res = await response.json();
      if (res.success && res.data) {
        const d = res.data;
        form.setValues({
          razonSocial: d.razonSocial || '',
          nombreComercial: d.nombreComercial || '',
          tipoPersona: d.tipoPersona || 'JURIDICA',
          nit: d.nit || '',
          dv: d.dv || '',
          estado: 'Activa', // Por ahora lo mantenemos visualmente
          regimenFiscalP1: d.regimenFiscalP1 || 'Responsable de IVA',
          actividadCiiu: d.actividadCiiu || '',
          moneda: d.moneda || 'COP',
          anioFiscalInicio: d.anioFiscalInicio ? new Date(d.anioFiscalInicio).toISOString().split('T')[0] : '',
          anioFiscalFin: d.anioFiscalFin ? new Date(d.anioFiscalFin).toISOString().split('T')[0] : '',
          direccion: d.direccion || '',
          ciudad: d.ciudad || '',
          departamento: d.departamento || '',
          pais: d.pais || '',
          telefono: d.telefono || '',
          email: d.email || '',
          sitioWeb: d.sitioWeb || '',
          logoUrl: d.logoUrl || '',
          direccionCorrespondencia: d.direccionCorrespondencia || '',
          codigoPostal: d.codigoPostal || '',
          telefonoSecundario: d.telefonoSecundario || '',
          celularCorporativo: d.celularCorporativo || '',
          fax: d.fax || '',
          emailFacturacion: d.emailFacturacion || '',
          emailNotificaciones: d.emailNotificaciones || '',
          facebook: d.facebook || '',
          instagram: d.instagram || '',
          linkedin: d.linkedin || '',
          xTwitter: d.xTwitter || '',
          youtube: d.youtube || '',
          diasAtencion: d.diasAtencion || '',
          horaApertura: d.horaApertura || '',
          horaCierre: d.horaCierre || '',
          zonaHoraria: d.zonaHoraria || '(UTC-05:00) Bogotá',
          observacionesContacto: d.observacionesContacto || '',
          latitud: d.latitud || 6.2442,
          longitud: d.longitud || -75.5812,

          naturalezaJuridica: d.naturalezaJuridica || 'Sociedad por Acciones Simplificada (S.A.S.)',
          actividadSecundariaCiiu: d.actividadSecundariaCiiu || '',
          responsabilidadFiscal: d.responsabilidadFiscal || 'No Responsable',
          granContribuyente: d.granContribuyente || 'No',
          agenteRetencionIva: d.agenteRetencionIva || 'No',
          autorretenedor: d.autorretenedor || 'No',
          resolucionFacturacion: d.resolucionFacturacion || '',
          fechaResolucion: d.fechaResolucion ? new Date(d.fechaResolucion).toISOString().split('T')[0] : '',
          prefijoFacturacion: d.prefijoFacturacion || '',
          rangoDesde: d.rangoDesde || '',
          rangoHasta: d.rangoHasta || '',
          fechaInicioVigencia: d.fechaInicioVigencia ? new Date(d.fechaInicioVigencia).toISOString().split('T')[0] : '',
          fechaFinVigencia: d.fechaFinVigencia ? new Date(d.fechaFinVigencia).toISOString().split('T')[0] : '',
          habilitaNominaElectronica: d.habilitaNominaElectronica || 'No',
          codigoDianPrincipal: d.codigoDianPrincipal || '',
          codigoDianSecundario: d.codigoDianSecundario || '',
          codigoExogena: d.codigoExogena || '1001',
          responsabilidadIva: d.responsabilidadIva || '48',
          responsabilidadRenta: d.responsabilidadRenta || '1',
          tipoContribuyente: d.tipoContribuyente || 'Persona Jurídica',
          impuestos: d.impuestos || []
        });
      }
    } catch (error) {
      console.error('Error fetching empresa data', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNit = e.currentTarget.value;
    form.setFieldValue('nit', newNit);
    // Calcular DV Automático
    const dvCalculado = calcularDV(newNit);
    form.setFieldValue('dv', dvCalculado);
  };

  const handleLogoChange = async (file: File | null) => {
    if (file) {
      const base64 = await getBase64(file);
      form.setFieldValue('logoUrl', base64);
    }
  };

  const handleSave = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/configuracion/empresa`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(values)
      });
      const data = await response.json();
      if (data.success) {
        notifications.show({
          title: 'Configuración Guardada',
          message: 'Los datos de la empresa se han actualizado exitosamente.',
          color: 'green',
          icon: <IconCheck size={18} />
        });
      } else {
        notifications.show({
          title: 'Error',
          message: data.message || 'Ocurrió un error guardando la configuración.',
          color: 'red',
          icon: <IconX size={18} />
        });
      }
    } catch (error) {
      console.error('Error saving', error);
      notifications.show({
        title: 'Error de Conexión',
        message: 'No se pudo contactar con el servidor.',
        color: 'red',
        icon: <IconX size={18} />
      });
    }
    setLoading(false);
  };

  return (
    <TenantLayout>
      <Box pb={60}>
        {/* ENCABEZADO */}
        <Group justify="space-between" mb="lg">
          <Box>
            <Group gap="xs">
              <ActionIcon variant="light" color="gray" onClick={() => navigate('/configuracion')}>
                <IconBuildingBank size={18} />
              </ActionIcon>
              <Title order={1} style={{ fontFamily: 'Inter, sans-serif', color: '#1a1b4b' }}>
                Datos de Empresa
              </Title>
            </Group>
            <Text c="dimmed" mt={4}>
              Administra la información general y configuración de la empresa.
            </Text>
          </Box>
          <Button variant="default" leftSection={<IconHistory size={16} />}>
            Historial de Cambios
          </Button>
        </Group>

        <Paper withBorder radius="md" bg="white" style={{ overflow: 'hidden' }}>
          <form onSubmit={form.onSubmit(handleSave)}>
            <Tabs value={activeTab} onChange={setActiveTab} variant="outline" color="violet">
              <Tabs.List style={{ flexWrap: 'nowrap', overflowX: 'auto', padding: '0 10px' }}>
                <Tabs.Tab value="informacion_general" leftSection={<IconBuildingBank size={16} />}>
                  Información General
                </Tabs.Tab>
                <Tabs.Tab value="contactos" leftSection={<IconMapPin size={16} />}>
                  Contactos
                </Tabs.Tab>
                <Tabs.Tab value="tributario" leftSection={<IconReceiptTax size={16} />}>Tributario</Tabs.Tab>
                <Tabs.Tab value="firmantes" leftSection={<IconUser size={16} />}>Funcionarios y Firmantes</Tabs.Tab>
                <Tabs.Tab value="informacion_contable" leftSection={<IconBook2 size={16} />}>Información Contable</Tabs.Tab>
                <Tabs.Tab value="bancos" leftSection={<IconCashBanknote size={16} />}>Bancos</Tabs.Tab>
                <Tabs.Tab value="sucursales" leftSection={<IconBuilding size={16} />}>Sucursales</Tabs.Tab>
                <Tabs.Tab value="mas" leftSection={<IconDots size={16} />}>Más</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="informacion_general" p="xl" bg="#fafbfc">
                <Grid gap="xl">
                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <Box mb="xl">
                      <Title order={5} mb="md">Información Básica</Title>
                      <Grid gap="md">
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <TextInput label="Razón Social" withAsterisk {...form.getInputProps('razonSocial')} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <TextInput label="Nombre Comercial" {...form.getInputProps('nombreComercial')} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <Select 
                            label="Tipo de Persona" 
                            data={[
                              { value: 'JURIDICA', label: 'Persona Jurídica' }, 
                              { value: 'NATURAL', label: 'Persona Natural' }
                            ]} 
                            {...form.getInputProps('tipoPersona')}
                          />
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <Group grow gap="xs" align="flex-end">
                            <TextInput 
                              label="NIT" 
                              withAsterisk 
                              {...form.getInputProps('nit')} 
                              onChange={handleNitChange} 
                              description="Ingresar sin puntos ni guiones"
                            />
                            <TextInput label="D.V." style={{ maxWidth: '60px' }} {...form.getInputProps('dv')} readOnly />
                          </Group>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <TextInput label="Código Interno" defaultValue="EMP-001" disabled />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <Text size="sm" fw={500} mb={3}>Estado <Text span c="red">*</Text></Text>
                          <Group>
                            <Badge color="green" variant="light" size="lg" radius="sm">Activa</Badge>
                          </Group>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <TextInput label="Fecha de Constitución" type="date" {...form.getInputProps('fechaConstitucion')} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <Select 
                            label="Régimen Tributario" 
                            data={['Responsable de IVA', 'No Responsable de IVA', 'Gran Contribuyente', 'Régimen Especial']} 
                            {...form.getInputProps('regimenFiscalP1')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <TextInput 
                            label="Actividad Económica Principal (CIIU)" 
                            withAsterisk 
                            {...form.getInputProps('actividadCiiu')}
                            placeholder="Ej. 6201"
                          />
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TextInput 
                            label="Actividad Económica Secundaria" 
                            {...form.getInputProps('actividadSecundaria')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Textarea 
                            label="Objeto Social" 
                            minRows={3}
                            {...form.getInputProps('objetoSocial')}
                          />
                        </Grid.Col>
                      </Grid>
                    </Box>

                    <Box>
                      <Title order={5} mb="md">Información Adicional</Title>
                      <Grid gap="md">
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <Select 
                            label="Mes Inicio Fiscal" 
                            data={['Enero', 'Julio']} 
                            defaultValue="Enero"
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <Select 
                            label="Moneda Base" 
                            data={[
                              { value: 'COP', label: 'Peso Colombiano (COP)' },
                              { value: 'USD', label: 'Dólar Estadounidense (USD)' }
                            ]} 
                            {...form.getInputProps('moneda')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 2 }}>
                          <Select 
                            label="Decimales" 
                            data={['0', '2', '4', '6']} 
                            {...form.getInputProps('decimales')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 2 }}>
                          <Text size="sm" fw={500} mb={3}>Maneja NIIF</Text>
                          <Switch size="md" color="violet" onLabel="Sí" offLabel="No" {...form.getInputProps('manejaNiif', { type: 'checkbox' })} />
                        </Grid.Col>
                      </Grid>
                    </Box>
                  </Grid.Col>

                  {/* COLUMNA DERECHA - ARCHIVOS Y LOGOS */}
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Box mb="xl">
                      <Title order={5} mb="md">Logo Corporativo</Title>
                      <Text size="xs" c="dimmed" mb="xs">Logo actual</Text>
                      <Paper withBorder radius="md" p="md" mb="md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
                        <Group gap="md">
                          {form.values.logoUrl ? (
                            <img src={form.values.logoUrl} alt="Logo" style={{ maxHeight: '80px', maxWidth: '80px', objectFit: 'contain' }} />
                          ) : (
                            <ThemeIcon variant="filled" color="indigo" size={50} radius="md">
                              <IconBuildingBank size={28} />
                            </ThemeIcon>
                          )}
                          <Box>
                            <Text fw={700} size="lg">{form.values.razonSocial || 'EMPRESA XYZ'}</Text>
                            <Text size="sm" c="dimmed">{form.values.tipoPersona === 'JURIDICA' ? 'Persona Jurídica' : 'Persona Natural'}</Text>
                          </Box>
                        </Group>
                      </Paper>
                      <Group grow>
                        <FileButton onChange={handleLogoChange} accept="image/png,image/jpeg">
                          {(props) => <Button {...props} variant="outline" color="violet" leftSection={<IconUpload size={16} />}>Cambiar Logo</Button>}
                        </FileButton>
                        <Button variant="outline" color="red" leftSection={<IconTrash size={16} />} onClick={() => form.setFieldValue('logoUrl', '')}>Eliminar</Button>
                      </Group>
                    </Box>

                    <Box mb="xl">
                      <Title order={5} mb="md">Imágenes Adicionales</Title>
                      <FileInput
                        label="Imagen para Reportes (opcional)"
                        placeholder="Seleccionar imagen"
                        leftSection={<IconUpload size={14} />}
                        description="Máx. 2MB (PNG, JPG)"
                        mb="sm"
                      />
                      <FileInput
                        label="Imagen para Facturas (opcional)"
                        placeholder="Seleccionar imagen"
                        leftSection={<IconUpload size={14} />}
                        description="Máx. 2MB (PNG, JPG)"
                      />
                    </Box>

                    <Box>
                      <Title order={5} mb="md">Colores Corporativos</Title>
                      <Grid gap="md">
                        <Grid.Col span={6}>
                          <ColorInput label="Color Primario" defaultValue="#5B3BFF" format="hex" />
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <ColorInput label="Color Secundario" defaultValue="#1F2937" format="hex" />
                        </Grid.Col>
                      </Grid>
                    </Box>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>
              
              {/* PANEL DE FIRMANTES */}
              <Tabs.Panel value="firmantes" p="xl" bg="#fafbfc">
                <FirmantesTab />
              </Tabs.Panel>

              <Tabs.Panel value="contactos" p="xl" bg="#fafbfc">
                <ContactosTab form={form} />
              </Tabs.Panel>

              <Tabs.Panel value="tributario" p="xl" bg="#fafbfc">
                <TributarioTab form={form} />
              </Tabs.Panel>

              {/* OTHER PANELS STUB */}
              {['informacion_contable', 'bancos', 'sucursales', 'mas'].map((tab) => (
                <Tabs.Panel key={tab} value={tab} p="xl" bg="#fafbfc">
                  <Text c="dimmed" ta="center">Este módulo estará disponible próximamente.</Text>
                </Tabs.Panel>
              ))}
              
              {/* FOOTER ACTIONS */}
              <Box 
                p="md" 
                style={{ 
                  position: 'fixed', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  backgroundColor: '#fff', 
                  borderTop: '1px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 100
                }}
              >
                <Group>
                  <IconInfoCircle size={20} color="#5c3ce6" />
                  <Text size="sm" c="dimmed">
                    La información registrada aquí será utilizada en todos los documentos, reportes y procesos del sistema.
                  </Text>
                </Group>
                <Group>
                  <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={fetchData}>Restablecer</Button>
                  <Button type="submit" loading={loading} color="violet" leftSection={<IconDeviceFloppy size={16} />}>Guardar Cambios</Button>
                </Group>
              </Box>
            </Tabs>
          </form>
        </Paper>
      </Box>
    </TenantLayout>
  );
}
