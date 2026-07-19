import { useState, useEffect } from 'react';
import { Modal, TextInput, Radio, Group, Button, Stack, Text, LoadingOverlay, Alert, Select, Box } from '@mantine/core';
import { IconInfoCircle, IconAlertTriangle, IconCheck } from '@tabler/icons-react';

interface Cuenta {
  id: string;
  codigo: string;
  nombre: string;
  movimiento: boolean;
  cuentaPadreId: string | null;
  nivel: number;
  naturaleza: string;
  requiereTercero: boolean;
  requiereCentroCosto: boolean;
  activa: boolean;
}

interface Dependencias {
  movimientos: number;
  hijas: number;
}

interface ModificarCuentaModalProps {
  opened: boolean;
  onClose: () => void;
  tenantId: string;
  cuenta: Cuenta | null;
  onSuccess: () => void;
}

export default function ModificarCuentaModal({ opened, onClose, tenantId, cuenta, onSuccess }: ModificarCuentaModalProps) {
  const [nombre, setNombre] = useState('');
  const [movimiento, setMovimiento] = useState('No');
  const [requiereTercero, setRequiereTercero] = useState('No');
  const [requiereCentroCosto, setRequiereCentroCosto] = useState('No');
  const [estado, setEstado] = useState('Activa');
  
  const [dependencias, setDependencias] = useState<Dependencias>({ movimientos: 0, hijas: 0 });
  const [isLastLevel, setIsLastLevel] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened && cuenta) {
      setNombre(cuenta.nombre);
      setMovimiento(cuenta.movimiento ? 'Sí' : 'No');
      setRequiereTercero(cuenta.requiereTercero ? 'Sí' : 'No');
      setRequiereCentroCosto(cuenta.requiereCentroCosto ? 'Sí' : 'No');
      setEstado(cuenta.activa ? 'Activa' : 'Inactiva');
      
      fetchDependenciasAndEstructura();
    }
  }, [opened, cuenta]);

  useEffect(() => {
    if (estado === 'Inactiva') {
      setMovimiento('No');
    } else if (estado === 'Activa' && isLastLevel) {
      setMovimiento('Sí');
    }
  }, [estado, isLastLevel]);

  const fetchDependenciasAndEstructura = async () => {
    if (!cuenta) return;
    setLoading(true);
    try {
      // 1. Obtener dependencias
      const resDep = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/plan-cuentas/${cuenta.id}/dependencias`);
      const jsonDep = await resDep.json();
      if (jsonDep.success) {
        setDependencias(jsonDep.data);
      }

      // 2. Obtener estructura para saber si es el último nivel
      const resEst = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/estructura-puc`);
      const jsonEst = await resEst.json();
      if (jsonEst.success) {
        const config = jsonEst.data;
        const level = cuenta.nivel;
        const last = level >= 5 || 
          (level === 4 && config.nivel5Longitud === 0) || 
          (level === 3 && config.nivel4Longitud === 0 && config.nivel5Longitud === 0);
        setIsLastLevel(last);
        
        // Si es ultimo nivel y está activa, forzar a Sí
        if (last && cuenta.activa) {
          setMovimiento('Sí');
        } else if (jsonDep.data && jsonDep.data.hijas > 0) {
          // Si no es el ultimo nivel pero tiene hijas, forzar a No
          setMovimiento('No');
        } else if (!cuenta.activa) {
          setMovimiento('No');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!nombre.trim() || !cuenta) return;

    setLoading(true);
    try {
      const payload = {
        nombre,
        movimiento: movimiento === 'Sí',
        requiereTercero: requiereTercero === 'Sí',
        requiereCentroCosto: requiereCentroCosto === 'Sí',
        activa: estado === 'Activa'
      };

      const res = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/plan-cuentas/${cuenta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();

      if (json.success) {
        onSuccess();
        onClose();
      } else {
        alert(json.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error modificando la cuenta');
    } finally {
      setLoading(false);
    }
  };

  if (!cuenta) return null;

  const hasMovimientos = dependencias.movimientos > 0;
  const hasHijas = dependencias.hijas > 0;
  const movimientoDisabled = hasMovimientos || hasHijas || isLastLevel || estado === 'Inactiva';

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700}>Modificar Cuenta</Text>} centered size="lg">
      <Box style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={16} />} color="indigo" variant="light" p="xs">
            Solo puede modificar los campos permitidos. Los campos estructurales no pueden cambiarse para mantener la integridad contable.
          </Alert>

          <Group grow>
            <TextInput label="Código (No modificable)" value={cuenta.codigo} disabled />
            <TextInput label="Nombre" value={nombre} onChange={(e) => setNombre(e.currentTarget.value)} required withAsterisk maxLength={300} />
          </Group>

          <Group grow>
            <TextInput label="Nivel (No modificable)" value={`${cuenta.nivel} - Nivel ${cuenta.nivel}`} disabled />
            <TextInput label="Cuenta Padre (No modificable)" value={cuenta.cuentaPadreId || 'N/A'} disabled />
          </Group>

          <Group grow align="flex-start">
            <TextInput label="Naturaleza (No modificable)" value={cuenta.naturaleza} disabled />
            
            <Box>
              <Radio.Group label="Acepta Movimiento" value={movimiento} onChange={setMovimiento} withAsterisk>
                <Group mt="xs">
                  <Radio value="Sí" label="Sí" disabled={movimientoDisabled} />
                  <Radio value="No" label="No" disabled={movimientoDisabled} />
                </Group>
              </Radio.Group>
              {hasHijas && (
                <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light" mt="sm" p="xs">
                  No puede marcar esta cuenta para movimiento porque tiene subcuentas asociadas.
                </Alert>
              )}
              {isLastLevel && (
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mt="sm" p="xs">
                  Esta cuenta pertenece al último nivel configurado, por lo que acepta movimientos obligatoriamente.
                </Alert>
              )}
            </Box>
          </Group>

          <Group grow align="flex-start">
            <Box>
              <Radio.Group label="Requiere Tercero" value={requiereTercero} onChange={setRequiereTercero} withAsterisk>
                <Group mt="xs">
                  <Radio value="Sí" label="Sí" disabled={hasMovimientos} />
                  <Radio value="No" label="No" disabled={hasMovimientos} />
                </Group>
              </Radio.Group>
            </Box>
            <Box>
              <Radio.Group label="Requiere Centro de Costo" value={requiereCentroCosto} onChange={setRequiereCentroCosto} withAsterisk>
                <Group mt="xs">
                  <Radio value="Sí" label="Sí" disabled={hasMovimientos} />
                  <Radio value="No" label="No" disabled={hasMovimientos} />
                </Group>
              </Radio.Group>
            </Box>
          </Group>

          {hasMovimientos && (
            <Alert icon={<IconInfoCircle size={16} />} title="Atención" color="blue" variant="light" p="xs">
            Cambiar la naturaleza o nivel de una cuenta que ya posee movimientos puede afectar la integridad de los reportes históricos.
          </Alert>
          )}

          <Group grow align="flex-start">
            <Select
              label="Estado"
              value={estado}
              onChange={(val) => setEstado(val || 'Activa')}
              data={['Activa', 'Inactiva']}
              withAsterisk
            />
            <Alert icon={<IconInfoCircle size={16} />} title="Desactivación bloqueada" color="green" variant="light" p="xs" mt="md">
              Esta cuenta posee saldo actual o movimientos en el periodo activo. No puede ser desactivada.
            </Alert>
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button color="violet" onClick={handleSave}>Guardar Cambios</Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
}
