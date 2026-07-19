import React, { useState, useEffect } from 'react';
import { 
  Box, Group, Paper, Text, Select, Button, Table, Badge, Grid, 
  Card, Alert, ActionIcon, ThemeIcon, Stack 
} from '@mantine/core';
import { 
  IconFileSpreadsheet, IconRefresh, IconCheck, IconAlertTriangle, 
  IconX, IconInfoCircle, IconArrowRight, IconWand, IconTrash, IconDeviceFloppy 
} from '@tabler/icons-react';

interface Paso3MapeoProps {
  file: File;
  onMappingComplete: (mappingData: any) => void;
  onCancel: () => void;
  onValidityChange?: (isValid: boolean) => void;
}

const ERP_FIELDS = [
  { value: 'fecha_movimiento', label: 'Fecha del Movimiento', type: 'Date', required: true },
  { value: 'numero_documento', label: 'Número de Documento', type: 'String', required: false },
  { value: 'tipo_documento', label: 'Tipo de Documento', type: 'String', required: false },
  { value: 'cuenta_codigo', label: 'Cuenta Contable', type: 'String', required: true },
  { value: 'concepto', label: 'Concepto / Descripción', type: 'String', required: true },
  { value: 'debito', label: 'Débito', type: 'Decimal', required: true },
  { value: 'credito', label: 'Crédito', type: 'Decimal', required: true },
  { value: 'tercero_documento', label: 'Tercero', type: 'String', required: false },
  { value: 'centro_costo_codigo', label: 'Centro de Costo', type: 'String', required: false },
  { value: 'sucursal_codigo', label: 'Sucursal', type: 'String', required: false },
  { value: 'proyecto_codigo', label: 'Proyecto', type: 'String', required: false },
  { value: 'observacion', label: 'Observación', type: 'String', required: false },
  { value: 'referencia', label: 'Referencia Adicional', type: 'String', required: false },
];

// Dictionary for auto-mapping
const DICTIONARY: Record<string, string[]> = {
  'fecha_movimiento': ['fecha', 'fechamovimiento', 'fecdoc', 'fechadocumento', 'fechacontable'],
  'cuenta_codigo': ['cuenta', 'cuentacontable', 'codigocuenta', 'codcuenta', 'cuentaerp'],
  'concepto': ['concepto', 'detalle', 'descripcion', 'conceptomovimiento'],
  'debito': ['debito', 'valordebito', 'debe'],
  'credito': ['credito', 'valorcredito', 'haber'],
  'numero_documento': ['documento', 'numerodocumento', 'doc'],
  'tipo_documento': ['tipodocumento', 'tipodoc'],
  'tercero_documento': ['tercero', 'nit', 'cedula'],
  'centro_costo_codigo': ['centrocosto', 'ceco', 'centrodecosto'],
  'sucursal_codigo': ['sucursal', 'agencia'],
  'proyecto_codigo': ['proyecto'],
  'observacion': ['observacion', 'notas'],
  'referencia': ['referencia', 'ref']
};

