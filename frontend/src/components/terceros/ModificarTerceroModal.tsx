import { useState, useEffect } from 'react';
import { Modal, Group, Button, Stack, TextInput, Select, Grid, Checkbox, Text, Radio, Box, MultiSelect } from '@mantine/core';

interface ModificarTerceroModalProps {
  opened: boolean;
  onClose: () => void;
  tenantId: string;
  terceroId: number;
  onSuccess: () => void;
}

const DEPARTAMENTOS: Record<string, string[]> = {
  'Antioquia': ['Medellín', 'Bello', 'Envigado', 'Itagüí', 'Rionegro', 'Apartadó'],
  'Cundinamarca': ['Bogotá D.C.', 'Soacha', 'Chía', 'Zipaquirá', 'Facatativá'],
  'Valle del Cauca': ['Cali', 'Buenaventura', 'Palmira', 'Buga', 'Tuluá'],
  'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanagrande'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta'],
};

export default function ModificarTerceroModal({ opened, onClose, tenantId, terceroId, onSuccess }: ModificarTerceroModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 1. Información básica
  const [roles, setRoles] = useState<string[]>([]);
  const [tipoIdentificacion, setTipoIdentificacion] = useState<string | null>(null);
  const [identificacion, setIdentificacion] = useState('');
  const [dv, setDv] = useState('');
  const [tipoPersona, setTipoPersona] = useState('NATURAL');
  const [esEmpresaPrincipal, setEsEmpresaPrincipal] = useState(false);

  // 2. Información personal / empresarial
  const [nombre1, setNombre1] = useState('');
  const [nombre2, setNombre2] = useState('');
  const [apellido1, setApellido1] = useState('');
  const [apellido2, setApellido2] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');

  // 2b. Información tributaria
  const [actividadCiiu, setActividadCiiu] = useState('');
  const [regimenTributario, setRegimenTributario] = useState<string | null>(null);
  const [responsabilidadDian, setResponsabilidadDian] = useState<string | null>(null);
  const [granContribuyente, setGranContribuyente] = useState<string | null>(null);
  const [autorretenedor, setAutorretenedor] = useState<string | null>(null);

  // 3. Información de contacto
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [celular, setCelular] = useState('');
  const [direccion, setDireccion] = useState('');
  const [departamento, setDepartamento] = useState<string | null>(null);
  const [ciudad, setCiudad] = useState<string | null>(null);
  const [inactivo, setInactivo] = useState(false);

  const [ciiuList, setCiiuList] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    if (opened) {
      cargarCiiu();
      if (terceroId) {
        cargarTercero();
      }
    }
  }, [opened, terceroId]);

  const cargarCiiu = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/globals/ciiu`);
      const json = await res.json();
      if (json.success) {
        setCiiuList(json.data.map((c: any) => ({
          value: c.codigo,
          label: `${c.codigo} - ${c.descripcion}`
        })));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const cargarTercero = async () => {
    setFetching(true);
    try {
      const res = await fetch(`http://localhost:3000/api/terceros/${tenantId}/terceros`);
      const json = await res.json();
      if (json.success) {
        const t = json.data.find((x: any) => x.id === terceroId);
        if (t) {
          setRoles(t.roles.map((r: any) => r.rol));
          setTipoIdentificacion(t.tipoIdentificacion);
          setIdentificacion(t.identificacion);
          setDv(t.dv || '');
          setTipoPersona(t.tipoPersona);
          setEsEmpresaPrincipal(t.esEmpresaPrincipal);

          setNombre1(t.nombre1 || '');
          setNombre2(t.nombre2 || '');
          setApellido1(t.apellido1 || '');
          setApellido2(t.apellido2 || '');
          setRazonSocial(t.razonSocial || '');
          setNombreComercial(t.nombreComercial || '');

          setActividadCiiu(t.actividadCiiu || '');
          setRegimenTributario(t.regimenTributario || null);
          setResponsabilidadDian(t.responsabilidadDian || null);
          setGranContribuyente(t.granContribuyente === true ? 'Sí' : (t.granContribuyente === false ? 'No' : null));
          setAutorretenedor(t.autorretenedor === true ? 'Sí' : (t.autorretenedor === false ? 'No' : null));

          setEmail(t.email || '');
          setTelefono(t.telefono || '');
          setCelular(t.celular || '');
          setDireccion(t.direccion || '');
          setDepartamento(t.departamento || null);
          setCiudad(t.ciudad || null);
          setInactivo(!t.activa);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    setCiudad(null);
  }, [departamento]);

  const handleSave = async () => {
    if (roles.length === 0) return alert('Debe seleccionar al menos un rol de tercero.');
    
    if (tipoPersona === 'NATURAL' && (!nombre1 || !apellido1)) {
      return alert('El primer nombre y el primer apellido son obligatorios.');
    }
    if (tipoPersona === 'JURIDICA' && !razonSocial) {
      return alert('La razón social es obligatoria.');
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/terceros/${tenantId}/terceros/${terceroId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razonSocial: tipoPersona === 'JURIDICA' ? razonSocial : null,
          nombreComercial: tipoPersona === 'JURIDICA' ? nombreComercial : null,
          nombre1: tipoPersona === 'NATURAL' ? nombre1 : null,
          nombre2: tipoPersona === 'NATURAL' ? nombre2 : null,
          apellido1: tipoPersona === 'NATURAL' ? apellido1 : null,
          apellido2: tipoPersona === 'NATURAL' ? apellido2 : null,
          
          actividadCiiu,
          regimenTributario,
          responsabilidadDian,
          granContribuyente: granContribuyente === 'Sí' ? true : (granContribuyente === 'No' ? false : null),
          autorretenedor: autorretenedor === 'Sí' ? true : (autorretenedor === 'No' ? false : null),

          direccion,
          telefono,
          celular,
          email,
          departamento,
          ciudad,
          activa: !inactivo,
          roles
        })
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
      alert('Error actualizando el tercero.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700} size="xl">Modificar Tercero</Text>} size="xl" centered>
      {fetching ? (
        <Text>Cargando información...</Text>
      ) : (
      <Stack gap="lg">
        {esEmpresaPrincipal && (
          <Box p="sm" bg="blue.0" style={{ borderRadius: 8, border: '1px solid #74c0fc' }}>
            <Text size="sm" c="blue.7">Este tercero corresponde a la empresa principal del sistema. No se puede inactivar ni modificar su identificación básica.</Text>
          </Box>
        )}

        {/* Sección 1 */}
        <Box>
          <Text fw={600} c="violet" mb="sm">1. Información básica</Text>
          <Grid>
            <Grid.Col span={6}>
              <MultiSelect 
                label="Tipo de tercero" 
                placeholder="Seleccione..." 
                data={['CLIENTE', 'PROVEEDOR', 'EMPLEADO', 'SOCIO', 'ACCIONISTA', 'BANCO', 'ENTIDAD PÚBLICA', 'CONTRATISTA', 'OTRO']} 
                value={roles} 
                onChange={setRoles} 
                required 
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select label="Tipo de documento" value={tipoIdentificacion} data={[tipoIdentificacion || '']} disabled />
            </Grid.Col>
            <Grid.Col span={tipoIdentificacion === 'NIT' ? 8 : 12}>
              <TextInput label="Número de documento" value={identificacion} disabled />
            </Grid.Col>
            {tipoIdentificacion === 'NIT' && (
              <Grid.Col span={4}>
                <TextInput label="Dígito de verificación" value={dv} disabled />
              </Grid.Col>
            )}
            <Grid.Col span={12} mt="xs">
              <Radio.Group value={tipoPersona}>
                <Group gap="xl">
                  <Radio value="NATURAL" label="Persona Natural" color="violet" disabled />
                  <Radio value="JURIDICA" label="Persona Jurídica" color="violet" disabled />
                </Group>
              </Radio.Group>
            </Grid.Col>
          </Grid>
        </Box>

        {/* Sección 2 */}
        <Box>
          <Text fw={600} c="violet" mb="sm">2. Información de la empresa / personal</Text>
          {tipoPersona === 'NATURAL' ? (
            <Grid>
              <Grid.Col span={6}><TextInput label="Primer nombre" placeholder="Ingrese el primer nombre" value={nombre1} onChange={(e) => setNombre1(e.currentTarget.value)} required /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Segundo nombre" placeholder="Ingrese el segundo nombre" value={nombre2} onChange={(e) => setNombre2(e.currentTarget.value)} /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Primer apellido" placeholder="Ingrese el primer apellido" value={apellido1} onChange={(e) => setApellido1(e.currentTarget.value)} required /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Segundo apellido" placeholder="Ingrese el segundo apellido" value={apellido2} onChange={(e) => setApellido2(e.currentTarget.value)} /></Grid.Col>
            </Grid>
          ) : (
            <Grid>
              <Grid.Col span={12}><TextInput label="Razón social" placeholder="Ingrese la razón social" value={razonSocial} onChange={(e) => setRazonSocial(e.currentTarget.value)} required /></Grid.Col>
              <Grid.Col span={12}><TextInput label="Nombre comercial" placeholder="Ingrese el nombre comercial (opcional)" value={nombreComercial} onChange={(e) => setNombreComercial(e.currentTarget.value)} /></Grid.Col>
            </Grid>
          )}

          <Grid mt="sm">
            <Grid.Col span={6}>
              <Select 
                label="Actividad económica (CIIU)" 
                placeholder="Seleccione o busque..." 
                data={ciiuList} 
                value={actividadCiiu} 
                onChange={(val) => setActividadCiiu(val || '')} 
                searchable 
                clearable
              />
            </Grid.Col>
            <Grid.Col span={6}><Select label="Régimen" data={['Responsable de IVA', 'No responsable de IVA', 'Régimen Simple']} value={regimenTributario} onChange={setRegimenTributario} /></Grid.Col>
            <Grid.Col span={4}>
              <Select 
                label="Responsabilidad DIAN" 
                data={[
                  { value: 'No aplica', label: 'No aplica' },
                  { value: 'O-13', label: 'O-13: Gran contribuyente' },
                  { value: 'O-15', label: 'O-15: Autorretenedor' },
                  { value: 'O-23', label: 'O-23: Agente de retención IVA' }
                ]} 
                value={responsabilidadDian} 
                onChange={setResponsabilidadDian} 
              />
            </Grid.Col>
            <Grid.Col span={4}><Select label="Gran contribuyente" data={['Sí', 'No']} value={granContribuyente} onChange={setGranContribuyente} /></Grid.Col>
            <Grid.Col span={4}><Select label="Autorretenedor" data={['Sí', 'No']} value={autorretenedor} onChange={setAutorretenedor} /></Grid.Col>
          </Grid>
        </Box>

        {/* Sección 3 */}
        <Box>
          <Text fw={600} c="violet" mb="sm">3. Información de contacto</Text>
          <Grid>
            <Grid.Col span={4}><TextInput label="Correo electrónico" placeholder="ejemplo@correo.com" type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} /></Grid.Col>
            <Grid.Col span={4}><TextInput label="Teléfono" placeholder="(601) 123 4567" value={telefono} onChange={(e) => setTelefono(e.currentTarget.value)} /></Grid.Col>
            <Grid.Col span={4}><TextInput label="Celular" placeholder="300 123 4567" value={celular} onChange={(e) => setCelular(e.currentTarget.value)} /></Grid.Col>
            <Grid.Col span={4}><TextInput label="Dirección" placeholder="Ingrese la dirección" value={direccion} onChange={(e) => setDireccion(e.currentTarget.value)} /></Grid.Col>
            <Grid.Col span={4}>
              <Select 
                label="Departamento" 
                placeholder="Seleccione..." 
                data={Object.keys(DEPARTAMENTOS)} 
                value={departamento} 
                onChange={setDepartamento} 
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select 
                label="Ciudad" 
                placeholder="Seleccione..." 
                data={departamento ? DEPARTAMENTOS[departamento] : []} 
                value={ciudad} 
                onChange={setCiudad} 
                disabled={!departamento} 
              />
            </Grid.Col>
          </Grid>
        </Box>

        <Group justify="space-between" mt="md">
          <Checkbox 
            label="Inactivo" 
            checked={inactivo} 
            onChange={(e) => setInactivo(e.currentTarget.checked)} 
            disabled={esEmpresaPrincipal}
            color="violet"
          />
          <Group>
            <Button variant="default" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button color="violet" onClick={handleSave} loading={loading}>Guardar cambios</Button>
          </Group>
        </Group>
      </Stack>
      )}
    </Modal>
  );
}
