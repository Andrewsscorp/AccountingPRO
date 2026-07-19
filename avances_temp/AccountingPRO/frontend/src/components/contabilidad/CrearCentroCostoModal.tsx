import React, { useState, useEffect } from 'react';
import { 
  Modal, Button, Group, TextInput, Stack, Select, 
  Textarea, Switch, Alert, Text, LoadingOverlay, Box
} from '@mantine/core';
import { IconInfoCircle, IconLock } from '@tabler/icons-react';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  centroId?: number | null;
  centros: any[];
}

export default function CrearCentroCostoModal({ opened, onClose, onSuccess, centroId, centros }: Props) {
  const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [padreId, setPadreId] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);

  const [hasDependencies, setHasDependencies] = useState(false);
  const [isNew, setIsNew] = useState(true);
  
  const [estructura, setEstructura] = useState<number[]>([]);

  useEffect(() => {
    if (opened) {
      fetchEstructura();
      if (centroId) {
        setIsNew(false);
        fetchCentro(centroId);
      } else {
        setIsNew(true);
        resetForm();
      }
    }
  }, [opened, centroId]);

  const fetchEstructura = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/centros-costo/${tenantId}/centros-costo/estructura`);
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        const n1 = d.nivel1Longitud || 0;
        const n2 = d.nivel2Longitud || 0;
        const n3 = d.nivel3Longitud || 0;
        const n4 = d.nivel4Longitud || 0;
        const n5 = d.nivel5Longitud || 0;
        
        const lengths = [];
        let acc = 0;
        if (n1 > 0) { acc += n1; lengths.push(acc); }
        if (n2 > 0) { acc += n2; lengths.push(acc); }
        if (n3 > 0) { acc += n3; lengths.push(acc); }
        if (n4 > 0) { acc += n4; lengths.push(acc); }
        if (n5 > 0) { acc += n5; lengths.push(acc); }
        
        setEstructura(lengths);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setCodigo('');
    setNombre('');
    setPadreId(null);
    setDescripcion('');
    setActivo(true);
    setHasDependencies(false);
  };

  const fetchCentro = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/centros-costo/${tenantId}/centros-costo`);
      const data = await res.json();
      if (data.success) {
        const c = data.data.find((x: any) => x.id === id);
        if (c) {
          setCodigo(c.codigo);
          setNombre(c.nombre);
          setPadreId(c.padreId ? String(c.padreId) : null);
          setDescripcion(c.descripcion || '');
          setActivo(c.activo);
          
          const deps = await fetch(`http://localhost:3000/api/centros-costo/${tenantId}/centros-costo/${id}/validaciones`);
          const depsData = await deps.json();
          if (depsData.success) {
            setHasDependencies(depsData.data.movimientos > 0 || depsData.data.hijos > 0);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (andNew: boolean = false) => {
    if (!codigo || !nombre) {
      alert('Código y nombre son obligatorios');
      return;
    }

    if (estructura.length > 0) {
      const len = codigo.length;
      const idx = estructura.indexOf(len);
      if (idx === -1) {
        alert(`La longitud del código (${len} dígitos) no coincide con ningún nivel de la estructura configurada.`);
        return;
      }
      if (idx > 0 && !padreId) {
        alert('No se encontró el centro de costo padre para este código. Asegúrese de crearlo primero.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = { codigo, nombre, padreId, descripcion, activo };
      const url = `http://localhost:3000/api/centros-costo/${tenantId}/centros-costo${centroId ? `/${centroId}` : ''}`;
      
      const res = await fetch(url, {
        method: centroId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        onSuccess();
        if (andNew) {
          resetForm();
        } else {
          onClose();
        }
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al guardar.');
    } finally {
      setSaving(false);
    }
  };

  // Prevent selecting itself or its children as parent (basic validation)
  const availableParents = centros
    .filter(c => c.activo && c.id !== centroId)
    .map(c => ({ value: String(c.id), label: `${c.codigo} - ${c.nombre}` }));

  return (
    <Modal opened={opened} onClose={onClose} title={isNew ? "Nuevo Centro de Costos" : "Modificar Centro de Costos"} size="lg">
      <Box pos="relative">
        <LoadingOverlay visible={loading || saving} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        
        <Stack gap="md">
          {!isNew && !activo && (
            <Alert icon={<IconInfoCircle size={16} />} title="Centro Inactivo" color="red" variant="light">
              <Group justify="space-between">
                <Text size="sm">Este centro se encuentra inactivo y no puede recibir movimientos.</Text>
                <Button size="xs" color="green" onClick={() => setActivo(true)}>Reactivar Centro</Button>
              </Group>
            </Alert>
          )}

          {!isNew && hasDependencies && (
            <Alert icon={<IconLock size={16} />} title="Centro con Dependencias" color="blue" variant="light">
              Este centro ya posee movimientos o subcentros. La estructura y el código no pueden modificarse.
            </Alert>
          )}

          <Group grow>
            <TextInput 
              label="Código" 
              placeholder="Ej. 001002" 
              required 
              value={codigo} 
              onChange={(e) => {
                const val = e.currentTarget.value;
                setCodigo(val);
                
                // Detección automática del padre
                if (isNew && estructura.length > 0) {
                  const len = val.length;
                  const levelIndex = estructura.indexOf(len);
                  if (levelIndex > 0) {
                    const parentLen = estructura[levelIndex - 1];
                    const parentCode = val.substring(0, parentLen);
                    const parent = centros.find(c => c.codigo === parentCode);
                    setPadreId(parent ? String(parent.id) : null);
                  } else {
                    setPadreId(null);
                  }
                }
              }} 
              disabled={!isNew}
              description={!isNew ? "El código es inmodificable una vez creado." : ""}
            />
            <TextInput 
              label="Nombre" 
              placeholder="Ej. Ventas Norte" 
              required 
              value={nombre} 
              onChange={(e) => setNombre(e.currentTarget.value)} 
            />
          </Group>

          <TextInput
            label="Centro Padre"
            placeholder="Detectado automáticamente..."
            value={padreId ? centros.find(c => String(c.id) === padreId)?.nombre || '' : ''}
            readOnly
            disabled
            description="El centro padre se asigna automáticamente según el código ingresado."
          />

          <Textarea 
            label="Descripción" 
            placeholder="Detalles adicionales del centro de costos..." 
            value={descripcion} 
            onChange={(e) => setDescripcion(e.currentTarget.value)} 
          />

          <Switch 
            label="Centro Activo" 
            checked={activo} 
            onChange={(e) => setActivo(e.currentTarget.checked)} 
            color="violet" 
            mt="xs" 
          />

        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button variant="subtle" onClick={onClose} color="gray">Cancelar</Button>
          {isNew && (
            <Button variant="outline" color="violet" onClick={() => handleSave(true)}>Guardar y Nuevo</Button>
          )}
          <Button color="violet" onClick={() => handleSave(false)}>Guardar</Button>
        </Group>
      </Box>
    </Modal>
  );
}
