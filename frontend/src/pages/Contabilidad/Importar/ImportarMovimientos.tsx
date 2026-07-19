import React, { useState } from 'react';
import { 
  Box, Title, Text, Stepper, Button, Group, Paper, 
  Card, Table, Badge, Alert, ActionIcon 
} from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { 
  IconUpload, IconX, IconFileSpreadsheet, IconCheck, 
  IconAlertCircle, IconDownload, IconClock
} from '@tabler/icons-react';
import '@mantine/dropzone/styles.css';
import TenantLayout from '../../../components/layout/TenantLayout';
import { notifications } from '@mantine/notifications';
import Paso2Validacion from './Paso2Validacion';
import Paso3Mapeo from './Paso3Mapeo';
import Paso4VistaPrevia from './Paso4VistaPrevia';
import Paso5Confirmar from './Paso5Confirmar';

export default function ImportarMovimientos() {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isStep3Valid, setIsStep3Valid] = useState(false);
  const [isStep4Valid, setIsStep4Valid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mappings, setMappings] = useState<Record<string, string | null>>({});
  const [uploadData, setUploadData] = useState<any>(null);
  const [validationData, setValidationData] = useState<any>(null);

  const nextStep = () => setActiveStep((current) => (current < 4 ? current + 1 : current));
  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  const handleDownloadTemplate = async () => {
    try {
      const tenantId = localStorage.getItem('activeTenantId');
      if (!tenantId) throw new Error("Empresa no encontrada");
      const response = await fetch(`http://localhost:3000/api/importaciones/plantilla`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });
      if (!response.ok) throw new Error('Error descargando plantilla');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_importacion.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo descargar la plantilla',
        color: 'red'
      });
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setIsUploading(true);

    try {
      const tenantId = localStorage.getItem('activeTenantId');
      if (!tenantId) throw new Error("Empresa no encontrada");
      const formData = new FormData();
      formData.append('archivo', selectedFile);

      const response = await fetch('http://localhost:3000/api/importaciones/upload', {
        method: 'POST',
        headers: {
          'x-tenant-id': tenantId
        },
        body: formData
      });

      if (!response.ok) throw new Error('Error subiendo archivo');
      
      const data = await response.json();
      setFile(selectedFile);
      setUploadData(data);
      
      notifications.show({
        title: 'Archivo Cargado',
        message: `El archivo ${selectedFile.name} está listo para ser validado.`,
        color: 'blue'
      });
      setActiveStep(1); 
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo subir el archivo al servidor',
        color: 'red'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async (config: any) => {
    setIsSubmitting(true);
    try {
      const tenantId = localStorage.getItem('activeTenantId');
      if (!tenantId) throw new Error("Empresa no encontrada");
      const payload = {
        importacionId: uploadData?.importacionId,
        config: config,
        mappings: mappings
      };

      const response = await fetch('http://localhost:3000/api/importaciones/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error confirmando importación');
      }

      notifications.show({
        title: 'Importación Completada',
        message: 'Los movimientos han sido importados exitosamente.',
        color: 'green'
      });

      setTimeout(() => {
        navigate('/contabilidad/movimientos');
      }, 1500);
      
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Ocurrió un error al importar los movimientos.',
        color: 'red'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isNextDisabled = () => {
    if (activeStep === 0) return !file;
    if (activeStep === 1) return false;
    if (activeStep === 2) return !isStep3Valid;
    if (activeStep === 3) return !isStep4Valid;
    return false;
  };

  return (
    <TenantLayout>
      <Box p="md">
        <Group justify="space-between" mb="md">
          <Box>
            <Title order={2}>Importación de Movimientos</Title>
            <Text c="dimmed" size="sm">Contabilidad &gt; Importación de Movimientos</Text>
          </Box>
          <Group>
            <Button variant="outline" leftSection={<IconClock size={16} />}>Historial</Button>
            <Button variant="outline" leftSection={<IconDownload size={18} />} onClick={handleDownloadTemplate}>
              Descargar Plantilla
            </Button>
          </Group>
        </Group>

        <Paper withBorder shadow="sm" p="xl" radius="md" mb="lg">
          <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false} size="sm">
            <Stepper.Step label="Seleccionar Archivo" description="Cargue el archivo" />
            <Stepper.Step label="Validar Estructura" description="Verifique estructura" />
            <Stepper.Step label="Mapear Columnas" description="Relacione columnas" />
            <Stepper.Step label="Vista Previa" description="Revise movimientos" />
            <Stepper.Step label="Confirmar Importación" description="Ejecute importación" />
          </Stepper>
        </Paper>

        {activeStep === 0 && (
          <Group align="flex-start" grow>
            <Card withBorder shadow="sm" radius="md" p="xl">
              <Dropzone
                onDrop={handleFileUpload}
                onReject={() => notifications.show({ title: 'Error', message: 'Archivo no permitido', color: 'red' })}
                maxSize={10 * 1024 ** 2}
                accept={[MIME_TYPES.csv, MIME_TYPES.xlsx, MIME_TYPES.xls]}
                mb="md"
                loading={isUploading}
              >
                <Group justify="center" gap="xl" style={{ minHeight: 120, pointerEvents: 'none' }}>
                  <Dropzone.Accept><IconUpload size={50} color="var(--mantine-color-blue-6)" stroke={1.5} /></Dropzone.Accept>
                  <Dropzone.Reject><IconX size={50} color="var(--mantine-color-red-6)" stroke={1.5} /></Dropzone.Reject>
                  <Dropzone.Idle><IconFileSpreadsheet size={50} color="var(--mantine-color-dimmed)" stroke={1.5} /></Dropzone.Idle>
                  <div>
                    <Text size="xl" inline>Arrastre y suelte su archivo aquí</Text>
                    <Text size="sm" c="dimmed" inline mt={7}>o haga clic para Seleccionar Archivo</Text>
                  </div>
                </Group>
              </Dropzone>
              {file && (
                <Alert mt="md" title="Archivo Seleccionado" color="blue" icon={<IconCheck size={16} />}>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </Alert>
              )}
            </Card>

            <Card withBorder shadow="sm" radius="md" p="xl">
              <Title order={4} mb="md">Requisitos del Archivo</Title>
              <Box>
                <Group mb="xs"><IconCheck size={18} color="green" /> <Text size="sm">El archivo debe contener encabezados en la primera fila</Text></Group>
                <Group mb="xs"><IconCheck size={18} color="green" /> <Text size="sm">Formato Excel (.xlsx, .xls) o CSV (.csv)</Text></Group>
                <Group mb="xs"><IconCheck size={18} color="green" /> <Text size="sm">Tamaño máximo permitido: 10 MB</Text></Group>
                <Group mb="xs"><IconCheck size={18} color="green" /> <Text size="sm">Los movimientos deben estar en datos contables válidos</Text></Group>
                <Group mb="xs"><IconCheck size={18} color="green" /> <Text size="sm">Las cuentas deben existir en el plan de cuentas</Text></Group>
                <Group mb="xs"><IconCheck size={18} color="green" /> <Text size="sm">Las fechas deben tener formato válido (dd/mm/aaaa)</Text></Group>
              </Box>

              <Alert mt="xl" icon={<IconAlertCircle size={16} />} title="Información" color="indigo">
                Esta herramienta le permite importar movimientos contables de forma masiva.
                Asegúrese de que el archivo cumpla con los requisitos antes de continuar.
              </Alert>
            </Card>
          </Group>
        )}

        {activeStep === 1 && file && (
          <Paso2Validacion 
            file={file} 
            uploadData={uploadData}
            onValidationSuccess={() => console.log('success')} 
            onCancel={() => {
              setFile(null);
              setActiveStep(0);
            }} 
          />
        )}
        
        {activeStep === 2 && file && (
          <Paso3Mapeo 
            file={file} 
            uploadData={uploadData}
            onValidityChange={setIsStep3Valid}
            onMappingComplete={(data) => {
              setMappings(data);
            }}
            onCancel={() => {
              setFile(null);
              setActiveStep(0);
            }} 
          />
        )}

        {activeStep === 3 && file && (
          <Paso4VistaPrevia 
            file={file} 
            uploadData={uploadData}
            mappings={mappings}
            onValidationComplete={setIsStep4Valid}
            onDataLoaded={setValidationData}
            onGoBackToMapping={() => setActiveStep(2)}
          />
        )}

        {activeStep === 4 && file && (
          <Paso5Confirmar 
            file={file} 
            uploadData={uploadData}
            validationData={validationData}
            isSubmitting={isSubmitting}
            onConfirm={handleConfirm}
            onCancel={() => setActiveStep(3)}
            onReset={() => {
              setFile(null);
              setActiveStep(0);
            }}
          />
        )}

        {activeStep < 4 && (
          <Group justify="space-between" mt="xl">
            <Button variant="default" onClick={prevStep} disabled={activeStep === 0 || isSubmitting}>
              Atrás
            </Button>
            <Button onClick={nextStep} disabled={isNextDisabled()}>
              Siguiente
            </Button>
          </Group>
        )}
      </Box>
    </TenantLayout>
  );
}
