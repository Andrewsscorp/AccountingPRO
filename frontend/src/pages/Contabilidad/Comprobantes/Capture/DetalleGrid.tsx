import React from 'react';
import { Table, TextInput, ActionIcon, Group, Text, Button, Select, NumberInput, Modal } from '@mantine/core';
import { IconTrash, IconPlus, IconSearch } from '@tabler/icons-react';

interface RowData {
  id: string;
  cuentaId: string | null;
  cuentaRef: any;
  terceroId: string | null;
  centroCostoId: string | null;
  debito: number | '';
  credito: number | '';
  observacion: string;
  cuentaBancariaId?: string | null;
}

interface DetalleGridProps {
  rows: RowData[];
  onChange: (rows: RowData[]) => void;
  planCuentas: any[];
  terceros: any[];
  centrosCosto: any[];
  cuentasBancarias?: any[];
  disabled?: boolean;
  conceptoGlobal: string;
  diferencia: number;
  selectedTd?: any;
}

export default function DetalleGrid({ rows, onChange, planCuentas, terceros, centrosCosto, cuentasBancarias = [], disabled, conceptoGlobal, diferencia, selectedTd }: DetalleGridProps) {
  const isDocRequiereTercero = selectedTd?.requiereTercero;
  const isDocRequiereCentroCosto = selectedTd?.requiereCentroCosto;
  const isDocPermiteObservaciones = selectedTd ? selectedTd.permiteObservaciones : true;
  const prevConceptoRef = React.useRef(conceptoGlobal);
  
  const [bancoModal, setBancoModal] = React.useState<{isOpen: boolean, rowIndex: number, list: any[]}>({
    isOpen: false,
    rowIndex: -1,
    list: []
  });

  React.useEffect(() => {
    if (conceptoGlobal !== prevConceptoRef.current) {
      let hasChanges = false;
      const newRows = rows.map(r => {
        if (!r.observacion || r.observacion === prevConceptoRef.current) {
          hasChanges = true;
          return { ...r, observacion: conceptoGlobal || '' };
        }
        return r;
      });
      
      prevConceptoRef.current = conceptoGlobal;
      
      if (hasChanges) {
        onChange(newRows);
      }
    }
  }, [conceptoGlobal, rows, onChange]);

  const updateRow = (index: number, field: keyof RowData, value: any) => {
    const newRows = [...rows];
    
    // Si la cuenta cambia, obtenemos la referencia
    if (field === 'cuentaId') {
      const cta = planCuentas.find(c => c.id.toString() === value);
      newRows[index] = { ...newRows[index], [field]: value, cuentaRef: cta || null, cuentaBancariaId: null };

      // Revisar si esta cuenta contable pertenece a alguna Cuenta Bancaria
      if (value) {
        const matchingCuentasBancarias = cuentasBancarias.filter(cb => cb.cuentaContableId?.toString() === value);
        if (matchingCuentasBancarias.length === 1) {
          // Auto assign si solo hay una
          newRows[index].cuentaBancariaId = matchingCuentasBancarias[0].id.toString();
        } else if (matchingCuentasBancarias.length > 1) {
          // Abrir modal de selección de cuenta bancaria
          setBancoModal({ isOpen: true, rowIndex: index, list: matchingCuentasBancarias });
        }
      }
    } else if (field === 'debito' && value > 0) {
      newRows[index] = { ...newRows[index], debito: value, credito: 0 };
    } else if (field === 'credito' && value > 0) {
      newRows[index] = { ...newRows[index], credito: value, debito: 0 };
    } else {
      newRows[index] = { ...newRows[index], [field]: value };
    }
    
    onChange(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, field: 'debito' | 'credito' | 'observacion') => {
    if ((e.key === 't' || e.key === 'T') && field !== 'observacion' && diferencia && diferencia !== 0) {
      e.preventDefault();
      // Calculate missing amount (if we are in debit and missing debit, or just use absolute diff)
      const diffAbs = Math.abs(diferencia);
      updateRow(index, field, diffAbs);
    }

    if (e.key === 'Enter') {
      if (index === rows.length - 1) {
        e.preventDefault();
        addRow();
      }
    }
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    const lastObs = rows.length > 0 ? rows[rows.length - 1].observacion : '';
    onChange([...rows, { 
      id: Math.random().toString(), 
      cuentaId: null, 
      cuentaRef: null, 
      terceroId: null, 
      centroCostoId: null, 
      cuentaBancariaId: null,
      debito: '', 
      credito: '', 
      observacion: lastObs || conceptoGlobal || ''
    }]);

    // Focus the newly added "Cuenta" select after React renders
    setTimeout(() => {
      document.getElementById(`cuenta-select-${rows.length}`)?.focus();
    }, 50);
  };

  const cuentasData = planCuentas.map(c => ({ value: c.id.toString(), label: `${c.codigo} - ${c.nombre}` }));
  const tercerosData = terceros.map(t => ({ value: t.id.toString(), label: `${t.identificacion} - ${t.nombreComercial || t.razonSocial || (t.nombre1 + ' ' + t.apellido1)}` }));
  const ccData = centrosCosto.map(c => ({ value: c.id.toString(), label: `${c.codigo} - ${c.nombre}` }));

  return (
    <div style={{ 
      backgroundColor: '#fff', 
      borderRadius: '8px', 
      border: '1px solid #f1f3f5', 
      padding: '16px', 
      overflowX: 'auto',
      opacity: disabled ? 0.6 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
      transition: 'opacity 0.2s'
    }}>
      <Table verticalSpacing="sm" striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 40 }}>#</Table.Th>
            <Table.Th style={{ width: 250 }}>Cuenta *</Table.Th>
            <Table.Th style={{ width: 250 }}>Tercero</Table.Th>
            <Table.Th style={{ width: 200 }}>Centro Costo</Table.Th>
            <Table.Th style={{ width: 140 }}>Débito</Table.Th>
            <Table.Th style={{ width: 140 }}>Crédito</Table.Th>
            <Table.Th style={{ minWidth: 200 }}>Observación</Table.Th>
            <Table.Th style={{ width: 50 }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, index) => (
            <Table.Tr key={row.id}>
              <Table.Td><Text size="sm" fw={600} c="dimmed">{index + 1}</Text></Table.Td>
              <Table.Td>
                <Select
                  id={`cuenta-select-${index}`}
                  placeholder="Buscar cuenta"
                  data={cuentasData}
                  value={row.cuentaId}
                  onChange={(val) => updateRow(index, 'cuentaId', val)}
                  onKeyUp={(e: any) => { if (e.key === 'Enter' && index === rows.length - 1) addRow(); }}
                  searchable
                  leftSection={<IconSearch size={14} />}
                />
              </Table.Td>
              <Table.Td>
                <Select
                  placeholder="Buscar tercero"
                  data={tercerosData}
                  value={row.terceroId}
                  onChange={(val) => updateRow(index, 'terceroId', val)}
                  onKeyUp={(e: any) => { if (e.key === 'Enter' && index === rows.length - 1) addRow(); }}
                  searchable
                  leftSection={<IconSearch size={14} />}
                  disabled={!(row.cuentaRef?.requiereTercero || isDocRequiereTercero)}
                />
              </Table.Td>
              <Table.Td>
                <Select
                  placeholder="Buscar centro"
                  data={ccData}
                  value={row.centroCostoId}
                  onChange={(val) => updateRow(index, 'centroCostoId', val)}
                  onKeyUp={(e: any) => { if (e.key === 'Enter' && index === rows.length - 1) addRow(); }}
                  searchable
                  disabled={!(row.cuentaRef?.requiereCentroCosto || isDocRequiereCentroCosto)}
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  hideControls
                  placeholder="0"
                  value={row.debito}
                  onChange={(val) => updateRow(index, 'debito', val)}
                  onKeyDown={(e: any) => handleKeyDown(e, index, 'debito')}
                  min={0}
                  thousandSeparator="."
                  decimalSeparator=","
                />
              </Table.Td>
              <Table.Td>
                <NumberInput
                  hideControls
                  placeholder="0"
                  value={row.credito}
                  onChange={(val) => updateRow(index, 'credito', val)}
                  onKeyDown={(e: any) => handleKeyDown(e, index, 'credito')}
                  min={0}
                  thousandSeparator="."
                  decimalSeparator=","
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  placeholder="Descripción de la línea"
                  value={row.observacion}
                  onChange={(e) => updateRow(index, 'observacion', e.target.value)}
                  onKeyDown={(e: any) => handleKeyDown(e, index, 'observacion')}
                />
              </Table.Td>
              <Table.Td>
                <ActionIcon color="red" variant="subtle" onClick={() => removeRow(index)} disabled={rows.length === 1}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      
      <Group justify="space-between" mt="md">
        <Button variant="subtle" color="violet" leftSection={<IconPlus size={16} />} onClick={addRow}>
          Agregar línea
        </Button>
        <Text size="sm" fw={600} c="dimmed">{rows.length} movimientos</Text>
      </Group>

      {/* Modal para selección de Cuenta Bancaria */}
      <Modal 
        opened={bancoModal.isOpen} 
        onClose={() => setBancoModal({ isOpen: false, rowIndex: -1, list: [] })}
        title={<Text fw={600} size="lg">Seleccione la Cuenta Bancaria</Text>}
        centered
        zIndex={1000}
      >
        <Text size="sm" mb="md" c="dimmed">Esta cuenta contable está asociada a tesorería. Elija la cuenta bancaria afectada:</Text>
        <Select
          autoFocus
          defaultDropdownOpened
          comboboxProps={{ zIndex: 1100 }}
          data={bancoModal.list.map(cb => ({
            value: cb.id.toString(),
            label: `${cb.banco?.nombre || 'Banco'} - ${cb.numeroCuenta}`
          }))}
              placeholder="Seleccione cuenta"
              onChange={(val) => {
                if (val) {
                  const newRows = [...rows];
                  newRows[bancoModal.rowIndex].cuentaBancariaId = val;
                  onChange(newRows);
                  setBancoModal({ isOpen: false, rowIndex: -1, list: [] });
                  
                  // Retornar foco a la siguiente celda si es posible
                  setTimeout(() => {
                    const el = document.getElementById(`cuenta-select-${bancoModal.rowIndex}`);
                    if (el) el.focus();
                  }, 50);
                }
              }}
              searchable
            />
        <Group justify="flex-end" mt="xl">
          <Button variant="subtle" color="gray" onClick={() => setBancoModal({ isOpen: false, rowIndex: -1, list: [] })}>
            Cancelar
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
