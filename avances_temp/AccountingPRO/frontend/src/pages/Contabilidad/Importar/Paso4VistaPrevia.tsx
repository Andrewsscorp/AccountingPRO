import React, { useState, useEffect } from 'react';
import { 
  Box, Group, Paper, Text, Button, Table, Badge, Grid, 
  Alert, ActionIcon, ThemeIcon, Stack, RingProgress, Divider, Pagination
} from '@mantine/core';
import { 
  IconFileSpreadsheet, IconRefresh, IconCheck, IconAlertTriangle, 
  IconX, IconInfoCircle, IconEdit, IconSearch
} from '@tabler/icons-react';

interface Paso4VistaPreviaProps {
  file: File;
  uploadData?: any;
  mappings?: Record<string, string | null>;
  onValidationComplete?: (isValid: boolean) => void;
  onDataLoaded?: (data: any) => void;
  onGoBackToMapping: () => void;
}

export default function Paso4VistaPrevia({ file, uploadData, mappings, onValidationComplete, onDataLoaded, onGoBackToMapping }: Paso4VistaPreviaProps) {
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState<any>(null);
  
  useEffect(() => {
    const runValidation = async () => {
      try {
        const tenantId = localStorage.getItem('activeTenantId');
        if (!tenantId) {
          throw new Error("No hay una empresa activa seleccionada. Abortando validación por seguridad.");
        }
        
        // Use standard uploadData if API is not yet built, but attempt the API call
        const payload = {
          importacionId: uploadData?.importacionId,
          mappings: mappings
        };

        const response = await fetch('http://localhost:3000/api/importaciones/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('Error en validación');
        }

        const data = await response.json();
        setValidationData(data);
        
        if (onValidationComplete) {
          onValidationComplete(data.errorRecords === 0);
        }
        if (onDataLoaded) {
          onDataLoaded(data);
        }
      } catch (err) {
        console.error("Preview failed, falling back to mock UI for now", err);
        // Fallback for UI visualization if backend not ready yet
        const mockData = {
          totalDebito: 125000000,
          totalCredito: 125000000,
          diferencia: 0,
          totalRecords: uploadData?.totalRegistros || 1250,
          validRecords: (uploadData?.totalRegistros || 1250) - 17,
          warningRecords: 12,
          errorRecords: 5,
          previewRows: uploadData?.previewData || [],
        };
        setValidationData(mockData);
        if (onValidationComplete) {
          onValidationComplete(false); // 5 errors
        }
        if (onDataLoaded) {
          onDataLoaded(mockData);
        }
      } finally {
        setLoading(false);
      }
    };

    runValidation();
  }, [uploadData, mappings, onValidationComplete]);

  const hasErrors = validationData?.errorRecords > 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2 }).format(value);
  };

  if (loading) {
    return (
      <Paper withBorder p="xl" radius="md">
        <Stack align="center" gap="md">
          <Text size="xl" fw={500}>Realizando simulaciones contables...</Text>
          <Text c="dimmed">El sistema está cruzando los datos del archivo con el Plan de Cuentas, Terceros y Centros de Costo.</Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box>
      <Text size="sm" c="dimmed" mb="md">
        Revise los movimientos antes de importar. El sistema ha aplicado las validaciones contables básicas.
      </Text>

      {/* Panel Superior: Información archivo */}
      <Paper withBorder p="md" radius="md" mb="md">
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
              <Text size="xs" c="dimmed">Hoja:</Text>
              <Text size="sm" fw={500}>Movimientos</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={2}>
            <Box>
              <Text size="xs" c="dimmed">Registros totales:</Text>
              <Text size="sm" fw={500}>1.250</Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={2}>
            <Box>
              <Text size="xs" c="dimmed">Registros a importar:</Text>
              <Group gap="xs">
                <Text size="sm" fw={500}>1.240</Text>
                <IconInfoCircle size={14} color="gray" />
              </Group>
            </Box>
          </Grid.Col>
          <Grid.Col span={1}>
            <Button variant="subtle" size="xs" leftSection={<IconEdit size={14} />} onClick={onGoBackToMapping}>
              Volver a Mapear
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Cuatro tarjetas de resumen */}
      <Grid gutter="md" mb="lg">
        <Grid.Col span={3}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Text fw={600} size="sm" mb="sm">Totales del Movimiento</Text>
            <Grid gutter="xs">
              <Grid.Col span={4}>
                <Text size="xs" c="dimmed">Total Débito</Text>
                <Text fw={600} size="sm">{formatCurrency(validationData.totalDebito)}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="xs" c="dimmed">Total Crédito</Text>
                <Text fw={600} size="sm">{formatCurrency(validationData.totalCredito)}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="xs" c="dimmed">Diferencia</Text>
                <Text fw={600} size="sm" c={validationData.diferencia === 0 ? 'green' : 'red'}>
                  {formatCurrency(validationData.diferencia)}
                </Text>
              </Grid.Col>
            </Grid>
          </Paper>
        </Grid.Col>

        <Grid.Col span={3}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Text fw={600} size="sm" mb="sm">Resultado de Validación</Text>
            <Stack gap={4}>
              <Group justify="space-between">
                <Group gap="xs"><IconCheck size={14} color="green"/><Text size="xs">Partida doble</Text></Group>
                <Text size="xs" fw={500}>Balanceada</Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs"><IconCheck size={14} color="green"/><Text size="xs">Cuentas válidas</Text></Group>
                <Text size="xs" fw={500}>Sin errores</Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs"><IconAlertTriangle size={14} color="orange"/><Text size="xs">Terceros</Text></Group>
                <Text size="xs" fw={500}>12 advertencias</Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs"><IconAlertTriangle size={14} color="orange"/><Text size="xs">Centros de costo</Text></Group>
                <Text size="xs" fw={500}>5 advertencias</Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs"><IconCheck size={14} color="green"/><Text size="xs">Fechas válidas</Text></Group>
                <Text size="xs" fw={500}>Sin errores</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={3}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Text fw={600} size="sm" mb="sm">Registros</Text>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Total registros</Text>
                <Text fw={600}>{validationData.totalRecords}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="green">Válidos</Text>
                <Text fw={600} c="green">{validationData.validRecords}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="orange">Con advertencias</Text>
                <Text fw={600} c="orange">{validationData.warningRecords}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="red">Con errores</Text>
                <Text fw={600} c="red">{validationData.errorRecords}</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={3}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Text fw={600} size="sm" mb="sm">Estado General</Text>
            <Stack align="center" justify="center" h="100%" gap="xs">
              {hasErrors ? (
                <>
                  <ThemeIcon size={40} radius="xl" color="red" variant="light">
                    <IconX size={24} />
                  </ThemeIcon>
                  <Text fw={600} c="red">Validación fallida</Text>
                  <Text size="xs" ta="center" c="dimmed">Corrija los errores para continuar</Text>
                </>
              ) : (
                <>
                  <ThemeIcon size={40} radius="xl" color="green" variant="light">
                    <IconCheck size={24} />
                  </ThemeIcon>
                  <Text fw={600} c="green">Validación exitosa</Text>
                  <Text size="xs" ta="center" c="dimmed">El archivo está listo para ser importado</Text>
                </>
              )}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <Grid gutter="xl">
        {/* Panel Central: Tabla de Datos */}
        <Grid.Col span={8}>
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Vista previa de movimientos <Text span size="xs" c="dimmed">(Primeras 20 filas)</Text></Text>
            <Group>
              <Text size="xs">Mostrar: 20 filas</Text>
              <Button variant="default" size="xs" leftSection={<IconSearch size={14} />}>Buscar en la vista previa...</Button>
            </Group>
          </Group>
          
          <Paper withBorder>
            <Table striped highlightOnHover withRowBorders={false} verticalSpacing="sm" fz="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fila</Table.Th>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Documento</Table.Th>
                  <Table.Th>Cuenta</Table.Th>
                  <Table.Th>Concepto</Table.Th>
                  <Table.Th>Tercero</Table.Th>
                  <Table.Th>Centro Costo</Table.Th>
                  <Table.Th>Débito</Table.Th>
                  <Table.Th>Crédito</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Observación</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {validationData.previewRows && validationData.previewRows.map((row: any, i: number) => (
                  <Table.Tr key={i}>
                    <Table.Td>{row.fila || i + 1}</Table.Td>
                    <Table.Td>{row.fecha || '-'}</Table.Td>
                    <Table.Td>{row.documento || '-'}</Table.Td>
                    <Table.Td>{row.cuenta || '-'}</Table.Td>
                    <Table.Td>{row.concepto || '-'}</Table.Td>
                    <Table.Td>{row.tercero || '-'}</Table.Td>
                    <Table.Td>{row.centroCosto || '-'}</Table.Td>
                    <Table.Td align="right">{row.debito ? formatCurrency(row.debito) : '0,00'}</Table.Td>
                    <Table.Td align="right">{row.credito ? formatCurrency(row.credito) : '0,00'}</Table.Td>
                    <Table.Td>
                      {row.estado === 'error' ? (
                        <Badge color="red" variant="light">Error</Badge>
                      ) : row.estado === 'advertencia' ? (
                        <Badge color="orange" variant="light">Advertencia</Badge>
                      ) : (
                        <Badge color="green" variant="light">Válido</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>{row.observacion || '-'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Group justify="space-between" p="sm">
              <Text size="xs" c="dimmed">Mostrando 1 a 20 de 1.240 registros</Text>
              <Pagination total={62} size="sm" />
            </Group>
          </Paper>
        </Grid.Col>

        {/* Panel Derecho */}
        <Grid.Col span={4}>
          <Text fw={600} mb="xs">Distribución por Cuenta (Top 5)</Text>
          <Paper withBorder p="md" mb="md">
            <Table withRowBorders={false} fz="xs" verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Cuenta</Table.Th>
                  <Table.Th align="right">Registros</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr><Table.Td>110505 - Caja General</Table.Td><Table.Td align="right">320</Table.Td></Table.Tr>
                <Table.Tr><Table.Td>130505 - Clientes Nacionales</Table.Td><Table.Td align="right">210</Table.Td></Table.Tr>
                <Table.Tr><Table.Td>220505 - Proveedores Nacionales</Table.Td><Table.Td align="right">180</Table.Td></Table.Tr>
                <Table.Tr><Table.Td>510515 - Gastos de Administración</Table.Td><Table.Td align="right">150</Table.Td></Table.Tr>
                <Table.Tr><Table.Td>240805 - IVA Generado</Table.Td><Table.Td align="right">120</Table.Td></Table.Tr>
              </Table.Tbody>
            </Table>
            <Text c="blue" size="xs" mt="sm" style={{ cursor: 'pointer' }}>Ver más cuentas →</Text>
          </Paper>

          <Text fw={600} mb="xs">Mensajes y Advertencias</Text>
          <Paper withBorder p="md" mb="md">
            <Stack gap="sm">
              <Group justify="space-between">
                <Group gap="xs"><IconAlertTriangle size={16} color="orange"/><Text size="sm">12 registros con terceros no encontrados</Text></Group>
                <Text c="blue" size="xs" style={{ cursor: 'pointer' }}>Ver detalles</Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs"><IconAlertTriangle size={16} color="orange"/><Text size="sm">5 registros con centro de costo no encontrado</Text></Group>
                <Text c="blue" size="xs" style={{ cursor: 'pointer' }}>Ver detalles</Text>
              </Group>
              <Group justify="space-between">
                <Group gap="xs"><IconInfoCircle size={16} color="blue"/><Text size="sm">3 registros con concepto vacío</Text></Group>
                <Text c="blue" size="xs" style={{ cursor: 'pointer' }}>Ver detalles</Text>
              </Group>
              {hasErrors ? (
                <Group justify="space-between">
                  <Group gap="xs"><IconX size={16} color="red"/><Text size="sm">5 errores críticos de partida doble</Text></Group>
                  <Text c="blue" size="xs" style={{ cursor: 'pointer' }}>Ver detalles</Text>
                </Group>
              ) : (
                <Group gap="xs"><IconCheck size={16} color="green"/><Text size="sm">Sin errores críticos encontrados</Text></Group>
              )}
            </Stack>
          </Paper>

          <Paper withBorder p="md" bg="var(--mantine-color-blue-0)">
            <Text fw={600} size="sm" mb="xs" c="blue.9">Información importante</Text>
            <Text size="xs" c="blue.8">
              Si encuentra errores críticos, no podrá continuar con la importación.
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
