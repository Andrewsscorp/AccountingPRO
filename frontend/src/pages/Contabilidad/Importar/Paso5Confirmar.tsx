import React, { useState } from 'react';
import { 
  Box, Group, Paper, Text, Grid, Button, Switch, 
  Select, TextInput, Textarea, Badge, Stack, Alert,
  ThemeIcon, Divider, SimpleGrid
} from '@mantine/core';
import { 
  IconCheck, IconAlertTriangle, IconX, IconInfoCircle, 
  IconFileSpreadsheet, IconArrowLeft, IconChecklist, IconDeviceFloppy,
  IconDownload
} from '@tabler/icons-react';

interface Paso5ConfirmarProps {
  file: File;
  uploadData: any;
  validationData?: any; // Piped from Paso 4 eventually, for now we derive from uploadData if missing
  onConfirm: (config: any) => void;
  onCancel: () => void;
  onReset: () => void;
  isSubmitting: boolean;
}

export default function Paso5Confirmar({ file, uploadData, validationData, onConfirm, onCancel, onReset, isSubmitting }: Paso5ConfirmarProps) {
  // Defaults for configuration
  const [config, setConfig] = useState({
    comprobante: 'auto',
    fechaComprobante: new Date().toISOString().split('T')[0],
    observacion: `Importación de movimientos ${file.name}`,
    unicoComprobante: true,
    validarDuplicados: true,
    permitirAdvertencias: false,
    detenerErrores: true,
    segundoPlano: false
  });

  const [empresaNombre, setEmpresaNombre] = useState<string>('Cargando...');

  const handleChange = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  React.useEffect(() => {
    fetch('http://localhost:3000/api/empresas')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const savedTenantId = localStorage.getItem('activeTenantId');
          const foundEmpresa = data.data.find((e: any) => e.codigo_empresa === savedTenantId);
          if (foundEmpresa) {
            setEmpresaNombre(foundEmpresa.razonSocial);
          } else if (data.data.length > 0) {
            setEmpresaNombre(data.data[0].razonSocial);
          } else {
            setEmpresaNombre('Empresa no definida');
          }
        }
      })
      .catch(() => setEmpresaNombre('Error cargando empresa'));
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(value);
  };

  // Derive summary metrics from validationData or uploadData
  const validRecords = validationData?.validRecords ?? uploadData?.totalRegistros ?? 0;
  const warningRecords = validationData?.warningRecords ?? 0;
  const errorRecords = validationData?.errorRecords ?? 0;
  const totalRecords = validationData?.totalRecords ?? uploadData?.totalRegistros ?? 0;
  
  const totalDebito = validationData?.totalDebito ?? 0;
  const totalCredito = validationData?.totalCredito ?? 0;
  const diferencia = Math.abs(totalDebito - totalCredito);
  const estaBalanceado = diferencia === 0 && totalRecords > 0;

  const canImport = estaBalanceado && (config.permitirAdvertencias ? true : warningRecords === 0) && (config.detenerErrores ? errorRecords === 0 : true);

  return (
    <Box>
      <Text size="sm" c="dimmed" mb="md">
        Revise el resumen final y confirme para ejecutar la importación de los movimientos contables.
      </Text>

      {/* Panel Superior: Archivo */}
      <Paper withBorder p="md" radius="md" mb="xl">
        <Grid align="center">
          <Grid.Col span={4}>
            <Group>
              <ThemeIcon size={40} color="green" variant="light">
                <IconFileSpreadsheet size={24} />
              </ThemeIcon>
              <Box>
                <Text size="xs" c="dimmed">Archivo:</Text>
                <Text size="sm" fw={500} truncate>{file.name}</Text>
              </Box>
            </Group>
          </Grid.Col>
          <Grid.Col span={2}>
            <Box>
              <Text size="xs" c="dimmed">Hoja:</Text>
              <Text size="sm" fw={500}>Movimientos</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={2}>
            <Box>
              <Text size="xs" c="dimmed">Registros totales:</Text>
              <Text size="sm" fw={500}>{totalRecords}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={2}>
            <Box>
              <Text size="xs" c="dimmed">Registros válidos:</Text>
              <Text size="sm" fw={500} c="green">{validRecords}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={1}>
            <Box>
              <Text size="xs" c="dimmed">Advertencias:</Text>
              <Text size="sm" fw={500} c={warningRecords > 0 ? "orange" : "dimmed"}>{warningRecords}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={1}>
            <Box>
              <Text size="xs" c="dimmed">Errores:</Text>
              <Text size="sm" fw={500} c={errorRecords > 0 ? "red" : "dimmed"}>{errorRecords}</Text>
            </Box>
          </Grid.Col>
        </Grid>
      </Paper>

      <SimpleGrid cols={4} spacing="md" breakpoints={[{ maxWidth: 'md', cols: 2 }, { maxWidth: 'sm', cols: 1 }]}>
        
        {/* Col 1: Resumen de Validación y Totales */}
        <Stack gap="md">
          <Paper withBorder p="md" radius="md" h="100%">
            <Text fw={600} mb="sm">Resumen de Validación</Text>
            
            <Alert color={errorRecords > 0 ? 'red' : 'green'} variant="light" mb="md" p="xs" 
              icon={errorRecords > 0 ? <IconX size={16} /> : <IconCheck size={16} />}
            >
              <Text fw={600} size="sm">
                {errorRecords > 0 ? 'Existen errores' : 'Validación completada'}
              </Text>
              <Text size="xs">
                {errorRecords > 0 ? 'Debe corregir el archivo antes de continuar' : 'El archivo está listo para ser importado'}
              </Text>
            </Alert>

            <Stack gap="xs">
              <Group justify="space-between">
                <Group gap="xs"><IconCheck size={14} color="var(--mantine-color-green-6)"/><Text size="sm">Partidas dobles balanceadas</Text></Group>
                <Text size="sm" fw={600} c={estaBalanceado ? 'green' : 'red'}>{estaBalanceado ? '100%' : 'No'}</Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs"><IconCheck size={14} color="var(--mantine-color-green-6)"/><Text size="sm">Cuentas válidas</Text></Group>
                <Text size="sm" fw={600} c="green">{validRecords}</Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs"><IconCheck size={14} color="var(--mantine-color-green-6)"/><Text size="sm">Terceros válidos</Text></Group>
                <Text size="sm" fw={600} c="green">{validRecords}</Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs"><IconAlertTriangle size={14} color="var(--mantine-color-orange-6)"/><Text size="sm">Advertencias</Text></Group>
                <Text size="sm" fw={600} c={warningRecords > 0 ? 'orange' : 'dimmed'}>{warningRecords}</Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs"><IconX size={14} color="var(--mantine-color-red-6)"/><Text size="sm">Errores</Text></Group>
                <Text size="sm" fw={600} c={errorRecords > 0 ? 'red' : 'dimmed'}>{errorRecords}</Text>
              </Group>
            </Stack>
          </Paper>
        </Stack>

        <Stack gap="md">
          <Paper withBorder p="md" radius="md" h="100%">
            <Text fw={600} mb="sm">Totales del Movimiento</Text>
            
            <Stack gap="xs" mb="lg">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Total Débito</Text>
                <Text size="sm" fw={600}>{formatCurrency(totalDebito)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Total Crédito</Text>
                <Text size="sm" fw={600}>{formatCurrency(totalCredito)}</Text>
              </Group>
              <Divider my="xs" />
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Diferencia</Text>
                <Text size="sm" fw={600} c={diferencia === 0 ? 'green' : 'red'}>{formatCurrency(diferencia)}</Text>
              </Group>
            </Stack>

            <Alert color={estaBalanceado ? 'green' : 'red'} variant="light" p="xs" icon={<IconCheck size={16} />}>
              <Text fw={600} size="sm">{estaBalanceado ? 'Partida doble balanceada' : 'Partida doble NO balanceada'}</Text>
              <Text size="xs">{estaBalanceado ? 'Los débitos son iguales a los créditos' : 'Debe corregir las diferencias en su archivo'}</Text>
            </Alert>
          </Paper>
        </Stack>

        {/* Col 2: Info e Opciones */}
        <Stack gap="md">
          <Paper withBorder p="md" radius="md">
            <Text fw={600} mb="sm">Información de la Importación</Text>
            
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Fecha de importación:</Text>
                <Text size="sm" fw={500}>{new Date().toLocaleDateString()}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Usuario que importa:</Text>
                <Text size="sm" fw={500}>Administrador</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Empresa:</Text>
                <Text size="sm" fw={500} style={{ textTransform: 'uppercase' }}>{empresaNombre}</Text>
              </Group>
              
              <Select
                label="Comprobante"
                size="xs"
                data={[
                  { value: 'auto', label: 'Auto-generado' },
                  { value: 'cc', label: 'Comprobante Contable (CC)' },
                  { value: 'aj', label: 'Ajuste (AJ)' }
                ]}
                value={config.comprobante}
                onChange={(v) => handleChange('comprobante', v)}
                mt="xs"
              />
              
              <TextInput
                label="Fecha del comprobante"
                type="date"
                size="xs"
                value={config.fechaComprobante}
                onChange={(e) => handleChange('fechaComprobante', e.target.value)}
              />

              <Textarea
                label="Observación general"
                size="xs"
                minRows={2}
                value={config.observacion}
                onChange={(e) => handleChange('observacion', e.target.value)}
              />
            </Stack>
          </Paper>
        </Stack>

        <Stack gap="md">
          <Paper withBorder p="md" radius="md">
            <Text fw={600} mb="sm">Opciones de Importación</Text>
            
            <Stack gap="md">
              <Switch
                label={<Text size="sm" fw={500}>Crear comprobante único</Text>}
                description={<Text size="xs" c="dimmed">Todos los movimientos en un solo comprobante</Text>}
                checked={config.unicoComprobante}
                onChange={(event) => handleChange('unicoComprobante', event.currentTarget.checked)}
              />
              <Switch
                label={<Text size="sm" fw={500}>Validar duplicados de documento</Text>}
                description={<Text size="xs" c="dimmed">Verifica si los documentos ya existen</Text>}
                checked={config.validarDuplicados}
                onChange={(event) => handleChange('validarDuplicados', event.currentTarget.checked)}
              />
              <Switch
                label={<Text size="sm" fw={500}>Permitir advertencias</Text>}
                description={<Text size="xs" c="dimmed">Importar registros con advertencias</Text>}
                checked={config.permitirAdvertencias}
                onChange={(event) => handleChange('permitirAdvertencias', event.currentTarget.checked)}
              />
              <Switch
                label={<Text size="sm" fw={500}>Detener si hay errores</Text>}
                description={<Text size="xs" c="dimmed">No importar si existen errores</Text>}
                checked={config.detenerErrores}
                onChange={(event) => handleChange('detenerErrores', event.currentTarget.checked)}
              />
              <Switch
                label={<Text size="sm" fw={500}>Ejecutar en segundo plano</Text>}
                description={<Text size="xs" c="dimmed">Recomendado para archivos grandes (&gt; 5000)</Text>}
                checked={config.segundoPlano}
                onChange={(event) => handleChange('segundoPlano', event.currentTarget.checked)}
              />
            </Stack>
          </Paper>
        </Stack>

      </SimpleGrid>

      <Box mt="xl">
        <Alert color="blue" variant="light" icon={<IconInfoCircle />}>
          <Text fw={600} size="sm">Información Importante</Text>
          <Text size="xs">
            Al confirmar, se creará el comprobante contable y se registrarán los movimientos en el libro diario.
            Esta acción no se puede deshacer.
          </Text>
        </Alert>
      </Box>

      <Group justify="space-between" mt="xl">
        <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
          Atrás
        </Button>
        <Group>
          <Button variant="default" color="red" onClick={onReset} disabled={isSubmitting}>
            Cancelar Importación
          </Button>
          <Button 
            color="indigo" 
            onClick={() => onConfirm(config)} 
            disabled={isSubmitting || !canImport} 
            loading={isSubmitting}
          >
            Confirmar e Importar
          </Button>
        </Group>
      </Group>
    </Box>
  );
}
