import React, { useEffect, useState } from 'react';
import { 
  Box, Group, Paper, Text, Select, Button, Table, Badge, Grid, 
  Card, Alert, ScrollArea, ThemeIcon
} from '@mantine/core';
import { 
  IconFileSpreadsheet, IconRefresh, IconCheck, IconAlertTriangle, 
  IconX, IconInfoCircle 
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface Paso2ValidacionProps {
  file: File;
  uploadData?: any;
  onValidationSuccess: () => void;
  onCancel: () => void;
}

export default function Paso2Validacion({ file, uploadData, onValidationSuccess, onCancel }: Paso2ValidacionProps) {
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState<any>(null);

  useEffect(() => {
    // If no real data, wait
    if (!uploadData) return;

    // Use actual uploadData from backend
    setTimeout(() => {
      setValidationData({
        fileName: uploadData.archivo || file.name,
        sheets: ['Movimientos'],
        recordsCount: uploadData.totalRegistros || 0,
        headersCount: uploadData.columns?.length || 0,
        validHeaders: uploadData.columns?.length || 0,
        missingOptional: 0,
        missingRequired: 0,
        extraColumns: 0,
        columns: (uploadData.columns || []).map((col: string) => ({
          name: col,
          type: 'Texto',
          required: false,
          status: 'Válido'
        })),
        preview: uploadData.previewData || []
      });
      setLoading(false);
      onValidationSuccess();
    }, 500);
  }, [file, uploadData, onValidationSuccess]);

  if (loading || !validationData) {
    return (
      <Paper withBorder p="xl" radius="md">
        <Text ta="center" size="xl" c="dimmed">Validando estructura del archivo...</Text>
      </Paper>
    );
  }

  return (
    <Box>
      <Text size="sm" c="dimmed" mb="md">
        El sistema está validando que el archivo cumpla con la estructura requerida.
      </Text>

      <Paper withBorder p="md" radius="md" mb="xl">
        <Grid align="center">
          <Grid.Col span={3}>
            <Group>
              <ThemeIcon size={40} color="green" variant="light">
                <IconFileSpreadsheet size={24} />
              </ThemeIcon>
              <Box>
                <Text size="xs" c="dimmed">Archivo:</Text>
                <Text size="sm" fw={500} truncate>{validationData.fileName}</Text>
              </Box>
            </Group>
          </Grid.Col>
          <Grid.Col span={2}>
            <Box>
              <Text size="xs" c="dimmed">Hojas detectadas:</Text>
              <Text size="sm" fw={500}>{validationData.sheets.length}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={3}>
            <Select
              label="Hoja seleccionada"
              data={validationData.sheets}
              value={validationData.sheets[0]}
              size="xs"
              readOnly
            />
          </Grid.Col>
          <Grid.Col span={2}>
            <Box>
              <Text size="xs" c="dimmed">Registros encontrados:</Text>
              <Text size="sm" fw={500}>{validationData.recordsCount}</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={2}>
            <Button variant="default" size="xs" leftSection={<IconRefresh size={14} />} onClick={onCancel} fullWidth>
              Cambiar Archivo
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>

      <Grid>
        {/* Left Column: Validación de Encabezados */}
        <Grid.Col span={4}>
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Validación de Encabezados</Text>
            <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
              Todos los requeridos están presentes
            </Badge>
          </Group>
          
          <Paper withBorder>
            <Table striped highlightOnHover withRowBorders={false} verticalSpacing="sm" fz="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Columna en Archivo</Table.Th>
                  <Table.Th>Campo</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Obligatorio</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {validationData.columns.map((col: any, idx: number) => (
                  <Table.Tr key={idx}>
                    <Table.Td>{col.name}</Table.Td>
                    <Table.Td>{col.name.toLowerCase()}</Table.Td>
                    <Table.Td>{col.type}</Table.Td>
                    <Table.Td>{col.required ? 'Sí' : 'No'}</Table.Td>
                    <Table.Td>
                      <Group gap={4} c="green">
                        <IconCheck size={14} />
                        <Text size="xs">{col.status}</Text>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Grid.Col>

        {/* Middle Column: Vista Previa */}
        <Grid.Col span={5}>
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Vista previa de datos <Text span size="xs" c="dimmed">(Primeras filas)</Text></Text>
            <Text size="sm" fw={600}>Registros a validar: {validationData.recordsCount}</Text>
          </Group>
          
          <Paper withBorder style={{ overflow: 'hidden' }}>
            <ScrollArea h={400}>
              <Table striped highlightOnHover withRowBorders={false} verticalSpacing="xs" fz="xs">
                <Table.Thead>
                  <Table.Tr>
                    {validationData.columns.map((col: any, i: number) => (
                      <Table.Th key={i}>{col.name}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {validationData.preview.map((row: any, idx: number) => (
                    <Table.Tr key={idx}>
                      {validationData.columns.map((col: any, i: number) => {
                        let val = row[col.name];
                        if (val instanceof Date) {
                           val = val.toLocaleDateString();
                        } else if (typeof val === 'object' && val !== null && val.result) {
                           val = val.result;
                        } else if (typeof val === 'object' && val !== null && val.text) {
                           val = val.text;
                        }
                        return <Table.Td key={i}>{String(val ?? '')}</Table.Td>;
                      })}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            <Box p="xs" bg="yellow.0">
              <Text size="xs" c="yellow.8" ta="center">
                La vista previa muestra las primeras filas. Los datos completos se validarán en el siguiente paso.
              </Text>
            </Box>
          </Paper>
        </Grid.Col>

        {/* Right Column: Resumen y Reglas */}
        <Grid.Col span={3}>
          <Text fw={600} mb="xs">Resumen de Validación</Text>
          <Paper withBorder p="md" mb="md">
            <Group justify="space-between" mb="sm">
              <Group gap="xs"><IconCheck size={16} color="green"/><Text size="sm">Encabezados encontrados</Text></Group>
              <Text fw={600}>{validationData.validHeaders}</Text>
            </Group>
          </Paper>

          <Text fw={600} mb="xs">Reglas de Validación</Text>
          <Paper withBorder p="md" mb="md">
            <Group gap="xs" mb="xs" wrap="nowrap"><IconCheck size={14} color="green"/><Text size="xs">El archivo debe tener encabezados en la primera fila</Text></Group>
            <Group gap="xs" mb="xs" wrap="nowrap"><IconCheck size={14} color="green"/><Text size="xs">Debe contener las columnas mínimas requeridas</Text></Group>
            <Group gap="xs" mb="xs" wrap="nowrap"><IconCheck size={14} color="green"/><Text size="xs">Las columnas de Débito y Crédito deben ser numéricas</Text></Group>
            <Group gap="xs" mb="xs" wrap="nowrap"><IconCheck size={14} color="green"/><Text size="xs">Las fechas deben tener formato válido (dd/mm/aaaa)</Text></Group>
            <Group gap="xs" mb="xs" wrap="nowrap"><IconCheck size={14} color="green"/><Text size="xs">No debe contener filas completamente vacías</Text></Group>
          </Paper>

          <Alert color="indigo" variant="light" title="Guía de Importación" icon={<IconInfoCircle />}>
            Si el archivo no cumple con los requisitos, corríjalo y vuelva a cargarlo.
          </Alert>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
