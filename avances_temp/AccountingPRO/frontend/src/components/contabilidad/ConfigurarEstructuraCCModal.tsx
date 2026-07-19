import { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Text,
  Group,
  Button,
  NumberInput,
  Alert,
  ThemeIcon,
  Grid,
  Paper,
  Divider,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconBookmark,
  IconLayersLinked,
  IconFolder,
  IconFileText,
  IconTag,
  IconRefresh,
} from '@tabler/icons-react';

interface Props {
  opened: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
  hasConfig: boolean;
}

export default function ConfigurarEstructuraCCModal({ opened, onClose, tenantId, onSuccess, hasConfig }: Props) {
  const [n1, setN1] = useState<number | string>(2);
  const [n2, setN2] = useState<number | string>(2);
  const [n3, setN3] = useState<number | string>(2);
  const [n4, setN4] = useState<number | string>(0);
  const [n5, setN5] = useState<number | string>(0);
  const [loading, setLoading] = useState(false);
  const [hasMovimientos, setHasMovimientos] = useState(false);

  useEffect(() => {
    if (opened) {
      fetchEstructura();
    }
  }, [opened]);

  const fetchEstructura = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/centros-costo/${tenantId}/centros-costo/estructura`);
      const json = await res.json();
      if (json.success) {
        setN1(json.data.nivel1Longitud);
        setN2(json.data.nivel2Longitud);
        setN3(json.data.nivel3Longitud);
        setN4(json.data.nivel4Longitud);
        setN5(json.data.nivel5Longitud);
        setHasMovimientos(json.data.hasMovimientos);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const setDefault = () => {
    setN1(2); setN2(2); setN3(2); setN4(0); setN5(0);
  };

  const handleSave = async () => {
    const v1 = Number(n1) || 0;
    const v2 = Number(n2) || 0;
    const v3 = Number(n3) || 0;
    const v4 = Number(n4) || 0;
    const v5 = Number(n5) || 0;

    if (v1 > 4 || v2 > 4 || v3 > 4 || v4 > 4 || v5 > 4) {
      alert("Máximo 4 dígitos por nivel.");
      return;
    }
    
    if (v1 === 0) {
      alert("El Nivel 1 debe tener al menos 1 dígito.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/centros-costo/${tenantId}/centros-costo/estructura`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n1: v1, n2: v2, n3: v3, n4: v4, n5: v5 })
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
      alert('Error guardando la estructura');
    } finally {
      setLoading(false);
    }
  };

  const t1 = Number(n1) || 0;
  const t2 = t1 + (Number(n2) || 0);
  const t3 = t2 + (Number(n3) || 0);
  const t4 = t3 + (Number(n4) || 0);
  const t5 = t4 + (Number(n5) || 0);

  const getDummyCode = (length: number) => {
    if (length === 0) return '';
    return '1'.padEnd(length, '0');
  };

  const activeLevels = [n1, n2, n3, n4, n5].filter(n => (Number(n) || 0) > 0).length;

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700} size="lg">Configurar Estructura (Centros de Costos)</Text>} size="xl" radius="md">
      <Text size="sm" c="dimmed" mb="xl">Defina la cantidad de dígitos para cada nivel de la estructura jerárquica de sus Centros de Costos.</Text>

      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Text size="xs" fw={700} c="dimmed" mb="md">NIVELES DE LA ESTRUCTURA</Text>
          
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm">
                <ThemeIcon variant="light" color="violet" size="lg"><IconBookmark size={20} /></ThemeIcon>
                <Box>
                  <Text size="sm" fw={600}>Área / Sede</Text>
                  <Text size="xs" c="dimmed">Nivel 1</Text>
                </Box>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <NumberInput value={n1} onChange={setN1} min={1} max={4} w={70} disabled={hasConfig || hasMovimientos} />
                <Text size="sm" c="dimmed">dígitos</Text>
              </Group>
            </Group>

            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm">
                <ThemeIcon variant="light" color="indigo" size="lg"><IconLayersLinked size={20} /></ThemeIcon>
                <Box>
                  <Text size="sm" fw={600}>Departamento</Text>
                  <Text size="xs" c="dimmed">Nivel 2</Text>
                </Box>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <NumberInput value={n2} onChange={setN2} min={0} max={4} w={70} disabled={hasConfig || hasMovimientos} />
                <Text size="sm" c="dimmed">dígitos</Text>
              </Group>
            </Group>

            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm">
                <ThemeIcon variant="light" color="blue" size="lg"><IconFolder size={20} /></ThemeIcon>
                <Box>
                  <Text size="sm" fw={600}>Sección</Text>
                  <Text size="xs" c="dimmed">Nivel 3</Text>
                </Box>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <NumberInput value={n3} onChange={setN3} min={0} max={4} w={70} disabled={hasConfig || hasMovimientos} />
                <Text size="sm" c="dimmed">dígitos</Text>
              </Group>
            </Group>

            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm">
                <ThemeIcon variant="light" color="cyan" size="lg"><IconFileText size={20} /></ThemeIcon>
                <Box>
                  <Text size="sm" fw={600}>Centro</Text>
                  <Text size="xs" c="dimmed">Nivel 4</Text>
                </Box>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <NumberInput value={n4} onChange={setN4} min={0} max={4} w={70} disabled={hasConfig || hasMovimientos} />
                <Text size="sm" c="dimmed">dígitos</Text>
              </Group>
            </Group>

            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm">
                <ThemeIcon variant="light" color="teal" size="lg"><IconTag size={20} /></ThemeIcon>
                <Box>
                  <Text size="sm" fw={600}>Subcentro</Text>
                  <Text size="xs" c="dimmed">Nivel 5</Text>
                </Box>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <NumberInput value={n5} onChange={setN5} min={0} max={4} w={70} disabled={hasConfig || hasMovimientos} />
                <Text size="sm" c="dimmed">dígitos</Text>
              </Group>
            </Group>
          </Box>

          <Divider my="lg" />

          <Group justify="space-between" mb="sm">
            <Group gap="xs">
              <IconAlertTriangle size={14} color="gray" />
              <Text size="xs" c="dimmed">Longitud máxima del código: {t5} dígitos</Text>
            </Group>
            <Text size="xs" c="dimmed">Niveles activos: {activeLevels}</Text>
          </Group>

          <Button variant="light" color="violet" fullWidth leftSection={<IconRefresh size={16} />} onClick={setDefault} disabled={hasConfig || hasMovimientos}>
            Usar estructura estándar (2-2-2)
          </Button>

        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 7 }}>
          <Text size="xs" fw={700} c="dimmed" mb="md">VISTA PREVIA DE LA ESTRUCTURA</Text>
          
          <Paper p="md" radius="md" style={{ border: '1px solid #eaeaea', backgroundColor: '#fafafa' }} mb="lg">
            <Box style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: 1.8 }}>
              {t1 > 0 && (
                <Group gap="xs">
                  <Text c="violet" fw={700}>{getDummyCode(t1)}</Text>
                  <Text c="dimmed">Área / Sede ({t1} dígitos en total)</Text>
                </Group>
              )}
              {t2 > t1 && (
                <Group gap="xs" pl={20}>
                  <Text c="gray">└</Text>
                  <Text c="indigo" fw={700}>{getDummyCode(t2)}</Text>
                  <Text c="dimmed">Departamento ({t2} dígitos en total)</Text>
                </Group>
              )}
              {t3 > t2 && (
                <Group gap="xs" pl={40}>
                  <Text c="gray">└</Text>
                  <Text c="blue" fw={700}>{getDummyCode(t3)}</Text>
                  <Text c="dimmed">Sección ({t3} dígitos en total)</Text>
                </Group>
              )}
              {t4 > t3 && (
                <Group gap="xs" pl={60}>
                  <Text c="gray">└</Text>
                  <Text c="cyan" fw={700}>{getDummyCode(t4)}</Text>
                  <Text c="dimmed">Centro ({t4} dígitos en total)</Text>
                </Group>
              )}
              {t5 > t4 && (
                <Group gap="xs" pl={80}>
                  <Text c="gray">└</Text>
                  <Text c="teal" fw={700}>{getDummyCode(t5)}</Text>
                  <Text c="dimmed">Subcentro ({t5} dígitos en total)</Text>
                </Group>
              )}
            </Box>
          </Paper>

          <Alert variant="light" color={hasConfig ? "blue" : "yellow"} title={hasConfig ? "Estructura Bloqueada" : "Importante"} icon={<IconAlertTriangle />}>
            {hasConfig 
              ? "La estructura de Centros de Costos ya fue configurada y se encuentra bloqueada por seguridad. No es posible modificar la cantidad de niveles ni sus longitudes."
              : "Si se define o cambia la estructura y existen centros creados que no tienen movimientos, el sistema eliminará todos los centros existentes para inicializar desde cero la nueva estructura."}
          </Alert>
        </Grid.Col>
      </Grid>

      <Group justify="flex-end" mt="xl" pt="md" style={{ borderTop: '1px solid #eaeaea' }}>
        <Button variant="default" onClick={onClose}>Cancelar</Button>
        {!hasConfig && (
          <Button color="violet" onClick={handleSave} loading={loading} disabled={hasMovimientos}>Guardar Estructura</Button>
        )}
      </Group>
    </Modal>
  );
}
