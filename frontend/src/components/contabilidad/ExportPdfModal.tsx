import React, { useState, useEffect } from 'react';
import { 
  Modal, Box, Grid, Text, Switch, Checkbox, Select, Textarea, 
  Button, Group, Stack, LoadingOverlay, Alert, Badge 
} from '@mantine/core';
import { IconFileTypePdf, IconRefresh, IconAlertCircle, IconDownload } from '@tabler/icons-react';
import { generatePdfClientSide } from '../../utils/exportPdfMovimientos';

export interface ExportPdfModalProps {
  opened: boolean;
  onClose: () => void;
  filtrosActuales: any;
  tenantId: string;
  dataset?: any[];  // The current dataset from the grid
}

const ALL_COLUMNS = [
  { id: 'fecha', label: 'Fecha' },
  { id: 'documento', label: 'Documento' },
  { id: 'tipoDoc', label: 'Tipo Doc.' },
  { id: 'cuenta', label: 'Cuenta' },
  { id: 'descripcionCuenta', label: 'Descripción Cuenta' },
  { id: 'concepto', label: 'Concepto' },
  { id: 'tercero', label: 'Tercero' },
  { id: 'centroCosto', label: 'Centro de Costo' },
  { id: 'debito', label: 'Débito' },
  { id: 'credito', label: 'Crédito' },
  { id: 'saldo', label: 'Saldo' }
];

