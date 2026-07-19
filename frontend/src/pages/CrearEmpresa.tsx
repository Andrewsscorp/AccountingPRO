import {
  AppShell,
  Group,
  Text,
  Avatar,
  Card,
  Title,
  Stepper,
  TextInput,
  Select,
  Grid,
  Button,
  Box,
  ThemeIcon,
  Divider,
  UnstyledButton,
  SegmentedControl,
  ActionIcon,
  Badge,
  Modal,
  MultiSelect,
  Radio,
  FileButton,
  Image,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconChartArcs,
  IconLogout,
  IconBuilding,
  IconShieldLock,
  IconAdjustmentsHorizontal,
  IconFileCertificate,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconSitemap,
  IconBook2,
  IconCashBanknote,
  IconCalendarEvent,
  IconUsersGroup,
  IconChartPie,
  IconBuildingStore,
  IconCalculator,
  IconInfoCircle,
  IconAlertCircle,
  IconReceiptTax,
  IconMail,
  IconFileDescription,
  IconUpload,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';

export default function CrearEmpresa() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const formRef1 = useRef<HTMLFormElement>(null);
  const formRef2 = useRef<HTMLFormElement>(null);
  const formRef3 = useRef<HTMLFormElement>(null);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const [nit, setNit] = useState('');
  const [dv, setDv] = useState('');

  const [formData, setFormData] = useState({
    razonSocial: '', nombreComercial: '', tipoPersona: '', regimenFiscalP1: '',
    direccion: '', ciudad: '', departamento: '', pais: 'Colombia', telefono: '', email: '', sitioWeb: '', representanteLegal: '', identificacion: '',
    marcoNormativo: 'Grupo 2 NIIF Pymes', planCuentas: 'PUC Colombia', moneda: 'Peso Colombiano (COP)', añoFiscal: null as Date | null,
    centrosCosto: 'Sí', presupuesto: 'Sí', sucursales: 'No',
    responsabilidades: ['48 - Impuesto sobre las Ventas - IVA', '07 - Retención en la Fuente a Título de Renta', 'ReteICA - Retención de Industria y Comercio'],
    regimenTributarioP3: 'Ordinario', actividadCiiu: '', obligadoFacturar: 'Sí',
    correoTributario: '', correoRecepcion: '', manejaReteFuente: 'Sí', manejaReteIca: 'Sí',
  });

  const [ciiuList, setCiiuList] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    cargarCiiu();
  }, []);

  const cargarCiiu = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/globals/ciiu`);
      const json = await res.json();
      if (json.success) {
        setCiiuList(json.data.map((c: any) => ({
          value: c.codigo,
          label: `${c.codigo} - ${c.descripcion}`
        })));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateDV = (nitStr: string) => {
    const nitClean = nitStr.replace(/\D/g, '');
    if (!nitClean) {
      setDv('');
      return;
    }
    const vpri = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    let x = 0;
    let y = 0;
    let z = nitClean.length;
    for (let i = 0; i < z; i++) {
      y = parseInt(nitClean.charAt(i), 10);
      x += (y * vpri[z - 1 - i]);
    }
    y = x % 11;
    setDv(y > 1 ? (11 - y).toString() : y.toString());
  };

  const handleNitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value;
    setNit(val);
    calculateDV(val);
  };

  const nextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (formRef1.current && !formRef1.current.checkValidity()) {
      setErrorModalOpen(true);
      return;
    }
    setActiveStep((current) => (current < 3 ? current + 1 : current));
  };

  const nextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (formRef2.current && !formRef2.current.checkValidity()) {
      setErrorModalOpen(true);
      return;
    }
    setActiveStep((current) => (current < 3 ? current + 1 : current));
  };

  const nextStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (formRef3.current && !formRef3.current.checkValidity()) {
      setErrorModalOpen(true);
      return;
    }
    setActiveStep((current) => (current < 3 ? current + 1 : current));
  };

  const handleLogoUpload = (payload: File | null) => {
    if (!payload) return;
    setLogoFile(payload);
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoUrl(e.target?.result as string);
    };
    reader.readAsDataURL(payload);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'responsabilidades') {
          payload.append(key, JSON.stringify(formData.responsabilidades));
        } else if (key === 'añoFiscal') {
          const d = formData.añoFiscal instanceof Date ? formData.añoFiscal : null;
          payload.append('añoFiscalInicio', d ? d.toISOString() : '');
          const fin = d ? new Date(d.getFullYear(), 11, 31).toISOString() : '';
          payload.append('añoFiscalFin', fin);
        } else {
          payload.append(key, (formData as any)[key] || '');
        }
      });
      payload.append('nit', nit);
      payload.append('dv', dv);

      if (logoFile) {
        payload.append('logo', logoFile);
      }

      const res = await fetch('http://localhost:3000/api/empresas', {
        method: 'POST',
        body: payload
      });

      if (!res.ok) throw new Error('Error al guardar');

      navigate('/dashboard');
    } catch(err) {
      console.error(err);
      alert('Hubo un error guardando la empresa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  return (
    <AppShell
      header={{ height: 70 }}
      bg="gray.0"
    >
      <AppShell.Header>
        <Group h="100%" px="xl" justify="space-between">
          <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <IconChartArcs size={32} color="#5c3ce6" />
            <Text fw={800} size="xl" style={{ fontFamily: 'Inter, sans-serif' }}>AccountingPro</Text>
          </Group>

          <Group gap="lg">
            <Group gap="sm">
              <div style={{ textAlign: 'right' }}>
                <Text size="sm" fw={600}>Usuario Activo</Text>
                <Text size="xs" c="dimmed">Auditor Senior</Text>
              </div>
              <Avatar color="violet" radius="xl">AS</Avatar>
            </Group>
            
            <Divider orientation="vertical" />
            
            <UnstyledButton onClick={() => navigate('/login')}>
              <Group gap="xs">
                <IconLogout size={18} color="gray" />
                <Text size="sm" fw={500} c="dimmed">Cerrar Sesión</Text>
              </Group>
            </UnstyledButton>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Box px="xl" py="xl">
          <Box mb="xl">
            <Title order={2} style={{ fontFamily: 'Inter, sans-serif', color: '#1a1b4b' }}>Crear Nueva Empresa</Title>
            <Text size="md" c="dimmed" mt={4}>
              Complete la información para configurar su empresa en el sistema.
            </Text>
          </Box>

          <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
            <Stepper active={activeStep} onStepClick={setActiveStep} color="violet" size="sm">
              <Stepper.Step label="Información General" description={activeStep > 0 ? "Completado" : "En progreso"} />
              <Stepper.Step label="Configuración Contable" description={activeStep > 1 ? "Completado" : activeStep === 1 ? "En progreso" : "Pendiente"} />
              <Stepper.Step label="Parámetros Fiscales" description={activeStep > 2 ? "Completado" : activeStep === 2 ? "En progreso" : "Pendiente"} />
              <Stepper.Step label="Resumen" description={activeStep === 3 ? "En progreso" : "Pendiente"} />
            </Stepper>
          </Card>

          {activeStep === 0 && (
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card shadow="sm" padding="xl" radius="md" withBorder>
                <form ref={formRef1} onSubmit={nextStep1} noValidate>
                  <Title order={4} mb="xs">Información General</Title>
                  <Text size="sm" c="dimmed" mb="xl">Ingrese los datos básicos de la empresa.</Text>

                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label="Razón Social" placeholder="Ingrese la razón social de la empresa" required value={formData.razonSocial} onChange={(e) => updateForm('razonSocial', e.target.value)} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label="Nombre Comercial" placeholder="Ingrese el nombre comercial (opcional)" value={formData.nombreComercial} onChange={(e) => updateForm('nombreComercial', e.target.value)} />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 8 }}>
                    <TextInput 
                      label="Nit" 
                      placeholder="Ingrese el NIT" 
                      required 
                      value={nit}
                      onChange={handleNitChange}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <TextInput 
                      label="Dígito de Verificación" 
                      placeholder="DV" 
                      disabled 
                      value={dv}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select label="Tipo de Persona" placeholder="Seleccione el tipo de persona" data={['Persona Natural', 'Persona Jurídica']} required value={formData.tipoPersona} onChange={(val) => updateForm('tipoPersona', val)} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select label="Régimen Fiscal" placeholder="Seleccione el régimen fiscal" data={['Régimen Ordinario', 'Régimen Simple', 'Gran Contribuyente']} required value={formData.regimenFiscalP1} onChange={(val) => updateForm('regimenFiscalP1', val)} />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <TextInput label="Dirección" placeholder="Ingrese la dirección principal" required value={formData.direccion} onChange={(e) => updateForm('direccion', e.target.value)} />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Select label="Ciudad" placeholder="Seleccione la ciudad" data={['Bogotá', 'Medellín', 'Cali']} required value={formData.ciudad} onChange={(val) => updateForm('ciudad', val)} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Select label="Departamento" placeholder="Seleccione el departamento" data={['Cundinamarca', 'Antioquia', 'Valle del Cauca']} required value={formData.departamento} onChange={(val) => updateForm('departamento', val)} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Select label="País" placeholder="Colombia" data={['Colombia']} required value={formData.pais} onChange={(val) => updateForm('pais', val)} />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <TextInput label="Teléfono" placeholder="Ingrese el teléfono" value={formData.telefono} onChange={(e) => updateForm('telefono', e.target.value)} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <TextInput label="Email" placeholder="Ingrese el email" value={formData.email} onChange={(e) => updateForm('email', e.target.value)} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <TextInput label="Sitio Web" placeholder="Ingrese el sitio web (opcional)" value={formData.sitioWeb} onChange={(e) => updateForm('sitioWeb', e.target.value)} />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label="Representante Legal" placeholder="Nombre del representante legal" required value={formData.representanteLegal} onChange={(e) => updateForm('representanteLegal', e.target.value)} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label="Identificación" placeholder="Cédula de identidad" required value={formData.identificacion} onChange={(e) => updateForm('identificacion', e.target.value)} />
                  </Grid.Col>
                </Grid>

                <Divider my="xl" />

                <Group justify="space-between">
                  <Text size="xs" c="red.6">* Campos obligatorios</Text>
                  <Group>
                    <Button variant="default" onClick={() => navigate('/dashboard')}>Cancelar</Button>
                    <Button type="submit" color="violet" rightSection={<IconArrowRight size={16} />}>Siguiente</Button>
                  </Group>
                </Group>
                </form>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" padding="xl" radius="md" withBorder style={{ height: '100%' }}>
                <Box mb="xl" ta="center">
                  <ThemeIcon size={120} variant="light" color="violet" radius="md" mb="md" style={{ background: 'transparent' }}>
                     <IconBuilding size={80} color="#5c3ce6" stroke={1.2} />
                  </ThemeIcon>
                  <Title order={5} ta="left" mb="xs">Información de la Empresa</Title>
                  <Text size="sm" c="dimmed" ta="left" mb="xl">
                    Esta información será utilizada para la configuración inicial del sistema y podrá ser modificada posteriormente.
                  </Text>
                </Box>

                <Group wrap="nowrap" align="flex-start" mb="lg">
                  <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                    <IconShieldLock size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={600}>Seguridad</Text>
                    <Text size="xs" c="dimmed">La información de su empresa está protegida y es confidencial.</Text>
                  </div>
                </Group>

                <Group wrap="nowrap" align="flex-start" mb="lg">
                  <ThemeIcon variant="light" color="violet" size="lg" radius="md">
                    <IconAdjustmentsHorizontal size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={600}>Configuración</Text>
                    <Text size="xs" c="dimmed">Podrá configurar detalles adicionales después de crear la empresa.</Text>
                  </div>
                </Group>

                <Group wrap="nowrap" align="flex-start">
                  <ThemeIcon variant="light" color="green" size="lg" radius="md">
                    <IconFileCertificate size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={600}>Cumplimiento</Text>
                    <Text size="xs" c="dimmed">Asegúrese de ingresar la información correctamente para cumplimiento fiscal.</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
          )}

          {activeStep === 1 && (
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card shadow="sm" padding="xl" radius="md" withBorder>
                <form ref={formRef2} onSubmit={nextStep2} noValidate>
                  <Group mb="xs" align="center" gap="sm">
                    <ThemeIcon variant="light" color="violet" size="lg" radius="md">
                    <IconCalculator size={22} />
                  </ThemeIcon>
                  <Title order={4}>Configuración Contable</Title>
                </Group>
                <Text size="sm" c="dimmed" mb="xl" pl={46}>Defina los parámetros contables básicos con los que trabajará su empresa.</Text>

                <Grid mt="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group wrap="nowrap" align="flex-start" gap="sm" mb="xs">
                      <ActionIcon variant="light" color="violet" radius="xl" size="md">
                        <IconSitemap size={16} />
                      </ActionIcon>
                      <div style={{ flex: 1 }}>
                        <Select label="Marco Normativo" placeholder="Grupo 2 (NIIF para Pymes)" data={['Grupo 1 NIIF Plenas', 'Grupo 2 NIIF Pymes', 'Grupo 3 Microempresas', 'Entidad Pública', 'Régimen Especial']} required value={formData.marcoNormativo} onChange={(val) => updateForm('marcoNormativo', val)} />
                        <Text size="xs" c="dimmed" mt={4}>Define el marco técnico bajo el cual se elaborará la información financiera.</Text>
                      </div>
                    </Group>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group wrap="nowrap" align="flex-start" gap="sm" mb="xs">
                      <ActionIcon variant="light" color="violet" radius="xl" size="md">
                        <IconBook2 size={16} />
                      </ActionIcon>
                      <div style={{ flex: 1 }}>
                        <Select label="Plan de Cuentas" placeholder="PUC Colombia" data={['PUC Colombia', 'PUC Cooperativas', 'PUC Propiedad Horizontal', 'PUC ESAL', 'Personalizado']} required value={formData.planCuentas} onChange={(val) => updateForm('planCuentas', val)} />
                        <Text size="xs" c="dimmed" mt={4}>Selecciona el catálogo de cuentas que utilizará la empresa.</Text>
                      </div>
                    </Group>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group wrap="nowrap" align="flex-start" gap="sm" mb="xs">
                      <ActionIcon variant="light" color="violet" radius="xl" size="md">
                        <IconCashBanknote size={16} />
                      </ActionIcon>
                      <div style={{ flex: 1 }}>
                        <Select label="Moneda Principal" placeholder="Peso Colombiano (COP)" data={['Peso Colombiano (COP)', 'Dólar Estadounidense (USD)', 'Euro (EUR)']} required value={formData.moneda} onChange={(val) => updateForm('moneda', val)} />
                        <Text size="xs" c="dimmed" mt={4}>Moneda en la cual se llevará la contabilidad.</Text>
                      </div>
                    </Group>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group wrap="nowrap" align="flex-start" gap="sm" mb="xs">
                      <ActionIcon variant="light" color="violet" radius="xl" size="md">
                        <IconCalendarEvent size={16} />
                      </ActionIcon>
                      <div style={{ flex: 1 }}>
                        <DatePickerInput
                          label="Inicio de Año Fiscal"
                          placeholder="Seleccione la fecha inicial"
                          required
                          valueFormat="DD/MM/YYYY"
                          value={formData.añoFiscal}
                          onChange={(val) => updateForm('añoFiscal', val)}
                        />
                        <Text size="xs" c="dimmed" mt={4}>No se podrán abrir o ingresar información antes de la fecha inicial.</Text>
                      </div>
                    </Group>
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Divider my="sm" />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Group justify="space-between" wrap="nowrap">
                      <Group wrap="nowrap" align="flex-start" gap="sm">
                        <ActionIcon variant="light" color="violet" radius="xl" size="md">
                          <IconUsersGroup size={16} />
                        </ActionIcon>
                        <div>
                          <Text size="sm" fw={600}>Maneja Centros de Costo</Text>
                          <Text size="xs" c="dimmed">Permite clasificar los costos y gastos por centros.</Text>
                        </div>
                      </Group>
                      <SegmentedControl data={['Sí', 'No']} color="violet" w={150} value={formData.centrosCosto} onChange={(val) => updateForm('centrosCosto', val)} />
                    </Group>
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Group justify="space-between" wrap="nowrap">
                      <Group wrap="nowrap" align="flex-start" gap="sm">
                        <ActionIcon variant="light" color="violet" radius="xl" size="md">
                          <IconChartPie size={16} />
                        </ActionIcon>
                        <div>
                          <Text size="sm" fw={600}>Maneja Presupuesto</Text>
                          <Text size="xs" c="dimmed">Permite controlar y comparar presupuesto vs real.</Text>
                        </div>
                      </Group>
                      <SegmentedControl data={['Sí', 'No']} color="violet" w={150} value={formData.presupuesto} onChange={(val) => updateForm('presupuesto', val)} />
                    </Group>
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Group justify="space-between" wrap="nowrap">
                      <Group wrap="nowrap" align="flex-start" gap="sm">
                        <ActionIcon variant="light" color="violet" radius="xl" size="md">
                          <IconBuildingStore size={16} />
                        </ActionIcon>
                        <div>
                          <Text size="sm" fw={600}>Maneja Múltiples Sucursales</Text>
                          <Text size="xs" c="dimmed">La empresa cuenta con varias sedes o sucursales.</Text>
                        </div>
                      </Group>
                      <SegmentedControl data={['Sí', 'No']} color="violet" w={150} value={formData.sucursales} onChange={(val) => updateForm('sucursales', val)} />
                    </Group>
                  </Grid.Col>
                </Grid>

                <Divider my="xl" />

                <Group justify="space-between">
                  <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={prevStep}>Anterior</Button>
                  <Button type="submit" color="violet" rightSection={<IconArrowRight size={16} />}>Siguiente</Button>
                </Group>
                </form>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" padding="xl" radius="md" withBorder style={{ height: '100%' }}>
                <Box mb="xl" ta="center">
                  <ThemeIcon size={120} variant="light" color="violet" radius="md" mb="md" style={{ background: 'transparent' }}>
                     <IconCalculator size={80} color="#c084fc" stroke={1.2} />
                  </ThemeIcon>
                  <Title order={5} ta="left" mb="xs">Configuración Contable</Title>
                  <Text size="sm" c="dimmed" ta="left" mb="xl">
                    Esta información determina la estructura contable inicial de la empresa.
                  </Text>
                </Box>

                <Card bg="violet.0" p="md" radius="md" mb="xl">
                  <Group wrap="nowrap" align="flex-start" gap="sm">
                    <IconInfoCircle size={20} color="#5c3ce6" style={{ marginTop: 2 }} />
                    <Text size="sm" c="violet.9">Podrá modificarse posteriormente desde Configuración General.</Text>
                  </Group>
                </Card>

                <Group wrap="nowrap" align="flex-start" mb="lg">
                  <ThemeIcon variant="light" color="green" size="md" radius="xl">
                    <IconCheck size={16} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={600}>Compatible con NIIF</Text>
                    <Text size="xs" c="dimmed">Cumple con los marcos técnicos vigentes en Colombia.</Text>
                  </div>
                </Group>

                <Group wrap="nowrap" align="flex-start" mb="lg">
                  <ThemeIcon variant="light" color="green" size="md" radius="xl">
                    <IconCheck size={16} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={600}>Compatible con PUC Colombia</Text>
                    <Text size="xs" c="dimmed">Basado en el Plan Único de Cuentas establecido por la DIAN.</Text>
                  </div>
                </Group>

                <Group wrap="nowrap" align="flex-start">
                  <ThemeIcon variant="light" color="green" size="md" radius="xl">
                    <IconCheck size={16} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={600}>Configuración editable</Text>
                    <Text size="xs" c="dimmed">Podrá ajustar estos parámetros cuando lo necesite.</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
          )}

          {activeStep === 2 && (
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card shadow="sm" padding="xl" radius="md" withBorder>
                <form ref={formRef3} onSubmit={nextStep3} noValidate>
                  <Group mb="xs" align="center" gap="sm">
                    <ThemeIcon variant="light" color="violet" size="lg" radius="md">
                      <IconReceiptTax size={22} />
                    </ThemeIcon>
                    <Title order={4}>Parámetros Fiscales</Title>
                  </Group>
                  <Text size="sm" c="dimmed" mb="xl" pl={46}>Configure la información fiscal y tributaria de la empresa.</Text>

                  <Grid mt="md">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <MultiSelect 
                        label="Responsabilidades Tributarias" 
                        placeholder="Seleccione responsabilidades" 
                        data={[
                          '05 - Impuesto sobre la Renta y Complementarios', 
                          '48 - Impuesto sobre las Ventas - IVA', 
                          '07 - Retención en la Fuente a Título de Renta', 
                          'ReteICA - Retención de Industria y Comercio', 
                          '09 - Retención en la Fuente por IVA - ReteIVA', 
                          '52 - Obligado a Facturar Electrónicamente', 
                          '14 - Informante de Exógena'
                        ]} 
                        required 
                        clearable
                        searchable
                        value={formData.responsabilidades}
                        onChange={(val) => updateForm('responsabilidades', val)}
                      />
                      <Text size="xs" c="dimmed" mt={4}>Seleccione una o más responsabilidades aplicables.</Text>
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Select 
                        label="Régimen Tributario" 
                        placeholder="Ordinario" 
                        data={['Ordinario', 'Régimen Simple', 'Especial', 'Gran Contribuyente']} 
                        required 
                        value={formData.regimenTributarioP3}
                        onChange={(val) => updateForm('regimenTributarioP3', val)}
                      />
                      <Text size="xs" c="dimmed" mt={4}>Régimen tributario al cual pertenece su empresa.</Text>
                    </Grid.Col>

                    <Grid.Col span={12}>
                      <Select 
                        label="Actividad Económica Principal (CIIU)" 
                        placeholder="Seleccione o busque..." 
                        data={ciiuList} 
                        required 
                        searchable
                        clearable
                        value={formData.actividadCiiu}
                        onChange={(val) => updateForm('actividadCiiu', val || '')}
                      />
                      <Text size="xs" c="dimmed" mt={4}>Seleccione la actividad económica principal de su empresa.</Text>
                    </Grid.Col>

                    <Grid.Col span={12}>
                      <Radio.Group label="Obligado a Facturar Electrónicamente ante la DIAN" withAsterisk value={formData.obligadoFacturar} onChange={(val) => updateForm('obligadoFacturar', val)}>
                        <Group mt="xs" mb="xs">
                          <Radio value="Sí" label="Sí" color="violet" />
                          <Radio value="No" label="No" color="violet" />
                        </Group>
                      </Radio.Group>
                      <Text size="xs" c="dimmed">Indique si su empresa está obligada a facturar electrónicamente.</Text>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput 
                        label="Correo Tributario" 
                        placeholder="impuestos@empresa.com" 
                        type="email"
                        required 
                        rightSection={<IconMail size={16} color="gray" />} 
                        value={formData.correoTributario}
                        onChange={(e) => updateForm('correoTributario', e.target.value)}
                      />
                      <Text size="xs" c="dimmed" mt={4}>Correo utilizado para comunicaciones tributarias.</Text>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput 
                        label="Correo para Recepción de Facturas Electrónicas" 
                        placeholder="facturas@empresa.com" 
                        type="email"
                        required 
                        rightSection={<IconMail size={16} color="gray" />} 
                        value={formData.correoRecepcion}
                        onChange={(e) => updateForm('correoRecepcion', e.target.value)}
                      />
                      <Text size="xs" c="dimmed" mt={4}>Correo donde recibirá las facturas electrónicas.</Text>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Radio.Group label="Maneja Retención en la Fuente" withAsterisk value={formData.manejaReteFuente} onChange={(val) => updateForm('manejaReteFuente', val)}>
                        <Group mt="xs" mb="xs">
                          <Radio value="Sí" label="Sí" color="violet" />
                          <Radio value="No" label="No" color="violet" />
                        </Group>
                      </Radio.Group>
                      <Text size="xs" c="dimmed">Indique si su empresa practica retención en la fuente.</Text>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Radio.Group label="Maneja Retención de ICA" withAsterisk value={formData.manejaReteIca} onChange={(val) => updateForm('manejaReteIca', val)}>
                        <Group mt="xs" mb="xs">
                          <Radio value="Sí" label="Sí" color="violet" />
                          <Radio value="No" label="No" color="violet" />
                        </Group>
                      </Radio.Group>
                      <Text size="xs" c="dimmed">Indique si su empresa practica retención de ICA.</Text>
                    </Grid.Col>
                  </Grid>

                  <Divider my="xl" />

                  <Group justify="space-between">
                    <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={prevStep}>Anterior</Button>
                    <Group>
                      <Text size="xs" c="red.6">* Campos obligatorios</Text>
                      <Button type="submit" color="violet" rightSection={<IconArrowRight size={16} />}>Siguiente</Button>
                    </Group>
                  </Group>
                </form>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" padding="xl" radius="md" withBorder style={{ height: '100%' }}>
                <Box mb="xl" ta="center">
                  <ThemeIcon size={120} variant="light" color="violet" radius="md" mb="md" style={{ background: 'transparent' }}>
                     <IconReceiptTax size={80} color="#c084fc" stroke={1.2} />
                  </ThemeIcon>
                  <Title order={5} ta="left" mb="xs">Parámetros Fiscales</Title>
                  <Text size="sm" c="dimmed" ta="left" mb="xl">
                    Esta información será utilizada para el cumplimiento de sus obligaciones fiscales.
                  </Text>
                </Box>

                <Card bg="violet.0" p="md" radius="md" mb="xl">
                  <Text size="sm" fw={600} c="violet.9" mb="md">Se utilizará para:</Text>
                  
                  <Group wrap="nowrap" align="center" gap="sm" mb="xs">
                    <ThemeIcon variant="filled" color="violet" size="sm" radius="xl">
                      <IconCheck size={12} stroke={3} />
                    </ThemeIcon>
                    <Text size="sm" c="violet.9">Facturación electrónica</Text>
                  </Group>
                  <Group wrap="nowrap" align="center" gap="sm" mb="xs">
                    <ThemeIcon variant="filled" color="violet" size="sm" radius="xl">
                      <IconCheck size={12} stroke={3} />
                    </ThemeIcon>
                    <Text size="sm" c="violet.9">Reportes a la DIAN</Text>
                  </Group>
                  <Group wrap="nowrap" align="center" gap="sm" mb="xs">
                    <ThemeIcon variant="filled" color="violet" size="sm" radius="xl">
                      <IconCheck size={12} stroke={3} />
                    </ThemeIcon>
                    <Text size="sm" c="violet.9">Retenciones y autorretenciones</Text>
                  </Group>
                  <Group wrap="nowrap" align="center" gap="sm" mb="xs">
                    <ThemeIcon variant="filled" color="violet" size="sm" radius="xl">
                      <IconCheck size={12} stroke={3} />
                    </ThemeIcon>
                    <Text size="sm" c="violet.9">Información exógena</Text>
                  </Group>
                  <Group wrap="nowrap" align="center" gap="sm">
                    <ThemeIcon variant="filled" color="violet" size="sm" radius="xl">
                      <IconCheck size={12} stroke={3} />
                    </ThemeIcon>
                    <Text size="sm" c="violet.9">Impuestos y obligaciones tributarias</Text>
                  </Group>
                </Card>

                <Group wrap="nowrap" align="flex-start" gap="sm">
                  <IconInfoCircle size={20} color="#5c3ce6" style={{ marginTop: 2 }} />
                  <Text size="sm" c="dimmed">
                    Podrá modificar estos parámetros posteriormente desde el módulo de Configuración Fiscal.
                  </Text>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
          )}

          {activeStep === 3 && (
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Card shadow="sm" padding="xl" radius="md" withBorder>
                <form onSubmit={submitForm}>
                  <Group mb="xs" align="center" gap="sm">
                    <ThemeIcon variant="light" color="violet" size="lg" radius="md">
                      <IconFileDescription size={22} />
                    </ThemeIcon>
                    <Title order={4}>Resumen de la Empresa</Title>
                  </Group>
                  <Text size="sm" c="dimmed" mb="xl" pl={46}>Revise la información registrada antes de finalizar la creación.</Text>

                  <Box mb="xl">
                    <Group gap="xs" mb="sm">
                      <IconBuilding size={16} color="#5c3ce6" />
                      <Text fw={600} size="sm" c="violet.9">Información General</Text>
                    </Group>
                    <Grid>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="xs" fw={600}>Razón Social</Text>
                        <Text size="sm" c="dimmed">{formData.razonSocial || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="xs" fw={600}>NIT</Text>
                        <Text size="sm" c="dimmed">{nit ? `${nit}-${dv}` : '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="xs" fw={600}>Tipo de Persona</Text>
                        <Text size="sm" c="dimmed">{formData.tipoPersona || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="xs" fw={600}>Régimen Fiscal</Text>
                        <Text size="sm" c="dimmed">{formData.regimenFiscalP1 || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="xs" fw={600}>Dirección</Text>
                        <Text size="sm" c="dimmed">{formData.direccion || '-'} {formData.ciudad ? `, ${formData.ciudad}` : ''}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="xs" fw={600}>Teléfono</Text>
                        <Text size="sm" c="dimmed">{formData.telefono?.trim() ? formData.telefono : '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="xs" fw={600}>Email</Text>
                        <Text size="sm" c="dimmed">{formData.email?.trim() ? formData.email : '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 8 }}>
                        <Text size="xs" fw={600}>Representante Legal</Text>
                        <Text size="sm" c="dimmed">{formData.representanteLegal || '-'}</Text>
                      </Grid.Col>
                    </Grid>
                  </Box>

                  <Divider my="md" variant="dashed" />

                  <Box mb="xl" mt="md">
                    <Group gap="xs" mb="sm">
                      <IconCalculator size={16} color="#5c3ce6" />
                      <Text fw={600} size="sm" c="violet.9">Configuración Contable</Text>
                    </Group>
                    <Grid>
                      <Grid.Col span={{ base: 12, sm: 3 }}>
                        <Text size="xs" fw={600}>Marco Normativo</Text>
                        <Text size="sm" c="dimmed">{formData.marcoNormativo || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 3 }}>
                        <Text size="xs" fw={600}>Plan de Cuentas</Text>
                        <Text size="sm" c="dimmed">{formData.planCuentas || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 3 }}>
                        <Text size="xs" fw={600}>Moneda Principal</Text>
                        <Text size="sm" c="dimmed">{formData.moneda || '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 3 }}>
                        <Text size="xs" fw={600}>Inicio Año Fiscal</Text>
                        <Text size="sm" c="dimmed">
                          {formData.añoFiscal instanceof Date ? `${formData.añoFiscal.getDate().toString().padStart(2, '0')}/${(formData.añoFiscal.getMonth() + 1).toString().padStart(2, '0')}/${formData.añoFiscal.getFullYear()}` : '-'}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 3 }}>
                        <Text size="xs" fw={600}>Centros de Costo</Text>
                        <Text size="sm" c="dimmed">{formData.centrosCosto}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 3 }}>
                        <Text size="xs" fw={600}>Presupuesto</Text>
                        <Text size="sm" c="dimmed">{formData.presupuesto}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 3 }}>
                        <Text size="xs" fw={600}>Sucursales</Text>
                        <Text size="sm" c="dimmed">{formData.sucursales}</Text>
                      </Grid.Col>
                    </Grid>
                  </Box>

                  <Divider my="md" variant="dashed" />

                  <Box mt="md">
                    <Group gap="xs" mb="sm">
                      <IconReceiptTax size={16} color="#5c3ce6" />
                      <Text fw={600} size="sm" c="violet.9">Parámetros Fiscales</Text>
                    </Group>
                    <Grid>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="xs" fw={600}>Responsabilidades DIAN</Text>
                        <Text size="sm" c="dimmed">
                          {formData.responsabilidades.length > 0 
                            ? formData.responsabilidades.map(r => r.split(' - ')[0]).join(', ') 
                            : '-'}
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="xs" fw={600}>Actividad Económica</Text>
                        <Text size="sm" c="dimmed">{formData.actividadCiiu ? formData.actividadCiiu.split(' - ')[0] : '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="xs" fw={600}>Obligado a Facturar</Text>
                        <Text size="sm" c="dimmed">{formData.obligadoFacturar}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="xs" fw={600}>Correo Tributario (DIAN)</Text>
                        <Text size="sm" c="dimmed">{formData.correoTributario?.trim() ? formData.correoTributario : '-'}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Text size="xs" fw={600}>Correo Recepción Facturas</Text>
                        <Text size="sm" c="dimmed">{formData.correoRecepcion?.trim() ? formData.correoRecepcion : '-'}</Text>
                      </Grid.Col>
                    </Grid>
                  </Box>

                  <Divider my="xl" />

                  <Group justify="space-between">
                    <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={prevStep} disabled={isSubmitting}>Anterior</Button>
                    <Button type="submit" color="violet" rightSection={<IconCheck size={16} />} loading={isSubmitting}>Finalizar y Crear Empresa</Button>
                  </Group>
                </form>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" padding="xl" radius="md" withBorder style={{ height: '100%' }}>
                <Title order={5} ta="left" mb="xs">Logo de la Empresa (Opcional)</Title>
                <Text size="sm" c="dimmed" ta="left" mb="xl">
                  Este logo se mostrará en sus documentos PDF, facturas, reportes y demás formatos.
                </Text>

                <FileButton onChange={handleLogoUpload} accept="image/png,image/jpeg,image/svg+xml">
                  {(props) => (
                    <UnstyledButton
                      {...props}
                      style={{
                        width: '100%',
                        border: '2px dashed #e5e4e7',
                        borderRadius: 8,
                        padding: '32px 16px',
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <ThemeIcon size={60} variant="light" color="violet" radius="xl" mb="md" style={{ margin: '0 auto' }}>
                        {logoUrl ? <Image src={logoUrl} w={30} h={30} fit="contain" /> : <IconUpload size={30} />}
                      </ThemeIcon>
                      <Text size="sm" fw={600} mb={4}>{logoFile ? logoFile.name : 'Arrastra tu logo aquí o'} <span style={{ color: '#5c3ce6' }}>{!logoFile && 'haz clic para seleccionar'}</span></Text>
                      <Text size="xs" c="dimmed">Formatos: PNG, JPG, SVG</Text>
                      <Text size="xs" c="dimmed">Tamaño recomendado: 300 x 300 px</Text>
                    </UnstyledButton>
                  )}
                </FileButton>

                <Text size="sm" fw={600} mt="xl" mb="sm">Vista previa</Text>
                <Card withBorder radius="md" p="md" mb="xl">
                  <Group wrap="nowrap" align="center" gap="md">
                    {logoUrl ? (
                      <Image src={logoUrl} w={64} h={64} fit="contain" radius="md" />
                    ) : (
                      <ThemeIcon size={64} variant="light" color="violet" radius="md">
                        <IconBuilding size={32} />
                      </ThemeIcon>
                    )}
                    <div>
                      <Text size="sm" fw={700}>{formData.razonSocial ? formData.razonSocial.toUpperCase() : 'NOMBRE DE LA EMPRESA'}</Text>
                      <Text size="xs" c="dimmed">NIT {nit ? `${nit}-${dv}` : '123456789-0'}</Text>
                      <Text size="xs" c="dimmed">{formData.direccion || 'Dirección'} {formData.ciudad ? `, ${formData.ciudad}` : ''}</Text>
                      <Text size="xs" c="dimmed">{formData.telefono || 'Teléfono'} - {formData.email || 'Email'}</Text>
                    </div>
                  </Group>
                  <Divider my="sm" />
                  <Box bg="gray.1" h={8} w="100%" mb={6} style={{ borderRadius: 'var(--mantine-radius-sm)' }} />
                  <Box bg="gray.1" h={8} w="80%" mb={6} style={{ borderRadius: 'var(--mantine-radius-sm)' }} />
                  <Box bg="gray.1" h={8} w="90%" style={{ borderRadius: 'var(--mantine-radius-sm)' }} />
                </Card>

                <Card bg="violet.0" p="md" radius="md" mb="xl">
                  <Group wrap="nowrap" align="flex-start" gap="sm">
                    <IconInfoCircle size={20} color="#5c3ce6" style={{ marginTop: 2 }} />
                    <Text size="sm" c="violet.9">Podrá cambiar o actualizar el logo en cualquier momento desde Configuración {'>'} Empresa.</Text>
                  </Group>
                </Card>

                <Text size="sm" fw={600} mb="md">Antes de finalizar</Text>
                
                <Group wrap="nowrap" align="center" gap="sm" mb="xs">
                  <ThemeIcon variant="light" color="green" size="sm" radius="xl">
                    <IconCheck size={12} stroke={3} />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed">La información de la empresa es correcta</Text>
                </Group>
                <Group wrap="nowrap" align="center" gap="sm" mb="xs">
                  <ThemeIcon variant="light" color="green" size="sm" radius="xl">
                    <IconCheck size={12} stroke={3} />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed">La configuración contable está definida</Text>
                </Group>
                <Group wrap="nowrap" align="center" gap="sm" mb="xs">
                  <ThemeIcon variant="light" color="green" size="sm" radius="xl">
                    <IconCheck size={12} stroke={3} />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed">Los parámetros fiscales están configurados</Text>
                </Group>
                <Group wrap="nowrap" align="center" gap="sm">
                  <ThemeIcon variant="light" color="green" size="sm" radius="xl">
                    <IconCheck size={12} stroke={3} />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed">El logo se verá en los documentos PDF</Text>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
          )}

          <Modal opened={errorModalOpen} onClose={() => setErrorModalOpen(false)} title={<Group gap="sm"><IconAlertCircle color="red" /><Text fw={600}>Error de Validación</Text></Group>} centered>
            <Text size="sm" mb="xl">Por favor, complete todos los campos obligatorios (marcados con *) antes de continuar al siguiente paso.</Text>
            <Group justify="flex-end">
              <Button color="violet" onClick={() => setErrorModalOpen(false)}>Entendido</Button>
            </Group>
          </Modal>

          <Box mt={50} ta="center">
            <Text size="xs" c="dimmed">
              © 2026 AccountingPro. Todos los derechos reservados. &nbsp;|&nbsp; Versión 1.0.0
            </Text>
          </Box>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