export default function Paso3Mapeo({ file, uploadData, onMappingComplete, onCancel, onValidityChange }: Paso3MapeoProps) {
  const [fileColumns, setFileColumns] = useState<any[]>([]);
  const [mappings, setMappings] = useState<Record<string, string | null>>({});
  
  useEffect(() => {
    if (!uploadData || !uploadData.columns) return;
    
    const realColumns = uploadData.columns.map((colName: string) => ({
      name: colName,
      type: 'Texto',
      sample: uploadData.previewData && uploadData.previewData.length > 0 
        ? String(uploadData.previewData[0][colName] ?? '') 
        : '',
      icon: '📊' // A generic icon since we don't know the exact type beforehand
    }));
    
    setFileColumns(realColumns);
    autoMapColumns(realColumns);
  }, [file, uploadData]);

  const autoMapColumns = (columns: any[]) => {
    const newMappings: Record<string, string | null> = {};
    const usedErpFields = new Set<string>();

    columns.forEach(col => {
      const normalizedColName = col.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      let mapped = false;

      for (const [erpField, keywords] of Object.entries(DICTIONARY)) {
        if (usedErpFields.has(erpField)) continue;

        if (keywords.some(kw => normalizedColName.includes(kw))) {
          newMappings[col.name] = erpField;
          usedErpFields.add(erpField);
          mapped = true;
          break;
        }
      }
      if (!mapped) {
        newMappings[col.name] = null;
      }
    });

    setMappings(newMappings);
  };

  const handleMappingChange = (fileColName: string, erpField: string | null) => {
    setMappings(prev => {
      const updated = { ...prev, [fileColName]: erpField };
      // Check for duplicates and clear them if someone assigns the same ERP field twice
      if (erpField) {
        for (const key in updated) {
          if (key !== fileColName && updated[key] === erpField) {
            updated[key] = null;
          }
        }
      }
      return updated;
    });
  };

  const clearMapping = () => {
    const cleared: Record<string, null> = {};
    fileColumns.forEach(c => cleared[c.name] = null);
    setMappings(cleared);
  };

  // Derived validation states
  const assignedCount = Object.values(mappings).filter(Boolean).length;
  const requiredErpFields = ERP_FIELDS.filter(f => f.required);
  const assignedRequiredCount = requiredErpFields.filter(f => Object.values(mappings).includes(f.value)).length;
  const allRequiredAssigned = assignedRequiredCount === requiredErpFields.length;
  
  // Conflicto: dos columnas no pueden apuntar al mismo campo (handled in onChange, so conflicts should be 0)
  const conflicts = 0;
  const isValid = allRequiredAssigned && conflicts === 0;

  useEffect(() => {
    if (onValidityChange) {
      onValidityChange(isValid);
    }
    if (onMappingComplete) {
      onMappingComplete(mappings);
    }
  }, [isValid, mappings, onValidityChange, onMappingComplete]);

  return (
    <Box>
      <Text size="sm" c="dimmed" mb="md">
        Relacione cada columna del archivo con el campo correspondiente en el sistema.
      </Text>

      {/* Panel Superior: Información archivo */}
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
          <Grid.Col span={3}>
            <Box>
              <Text size="xs" c="dimmed">Hoja seleccionada:</Text>
              <Text size="sm" fw={500}>Movimientos</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={3}>
            <Box>
              <Text size="xs" c="dimmed">Registros encontrados:</Text>
              <Text size="sm" fw={500}>1.250</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={2}>
            <Box>
              <Text size="xs" c="dimmed">Encabezados detectados:</Text>
              <Text size="sm" fw={500}>{fileColumns.length}</Text>
            </Box>
          </Grid.Col>
        </Grid>
      </Paper>

      <Grid>
        {/* Panel Central: Tabla Mapeo */}
        <Grid.Col span={8}>
          <Paper withBorder>
            <Table striped highlightOnHover withRowBorders={false} verticalSpacing="sm" fz="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Text size="sm" fw={600}>Columna en el Archivo</Text>
                    <Text size="xs" c="dimmed" fw={400}>Encabezados detectados</Text>
                  </Table.Th>
                  <Table.Th></Table.Th>
                  <Table.Th style={{ width: '35%' }}>
                    <Text size="sm" fw={600}>Campo en el Sistema</Text>
                    <Text size="xs" c="dimmed" fw={400}>Seleccione el campo contable correspondiente</Text>
                  </Table.Th>
                  <Table.Th>
                    <Text size="sm" fw={600}>Tipo de Dato</Text>
                    <Text size="xs" c="dimmed" fw={400}>Detectado en el archivo</Text>
                  </Table.Th>
                  <Table.Th>
                    <Text size="sm" fw={600}>Obligatorio</Text>
                    <Text size="xs" c="dimmed" fw={400}>En el sistema</Text>
                  </Table.Th>
                  <Table.Th>
                    <Text size="sm" fw={600}>Estado del Mapeo</Text>
                    <Text size="xs" c="dimmed" fw={400}>Validación actual</Text>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {fileColumns.map((col) => {
                  const mappedFieldId = mappings[col.name];
                  const erpFieldInfo = ERP_FIELDS.find(f => f.value === mappedFieldId);
                  
                  return (
                    <Table.Tr key={col.name}>
                      <Table.Td>{col.name}</Table.Td>
                      <Table.Td><IconArrowRight size={16} color="var(--mantine-color-dimmed)" /></Table.Td>
                      <Table.Td>
                        <Select
                          placeholder="Seleccionar campo..."
                          data={ERP_FIELDS.map(f => ({ value: f.value, label: f.label }))}
                          value={mappedFieldId}
                          onChange={(val) => handleMappingChange(col.name, val)}
                          searchable
                          clearable
                          size="sm"
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <Text size="xs">{col.icon}</Text>
                          <Text size="sm">{col.type}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        {erpFieldInfo?.required ? (
                          <Text c="green" fw={500} size="sm">Sí</Text>
                        ) : erpFieldInfo ? (
                          <Text c="dimmed" size="sm">No</Text>
                        ) : (
                          <Text c="dimmed" size="sm">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {mappedFieldId ? (
                          <Group gap="xs" c="green">
                            <IconCheck size={16} />
                            <Text size="sm">Asignado</Text>
                          </Group>
                        ) : (
                          <Group gap="xs" c="orange">
                            <IconAlertTriangle size={16} />
                            <Text size="sm">Sin asignar</Text>
                          </Group>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Paper>
        </Grid.Col>

        {/* Panel Derecho: Resumen y Acciones */}
        <Grid.Col span={4}>
          <Text fw={600} mb="xs">Resumen del Mapeo</Text>
          <Paper withBorder p="md" mb="md">
            <Group justify="space-between" mb="sm">
              <Text size="sm">Columnas en el archivo</Text>
              <Text fw={600}>{fileColumns.length}</Text>
            </Group>
            <Group justify="space-between" mb="sm">
              <Text size="sm">Campos asignados</Text>
              <Text fw={600}>{assignedCount}</Text>
            </Group>
            <Group justify="space-between" mb="sm">
              <Text size="sm">Campos obligatorios asignados</Text>
              <Text fw={600} c={allRequiredAssigned ? 'green' : 'red'}>
                {assignedRequiredCount}/{requiredErpFields.length}
              </Text>
            </Group>
            <Group justify="space-between" mb="sm">
              <Text size="sm">Campos sin asignar</Text>
              <Text fw={600}>{fileColumns.length - assignedCount}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm">Conflictos de mapeo</Text>
              <Text fw={600} c={conflicts > 0 ? 'red' : 'dimmed'}>{conflicts}</Text>
            </Group>

            <Box mt="md">
              {isValid ? (
                <Alert color="green" variant="light" icon={<IconCheck size={16} />}>
                  <Text fw={600} size="sm" mb={4}>Mapeo válido</Text>
                  <Text size="xs">Todas las columnas obligatorias han sido asignadas correctamente.</Text>
                </Alert>
              ) : (
                <Alert color="red" variant="light" icon={<IconX size={16} />}>
                  <Text fw={600} size="sm" mb={4}>Mapeo incompleto</Text>
                  <Text size="xs">Faltan asignar campos obligatorios o existen conflictos.</Text>
                </Alert>
              )}
            </Box>
          </Paper>

          <Text fw={600} mb="xs">Acciones Rápidas</Text>
          <Paper withBorder p="md" mb="md">
            <Stack gap="xs">
              <Button 
                variant="subtle" 
                leftSection={<IconWand size={16} />} 
                justify="flex-start"
                onClick={() => autoMapColumns(fileColumns)}
              >
                Asignar automáticamente
              </Button>
              <Button 
                variant="subtle" 
                color="red" 
                leftSection={<IconTrash size={16} />} 
                justify="flex-start"
                onClick={clearMapping}
              >
                Limpiar mapeo
              </Button>
              <Button 
                variant="subtle" 
                color="indigo" 
                leftSection={<IconDeviceFloppy size={16} />} 
                justify="flex-start"
              >
                Guardar configuración de mapeo
              </Button>
            </Stack>
          </Paper>

          <Paper withBorder p="md" bg="var(--mantine-color-gray-0)">
            <Text fw={600} size="sm" mb="xs">Información</Text>
            <Text size="xs" c="dimmed">
              Puede guardar esta configuración como plantilla para futuras importaciones con el mismo formato.
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>
      
      {/* Botones de navegación controlados desde el padre, pero el padre necesita saber la validez */}
      {/* Para simplificar, el padre usará un wrapper o pasaremos la validación hacia arriba */}
      <Box mt="xl" style={{ display: 'none' }}>
        {/* Este componente solo notifica al padre cuando sea válido */}
        {/* Por ahora manejamos el botón Siguiente en el padre, pero el padre no tiene acceso a isValid fácilmente sin un context o lifting state up */}
      </Box>
    </Box>
  );
}