export default function ExportPdfModal({ opened, onClose, filtrosActuales, tenantId, dataset }: ExportPdfModalProps) {
  // Config States
  const [paperSize, setPaperSize] = useState('Oficio');
  const [orientacion, setOrientacion] = useState<'Vertical' | 'Horizontal'>('Horizontal');
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState<string[]>(ALL_COLUMNS.map(c => c.id));
  
  const [incluirTotales, setIncluirTotales] = useState(true);
  const [incluirFirmas, setIncluirFirmas] = useState(true);
  const [incluirLogo, setIncluirLogo] = useState(true);
  const [incluirObservaciones, setIncluirObservaciones] = useState(false);
  const [observacionesTexto, setObservacionesTexto] = useState('');

  // Preview State
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // Mark stale on any config change
  useEffect(() => {
    if (pdfUrl) setIsStale(true);
  }, [
    paperSize, orientacion, columnasSeleccionadas, incluirTotales, 
    incluirFirmas, incluirLogo, incluirObservaciones, observacionesTexto
  ]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [pdfUrl]);

  const buildPayload = () => {
    const paperDimensions: Record<string, { widthMm: number; heightMm: number }> = {
      'Carta': { widthMm: 216, heightMm: 279 },
      'Oficio': { widthMm: 216, heightMm: 356 },
      'A4': { widthMm: 210, heightMm: 297 }
    };

    return {
      configuracion: {
        paperSize: paperDimensions[paperSize] || paperDimensions['Carta'],
        orientacion,
        columnasIds: columnasSeleccionadas,
        incluirTotales,
        incluirFirmas,
        incluirLogo,
        incluirObservaciones,
        observacionesTexto
      },
      filtros: filtrosActuales,
      dataset: dataset || []
    };
  };

  const handleGeneratePreview = async () => {
    setLoading(true);
    setIsStale(false);
    try {
      const payload = buildPayload();
      const url = await generatePdfClientSide(payload.configuracion, payload.filtros, payload.dataset, tenantId);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
    } catch (e) {
      console.error(e);
      alert('Error al generar PDF: ' + (e as Error).message);
      setIsStale(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `Movimientos_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={
        <Group gap="xs">
          <IconFileTypePdf color="red" size={22} />
          <Text fw={700} size="lg">Exportar a PDF: Opciones Avanzadas</Text>
        </Group>
      }
      size="95%"
      padding={0}
      styles={{
        body: { height: '85vh' },
        content: { maxHeight: '95vh' }
      }}
    >
      <Grid m={0} gap={0} style={{ height: '100%' }}>
        
        {/* Panel Izquierdo: Configuración */}
        <Grid.Col span={3} style={{ 
          borderRight: '1px solid #dee2e6', 
          padding: '20px', 
          overflowY: 'auto',
          height: '85vh'
        }}>
          
          <Text fw={600} mb="sm">Formato del Papel</Text>
          <Select 
            data={['Carta', 'Oficio', 'A4']} 
            value={paperSize} 
            onChange={(v) => setPaperSize(v || 'Oficio')} 
            mb="xs" 
          />
          <Select 
            data={['Vertical', 'Horizontal']} 
            value={orientacion} 
            onChange={(v) => setOrientacion(v as any)} 
            mb="md" 
          />

          <Text fw={600} mb="sm">Inclusiones</Text>
          <Stack gap="xs" mb="md">
            <Switch 
              label="Totales (Débitos/Créditos)" 
              checked={incluirTotales} 
              onChange={(e) => setIncluirTotales(e.currentTarget.checked)} 
              color="violet"
            />
            <Switch 
              label="Logo Corporativo" 
              checked={incluirLogo} 
              onChange={(e) => setIncluirLogo(e.currentTarget.checked)} 
              color="violet"
            />
            <Switch 
              label="Firmas Institucionales" 
              checked={incluirFirmas} 
              onChange={(e) => setIncluirFirmas(e.currentTarget.checked)} 
              color="violet"
            />
            <Switch 
              label="Incluir Observaciones" 
              checked={incluirObservaciones} 
              onChange={(e) => setIncluirObservaciones(e.currentTarget.checked)} 
              color="violet"
            />
            {incluirObservaciones && (
              <Textarea 
                placeholder="Escriba la observación a mostrar al final del reporte..."
                value={observacionesTexto}
                onChange={(e) => setObservacionesTexto(e.currentTarget.value)}
                minRows={3}
              />
            )}
          </Stack>

          <Text fw={600} mb="sm">Columnas a Mostrar</Text>
          <Alert variant="light" color="blue" icon={<IconAlertCircle size={16} />} mb="sm" p="xs">
            <Text size="xs">
              Para evitar recortes, se recomienda un máximo de <b>7 columnas</b> en Carta/A4 Vertical, y <b>10 columnas</b> en Oficio/Horizontal.
            </Text>
          </Alert>
          <Box style={{ 
            maxHeight: '250px', 
            overflowY: 'auto', 
            border: '1px solid #e9ecef', 
            padding: '12px', 
            borderRadius: '6px' 
          }}>
            <Stack gap="xs">
              {ALL_COLUMNS.map(col => (
                <Checkbox 
                  key={col.id} 
                  label={col.label} 
                  checked={columnasSeleccionadas.includes(col.id)}
                  color="violet"
                  onChange={(e) => {
                    const checked = e.currentTarget.checked;
                    if (checked) {
                      setColumnasSeleccionadas(prev => [...prev, col.id]);
                    } else {
                      setColumnasSeleccionadas(prev => prev.filter(id => id !== col.id));
                    }
                  }}
                />
              ))}
            </Stack>
          </Box>

        </Grid.Col>

        {/* Panel Derecho: Vista Previa */}
        <Grid.Col span={9} style={{ 
          backgroundColor: '#f1f3f5', 
          padding: '20px', 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column',
          height: '85vh'
        }}>
          <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
          
          <Group justify="space-between" mb="md">
            <Group>
              <Button 
                onClick={handleGeneratePreview} 
                leftSection={<IconRefresh size={16} />}
                color={isStale && pdfUrl ? 'yellow' : 'teal'}
                variant="filled"
              >
                {pdfUrl ? 'Actualizar Vista Previa' : 'Generar Vista Previa'}
              </Button>
              {isStale && pdfUrl && (
                <Badge color="yellow" variant="light" leftSection={<IconAlertCircle size={12}/>}>
                  Vista previa desactualizada
                </Badge>
              )}
            </Group>
            <Button 
              variant="filled" 
              color="red" 
              leftSection={<IconDownload size={16} />}
              disabled={!pdfUrl || isStale}
              onClick={handleDownload}
            >
              Descargar PDF Oficial
            </Button>
          </Group>

          <Box style={{ 
            flexGrow: 1, 
            border: '1px solid #dee2e6', 
            backgroundColor: '#fff', 
            borderRadius: '8px', 
            overflow: 'hidden',
            minHeight: 0
          }}>
            {pdfUrl ? (
              <iframe 
                src={pdfUrl} 
                width="100%" 
                height="100%" 
                style={{ border: 'none' }} 
                title="PDF Preview" 
              />
            ) : (
              <Box style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <IconFileTypePdf size={48} color="#dee2e6" />
                <Text c="dimmed" size="lg">Presione "Generar Vista Previa" para visualizar el reporte.</Text>
                <Text c="dimmed" size="sm">
                  {dataset && dataset.length > 0 
                    ? `Se exportarán ${dataset.length} registros del dataset actual.`
                    : 'Se reconstruirá el dataset desde los filtros aplicados.'
                  }
                </Text>
              </Box>
            )}
          </Box>

        </Grid.Col>

      </Grid>
    </Modal>
  );
}
