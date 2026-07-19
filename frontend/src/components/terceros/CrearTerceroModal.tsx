import { useState, useEffect } from 'react';
import { Modal, Group, Button, Stack, TextInput, Select, Grid, Checkbox, Text, Radio, Box } from '@mantine/core';

interface CrearTerceroModalProps {
  opened: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

const DEPARTAMENTOS: Record<string, string[]> = {
  'Antioquia': ['Medellín', 'Bello', 'Envigado', 'Itagüí', 'Rionegro', 'Apartadó'],
  'Cundinamarca': ['Bogotá D.C.', 'Soacha', 'Chía', 'Zipaquirá', 'Facatativá'],
  'Valle del Cauca': ['Cali', 'Buenaventura', 'Palmira', 'Buga', 'Tuluá'],
  'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanagrande'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta'],
};

export default function CrearTerceroModal({ opened, onClose, tenantId, onSuccess }: CrearTerceroModalProps) {
  const [loading, setLoading] = useState(false);
  
  // 1. Información básica
  const [tipoTercero, setTipoTercero] = useState<string | null>(null);
  const [tipoIdentificacion, setTipoIdentificacion] = useState<string | null>(null);
  const [identificacion, setIdentificacion] = useState('');
  const [dv, setDv] = useState('');
  const [tipoPersona, setTipoPersona] = useState('NATURAL');

  // 2. Información personal
  const [nombre1, setNombre1] = useState('');
  const [nombre2, setNombre2] = useState('');
  const [apellido1, setApellido1] = useState('');
  const [apellido2, setApellido2] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');

  // 3. Información de contacto
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [celular, setCelular] = useState('');
  const [direccion, setDireccion] = useState('');
  const [departamento, setDepartamento] = useState<string | null>(null);
  const [ciudad, setCiudad] = useState<string | null>(null);
  const [inactivo, setInactivo] = useState(false);

  // Auto-calcular DV
  const calculateDV = (nitStr: string) => {
    const nitClean = nitStr.replace(/\D/g, '');
    if (!nitClean) {
      setDv('');
      return;
    }
    const vpri = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    let x = 0;
    let y = 0;
    let z = nitClean.length;
    for (let i = 0; i < z; i++) {
      y = parseInt(nitClean.charAt(i), 10);
      x += (y * vpri[z - 1 - i]);
    }
    y = x % 11;
    setDv(y > 1 ? (11 - y).toString() : y.toString());
  };

  const handleIdentificacionChange = (val: string) => {
    setIdentificacion(val);
    if (tipoIdentificacion === 'NIT') {
      calculateDV(val);
    }
  };

  useEffect(() => {
    if (tipoIdentificacion !== 'NIT') {
      setDv('');
    } else {
      calculateDV(identificacion);
    }
  }, [tipoIdentificacion, identificacion]);

  useEffect(() => {
    setCiudad(null);
  }, [departamento]);

  const handleSave = async () => {
    if (!tipoTercero) return alert('El Tipo de Tercero es obligatorio.');
    if (!tipoIdentificacion) return alert('El Tipo de Documento es obligatorio.');
    if (!identificacion) return alert('El Número de Documento es obligatorio.');
    
    if (tipoPersona === 'NATURAL' && (!nombre1 || !apellido1)) {
      return alert('El primer nombre y el primer apellido son obligatorios.');
    }
    if (tipoPersona === 'JURIDICA' && !razonSocial) {
      return alert('La razón social es obligatoria.');
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/terceros/${tenantId}/terceros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoPersona,
          tipoIdentificacion,
          identificacion,
          dv: tipoIdentificacion === 'NIT' ? dv : null,
          razonSocial: tipoPersona === 'JURIDICA' ? razonSocial : null,
          nombreComercial: tipoPersona === 'JURIDICA' ? nombreComercial : null,
          nombre1: tipoPersona === 'NATURAL' ? nombre1 : null,
          nombre2: tipoPersona === 'NATURAL' ? nombre2 : null,
          apellido1: tipoPersona === 'NATURAL' ? apellido1 : null,
          apellido2: tipoPersona === 'NATURAL' ? apellido2 : null,
          direccion,
          telefono,
          celular,
          email,
          pais: 'Colombia',
          departamento,
          ciudad,
          activa: !inactivo,
          roles: [tipoTercero]
        })
      });
      const json = await res.json();
      if (json.success) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        alert(json.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error creando el tercero.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTipoTercero(null);
    setTipoIdentificacion(null);
    setIdentificacion('');
    setDv('');
    setTipoPersona('NATURAL');
    setNombre1('');
    setNombre2('');
    setApellido1('');
    setApellido2('');
    setRazonSocial('');
    setNombreComercial('');
    setEmail('');
    setTelefono('');
    setCelular('');
    setDireccion('');
    setDepartamento(null);
    setCiudad(null);
    setInactivo(false);
  };

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700} size="xl">Nuevo Tercero</Text>} size="xl" centered>
      <Stack gap="lg">
        {/* Sección 1 */}
        <Box>
          <Text fw={600} c="violet" mb="sm">1. Información básica</Text>
          <Grid>
            <Grid.Col span={6}>
              <Select 
                label="Tipo de tercero" 
                placeholder="Seleccione..." 
                data={['CLIENTE', 'PROVEEDOR', 'EMPLEADO', 'SOCIO', 'ACCIONISTA', 'BANCO', 'ENTIDAD PÚBLICA', 'CONTRATISTA', 'OTRO']} 
                value={tipoTercero} 
                onChange={setTipoTercero} 
                required 
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select 
                label="Tipo de documento" 
                placeholder="Seleccione..." 
                data={['CC', 'CE', 'TI', 'NIT', 'PASAPORTE', 'PEP', 'NIT EXTRANJERO', 'OTRO']} 
                value={tipoIdentificacion} 
                onChange={setTipoIdentificacion} 
                required 
              />
            </Grid.Col>
            <Grid.Col span={tipoIdentificacion === 'NIT' ? 8 : 12}>
              <TextInput 
                label="Número de documento" 
                placeholder="Ingrese el número" 
                value={identificacion} 
                onChange={(e) => handleIdentificacionChange(e.currentTarget.value)} 
                required 
              />
            </Grid.Col>
            {tipoIdentificacion === 'NIT' && (
              <Grid.Col span={4}>
                <TextInput label="Dígito de verificación" placeholder="DV" value={dv} readOnly disabled />
              </Grid.Col>
            )}
            <Grid.Col span={12} mt="xs">
              <Radio.Group value={tipoPersona} onChange={setTipoPersona}>
                <Group gap="xl">
                  <Radio value="NATURAL" label="Persona Natural" color="violet" />
                  <Radio value="JURIDICA" label="Persona Jurídica" color="violet" />
                </Group>
              </Radio.Group>
            </Grid.Col>
          </Grid>
        </Box>

        {/* Sección 2 */}
        <Box>
          <Text fw={600} c="violet" mb="sm">2. Información personal</Text>
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
            label="Marcar como inactivo" 
            checked={inactivo} 
            onChange={(e) => setInactivo(e.currentTarget.checked)} 
            color="violet"
          />
          <Group>
            <Button variant="default" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button color="violet" onClick={handleSave} loading={loading}>Guardar</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
