import { useState, useEffect } from 'react';
import { Modal, Group, Button, Stack, Text, TextInput, Select, Textarea, Checkbox, Tabs, Grid, NumberInput, Switch, Table, Box, Radio, Alert } from '@mantine/core';
import { IconLock, IconInfoCircle } from '@tabler/icons-react';

interface CrearTipoDocumentoModalProps {
  opened: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
  tipoId?: number | null;
}

export default function CrearTipoDocumentoModal({ opened, onClose, tenantId, onSuccess, tipoId }: CrearTipoDocumentoModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>('general');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // General state
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [modulo, setModulo] = useState('Contabilidad');
  const [clase, setClase] = useState('Comprobante Contable');
  const [requiereTercero, setRequiereTercero] = useState(false);
  const [requiereCentroCosto, setRequiereCentroCosto] = useState(false);
  const [permiteAnexos, setPermiteAnexos] = useState(false);
  const [permiteObservaciones, setPermiteObservaciones] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [esSistema, setEsSistema] = useState(false);
  const [activo, setActivo] = useState(true);

  // Numeración state
  const [prefijo, setPrefijo] = useState('');
  const [consecutivoInicial, setConsecutivoInicial] = useState<number | string>(1);
  const [longitud, setLongitud] = useState<number | string>(8);
  const [rellenoCeros, setRellenoCeros] = useState(true);
  const [automatico, setAutomatico] = useState(true);
  const [reinicioAnual, setReinicioAnual] = useState(false);
  const [reinicioMensual, setReinicioMensual] = useState(false);
  const [permiteManual, setPermiteManual] = useState('no');
  const [consecutivoActual, setConsecutivoActual] = useState(0);

  const hasMovements = consecutivoActual > 0;

  // Permisos state
  const [permisos, setPermisos] = useState([
    { rolId: 'CONTADOR', crear: true, editar: true, anular: true, consultar: true, imprimir: true },
    { rolId: 'ADMIN', crear: true, editar: true, anular: true, consultar: true, imprimir: true },
    { rolId: 'AUXILIAR', crear: true, editar: false, anular: false, consultar: true, imprimir: true }
  ]);

  const [activeRole, setActiveRole] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      setActiveTab('general');
      if (tipoId) {
        fetchTipo(tipoId);
      } else {
        resetForm();
      }
    }
  }, [opened, tipoId]);

  const resetForm = () => {
    setCodigo(''); setNombre(''); setModulo('Contabilidad'); setClase('Comprobante Contable');
    setRequiereTercero(false); setRequiereCentroCosto(false); setPermiteAnexos(false); setPermiteObservaciones(false);
    setDescripcion(''); setPrefijo(''); setConsecutivoInicial(1); setLongitud(8); setRellenoCeros(true);
    setAutomatico(true); setReinicioAnual(false); setReinicioMensual(false); setPermiteManual('no'); setConsecutivoActual(0);
    setEsSistema(false);
    setActivo(true);
    setActiveRole(null);
    setPermisos([
      { rolId: 'Contador', crear: true, editar: true, anular: true, consultar: true, imprimir: true },
      { rolId: 'Administrador', crear: true, editar: true, anular: true, consultar: true, imprimir: true },
      { rolId: 'Auxiliar Contable', crear: true, editar: false, anular: false, consultar: true, imprimir: true }
    ]);
  };

  const fetchTipo = async (id: number) => {
    setFetching(true);
    try {
      const res = await fetch(`http://localhost:3000/api/tipos-documento/${tenantId}/tipos-documento`);
      const data = await res.json();
      if (data.success) {
        const t = data.data.find((x: any) => x.id === id);
        if (t) {
          setCodigo(t.codigo); setNombre(t.nombre); setModulo(t.modulo); setClase(t.clase);
          setRequiereTercero(t.requiereTercero); setRequiereCentroCosto(t.requiereCentroCosto);
          setPermiteAnexos(t.permiteAnexos); setPermiteObservaciones(t.permiteObservaciones);
          setDescripcion(t.descripcion || ''); setEsSistema(t.esSistema); setActivo(t.activo !== false);
          
          if (t.numeraciones && t.numeraciones[0]) {
            const num = t.numeraciones[0];
            setPrefijo(num.prefijo || '');
            setConsecutivoInicial(num.rangoInicial);
            setLongitud(num.longitud);
            setRellenoCeros(num.rellenoCeros);
            setAutomatico(num.automatico);
            setReinicioAnual(num.reinicioAnual);
            setReinicioMensual(num.reinicioMensual);
            setPermiteManual(num.permiteManual ? 'si' : 'no');
            setConsecutivoActual(num.consecutivoActual);
          }
          if (t.permisos && t.permisos.length > 0) {
            setPermisos(t.permisos);
            setActiveRole(t.permisos[0].rolId);
          } else {
            setPermisos([]);
            setActiveRole(null);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!codigo || !nombre) return alert('Código y Nombre son obligatorios');
    if (codigo.length > 10) return alert('El código no puede superar los 10 caracteres');
    if (Number(longitud) < 4 || Number(longitud) > 15) return alert('La longitud debe estar entre 4 y 15 dígitos');

    const payload = {
      codigo, nombre, modulo, clase, requiereTercero, requiereCentroCosto, permiteAnexos, permiteObservaciones, descripcion, activo,
      numeraciones: [{
        prefijo, 
        rangoInicial: Number(consecutivoInicial), 
        longitud: Number(longitud), 
        rellenoCeros, 
        automatico,
        reinicioAnual,
        reinicioMensual,
        permiteManual: permiteManual === 'si',
        consecutivoActual: hasMovements ? consecutivoActual : Number(consecutivoInicial),
        activa: true
      }],
      permisos
    };

    setLoading(true);
    try {
      const url = tipoId 
        ? `http://localhost:3000/api/tipos-documento/${tenantId}/tipos-documento/${tipoId}`
        : `http://localhost:3000/api/tipos-documento/${tenantId}/tipos-documento`;
      
      const res = await fetch(url, {
        method: tipoId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error guardando tipo documental');
    } finally {
      setLoading(false);
    }
  };

  const handlePermisoChange = (idx: number, field: string, checked: boolean) => {
    const newP = [...permisos];
    (newP[idx] as any)[field] = checked;
    setPermisos(newP);
  };

  const handleReinicioAnualChange = (checked: boolean) => {
    setReinicioAnual(checked);
    if (checked) setReinicioMensual(false);
  };

  const handleReinicioMensualChange = (checked: boolean) => {
    setReinicioMensual(checked);
    if (checked) setReinicioAnual(false);
  };

  const generatePreview = (offset: number) => {
    const base = consecutivoActual > 0 ? consecutivoActual : Number(consecutivoInicial) - 1;
    let numStr = (base + offset).toString();
    if (rellenoCeros && longitud) {
      numStr = numStr.padStart(Number(longitud), '0');
    }
    return `${prefijo}${numStr}`;
  };

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={600} size="lg">{tipoId ? 'Modificar' : 'Nuevo'} Tipo de Documento</Text>} size="xl" centered>
      <Tabs value={activeTab} onChange={setActiveTab} color="violet">
        <Tabs.List mb="md">
          <Tabs.Tab value="general">General</Tabs.Tab>
          <Tabs.Tab value="numeracion">Numeración</Tabs.Tab>
          <Tabs.Tab value="usuarios">Usuarios</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general">
          <Stack gap="md">
            {!activo && tipoId && (
              <Alert icon={<IconInfoCircle size={16} />} title="Documento Inactivo" color="red" variant="light">
                <Group justify="space-between">
                  <Text size="sm">Este documento se encuentra inactivo y no puede ser usado en la captura de movimientos.</Text>
                  <Button size="xs" color="green" onClick={() => setActivo(true)}>Reactivar Documento</Button>
                </Group>
              </Alert>
            )}

            {hasMovements && (
              <Alert icon={<IconLock size={16} />} title="Documento con Movimientos" color="blue" variant="light">
                Este documento ya posee movimientos registrados. Los campos estructurales (Código, Módulo, Clase) no pueden modificarse.
              </Alert>
            )}
            <Text fw={600} size="sm" c="violet">INFORMACIÓN GENERAL</Text>
            <Grid>
              <Grid.Col span={6}>
                <TextInput label="Código" placeholder="Ej. CC" required value={codigo} onChange={(e) => {
                  const val = e.currentTarget.value.toUpperCase();
                  setCodigo(val);
                  if (consecutivoActual === 0) setPrefijo(val);
                }} maxLength={10} disabled={hasMovements} rightSection={hasMovements ? <IconLock size={16} style={{ color: 'gray' }} /> : null} />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label="Nombre" placeholder="Ej. Comprobante de Contabilidad" required value={nombre} onChange={(e) => setNombre(e.currentTarget.value)} />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select label="Módulo" required data={['Contabilidad', 'Tesorería', 'Ventas', 'Compras', 'Activos Fijos', 'Nómina', 'Inventarios', 'Impuestos']} value={modulo} onChange={(v) => setModulo(v || '')} disabled={hasMovements} rightSection={hasMovements ? <IconLock size={16} style={{ color: 'gray' }} /> : null} />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select label="Clase" required data={['Comprobante Contable', 'Ingreso', 'Egreso', 'Factura', 'Nota Débito', 'Nota Crédito', 'Ajuste', 'Cierre', 'Apertura']} value={clase} onChange={(v) => setClase(v || '')} disabled={hasMovements} rightSection={hasMovements ? <IconLock size={16} style={{ color: 'gray' }} /> : null} />
              </Grid.Col>
            </Grid>

            <Text fw={600} size="sm" c="violet" mt="md">OPCIONES</Text>
            <Grid>
              <Grid.Col span={6}><Checkbox label="Requiere Tercero" checked={requiereTercero} onChange={(e) => setRequiereTercero(e.currentTarget.checked)} color="violet" /></Grid.Col>
              <Grid.Col span={6}><Checkbox label="Permitir Anexos" checked={permiteAnexos} onChange={(e) => setPermiteAnexos(e.currentTarget.checked)} color="violet" /></Grid.Col>
              <Grid.Col span={6}><Checkbox label="Requiere Centro de Costos" checked={requiereCentroCosto} onChange={(e) => setRequiereCentroCosto(e.currentTarget.checked)} color="violet" /></Grid.Col>
              <Grid.Col span={6}><Checkbox label="Permitir Observaciones" checked={permiteObservaciones} onChange={(e) => setPermiteObservaciones(e.currentTarget.checked)} color="violet" /></Grid.Col>
              <Grid.Col span={12}><Switch label="Documento Activo" checked={activo} onChange={(e) => setActivo(e.currentTarget.checked)} color="violet" mt="xs" /></Grid.Col>
            </Grid>

            <Text fw={600} size="sm" c="violet" mt="md">DESCRIPCIÓN (OPCIONAL)</Text>
            <Textarea placeholder="Descripción del tipo de documento..." value={descripcion} onChange={(e) => setDescripcion(e.currentTarget.value)} />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="numeracion">
          <Stack gap="md">
            <Text fw={600} size="sm" c="violet">CONFIGURACIÓN DE NUMERACIÓN</Text>
            <Grid>
              <Grid.Col span={4}>
                <TextInput label="Prefijo" placeholder="Ej. CC" value={prefijo} disabled maxLength={10} description="Se hereda del código del documento" />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput label="Longitud del Consecutivo" value={longitud} onChange={setLongitud} min={4} max={15} description="Dígitos numéricos" />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput label="Consecutivo Inicial" value={consecutivoInicial} onChange={(v) => setConsecutivoInicial(Number(v))} min={1} />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput label="Consecutivo Actual" value={consecutivoActual} onChange={(v) => setConsecutivoActual(Number(v))} description="Puedes adelantarlo o atrasarlo libremente." />
              </Grid.Col>
            </Grid>

            <Text fw={600} size="sm" c="violet" mt="sm">OPCIONES</Text>
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Checkbox label="Generar consecutivo automáticamente" checked={automatico} onChange={(e) => setAutomatico(e.currentTarget.checked)} color="violet" />
                  <Checkbox label="Completar con ceros a la izquierda" checked={rellenoCeros} onChange={(e) => setRellenoCeros(e.currentTarget.checked)} color="violet" />
                  <Checkbox label="Reiniciar consecutivo cada año" checked={reinicioAnual} onChange={(e) => handleReinicioAnualChange(e.currentTarget.checked)} color="violet" />
                  <Checkbox label="Reiniciar consecutivo cada mes" checked={reinicioMensual} onChange={(e) => handleReinicioMensualChange(e.currentTarget.checked)} color="violet" />
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Box p="md" style={{ border: '1px solid #e9ecef', borderRadius: 8 }}>
                  <Text size="sm" fw={500} mb="xs">Permitir editar consecutivo manualmente</Text>
                  <Radio.Group value={permiteManual} onChange={setPermiteManual}>
                    <Stack gap="xs">
                      <Radio value="no" label="No" color="violet" />
                      <Radio value="si" label="Sí" color="violet" />
                    </Stack>
                  </Radio.Group>
                </Box>
              </Grid.Col>
            </Grid>

            <Text fw={600} size="sm" c="violet" mt="sm">VISTA PREVIA</Text>
            <Box p="lg" bg="violet.0" style={{ borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
              <Text fw={600} size="lg" c="violet.9">{generatePreview(1)}</Text>
              <Text c="violet.5">→</Text>
              <Text fw={600} size="lg" c="violet.9">{generatePreview(2)}</Text>
              <Text c="violet.5">→</Text>
              <Text fw={600} size="lg" c="violet.9">{generatePreview(3)}</Text>
            </Box>
            <Text size="xs" c="dimmed">Así se verá la numeración de los próximos documentos.</Text>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="usuarios">
          <Stack gap="md">
            <Grid>
              <Grid.Col span={12}>
                <Text fw={600} size="sm" c="violet" mb="xs">ROLES AUTORIZADOS</Text>
                <Text size="sm" c="dimmed" mb="md">Seleccione los roles que podrán utilizar este tipo de documento.</Text>
                <Box style={{ border: '1px solid #e9ecef', borderRadius: 8, maxHeight: 200, overflowY: 'auto' }} p="xs">
                  {['Administrador', 'Contador', 'Auxiliar Contable', 'Tesorería', 'Auditor', 'Revisor Fiscal', 'Gerencia', 'Compras', 'Ventas', 'Inventarios', 'Nómina', 'Supervisor'].map((rol) => {
                    const idx = permisos.findIndex(p => p.rolId === rol);
                    const isAuthorized = idx >= 0;
                    const isActive = activeRole === rol;
                    return (
                      <Group 
                        key={rol} 
                        justify="space-between" 
                        p="xs" 
                        style={{ 
                          cursor: 'pointer', 
                          backgroundColor: isActive ? '#f3f0ff' : 'transparent',
                          borderRadius: 4
                        }}
                        onClick={() => {
                          setActiveRole(rol);
                          if (!isAuthorized) {
                            // Si se hace clic para ver, pero no está autorizado, lo pre-autorizamos con valores por defecto
                            setPermisos([...permisos, { rolId: rol, crear: false, editar: false, anular: false, consultar: true, imprimir: true }]);
                          }
                        }}
                      >
                        <Checkbox 
                          label={<Text fw={isActive ? 600 : 400} c={isActive ? 'violet.9' : 'dark'}>{rol}</Text>} 
                          checked={isAuthorized} 
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.currentTarget.checked) {
                              setPermisos([...permisos, { rolId: rol, crear: false, editar: false, anular: false, consultar: true, imprimir: true }]);
                              setActiveRole(rol);
                            } else {
                              setPermisos(permisos.filter(p => p.rolId !== rol));
                              if (activeRole === rol) setActiveRole(null);
                            }
                          }}
                          color="violet" 
                        />
                      </Group>
                    );
                  })}
                </Box>
              </Grid.Col>
            </Grid>

            {activeRole && (() => {
              const pIdx = permisos.findIndex(p => p.rolId === activeRole);
              if (pIdx < 0) return null;
              const p = permisos[pIdx];
              return (
                <Box mt="md" p="md" bg="gray.0" style={{ borderRadius: 8, border: '1px solid #e9ecef' }}>
                  <Text fw={600} size="sm" c="violet" mb="xs">PERMISOS SOBRE ESTE TIPO DE DOCUMENTO</Text>
                  <Text size="sm" c="dimmed" mb="md">Defina las acciones que el rol <b>{activeRole}</b> podrá realizar.</Text>
                  
                  <Grid>
                    <Grid.Col span={6}>
                      <Stack gap="xs">
                        <Checkbox label="Crear documentos" checked={p.crear} onChange={(e) => handlePermisoChange(pIdx, 'crear', e.currentTarget.checked)} color="violet" />
                        <Checkbox label="Modificar documentos" checked={p.editar} onChange={(e) => handlePermisoChange(pIdx, 'editar', e.currentTarget.checked)} color="violet" />
                        <Checkbox label="Consultar documentos" checked={p.consultar} onChange={(e) => handlePermisoChange(pIdx, 'consultar', e.currentTarget.checked)} color="violet" />
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Stack gap="xs">
                        <Checkbox label="Anular documentos" checked={p.anular} onChange={(e) => handlePermisoChange(pIdx, 'anular', e.currentTarget.checked)} color="violet" />
                        <Checkbox label="Imprimir documentos" checked={p.imprimir} onChange={(e) => handlePermisoChange(pIdx, 'imprimir', e.currentTarget.checked)} color="violet" />
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Box>
              );
            })()}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={onClose}>Cancelar</Button>
        <Button color="violet" onClick={handleSave} loading={loading || fetching}>Guardar</Button>
      </Group>
    </Modal>
  );
}
