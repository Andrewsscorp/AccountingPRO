import React from 'react';
import { SimpleGrid, TextInput, Select, Grid, Box } from '@mantine/core';
import { DateInput } from '@mantine/dates';

interface EncabezadoProps {
  data: any;
  onChange: (data: any) => void;
  tiposDocumento: any[];
}

export default function EncabezadoForm({ data, onChange, tiposDocumento }: EncabezadoProps) {
  
  const handleSelectTipoDoc = (val: string | null) => {
    // Buscar el tipo doc para pre-llenar numero si es automático, etc.
    const td = tiposDocumento.find(t => t.id.toString() === val);
    let generatedNumero = '';
    
    if (td && td.numeraciones && td.numeraciones.length > 0) {
      const num = td.numeraciones[0];
      const prefix = num.prefijo || '';
      const length = num.longitud || 5;
      const currentNumber = num.consecutivoActual > 0 ? num.consecutivoActual : (num.rangoInicial || 1);
      generatedNumero = `${prefix}${String(currentNumber).padStart(length, '0')}`;
    } else if (td) {
      generatedNumero = `${td.codigo}-00001`;
    }

    onChange({ ...data, tipoDocumentoId: val, numero: generatedNumero });
  };

  const selectedTd = tiposDocumento.find(t => t.id.toString() === data.tipoDocumentoId);
  const allowsManual = selectedTd?.numeraciones?.[0]?.permiteManual === true;
  const isAutomatic = !allowsManual;

  return (
    <Box p="md" mb="md" style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f1f3f5' }}>
      <Grid gap="md">
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Select
            label="Tipo de Documento *"
            placeholder="Seleccione..."
            data={tiposDocumento.map(td => ({ value: td.id.toString(), label: `${td.codigo} - ${td.nombre}` }))}
            value={data.tipoDocumentoId}
            onChange={handleSelectTipoDoc}
            searchable
          />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 3 }}>
          <TextInput
            label="Número"
            placeholder={isAutomatic ? "Automático" : "Ingrese consecutivo..."}
            value={data.numero}
            onChange={(e) => onChange({ ...data, numero: e.target.value })}
            readOnly={isAutomatic}
            styles={{ input: { backgroundColor: isAutomatic ? '#f8f9fa' : '#fff' } }}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }}>
          <DateInput
            label="Fecha *"
            placeholder="DD/MM/YYYY"
            value={data.fecha}
            onChange={(val) => onChange({ ...data, fecha: val })}
            valueFormat="DD/MM/YYYY"
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }}>
          <Select
            label="Afecta *"
            data={[
              { value: 'CONTABLE_TRIBUTARIA', label: 'Información Contable y Tributaria' },
              { value: 'NIIF', label: 'Solo NIIF' }
            ]}
            value={data.afecta}
            onChange={(val) => onChange({ ...data, afecta: val })}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <TextInput
            label="Concepto General *"
            placeholder="Ej: Pago proveedor papelería..."
            value={data.concepto}
            onChange={(e) => onChange({ ...data, concepto: e.target.value })}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput
            label="Referencia"
            placeholder="Opcional"
            value={data.referencia}
            onChange={(e) => onChange({ ...data, referencia: e.target.value })}
          />
        </Grid.Col>
      </Grid>
    </Box>
  );
}
