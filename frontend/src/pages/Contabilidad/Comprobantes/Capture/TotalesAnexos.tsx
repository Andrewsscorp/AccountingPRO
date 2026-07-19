import React from 'react';
import { Grid, Box, Text, Textarea, Group, ThemeIcon, Flex } from '@mantine/core';
import { IconUpload, IconCheck, IconFile, IconX } from '@tabler/icons-react';
import { Dropzone } from '@mantine/dropzone';

interface TotalesProps {
  comentarios: string;
  setComentarios: (val: string) => void;
  debitoTotal: number;
  creditoTotal: number;
  diferencia: number;
  soporteFiles: File[];
  setSoporteFiles: (files: File[]) => void;
}

export default function TotalesAnexos({ comentarios, setComentarios, debitoTotal, creditoTotal, diferencia, soporteFiles, setSoporteFiles }: TotalesProps) {
  
  const isBalanced = diferencia === 0 && debitoTotal > 0;

  return (
    <Grid gap="md" mt="md">
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Box p="md" style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f1f3f5', height: '100%' }}>
          <Text size="sm" fw={600} mb="xs">Comentarios adicionales</Text>
          <Textarea
            placeholder="Escribe un comentario (opcional)..."
            minRows={4}
            value={comentarios}
            onChange={(e) => setComentarios(e.currentTarget.value)}
            styles={{ input: { backgroundColor: '#f8f9fa', border: 'none' } }}
          />
        </Box>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Box p="md" style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f1f3f5', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Text size="sm" fw={600} mb="xs">Documento Soporte</Text>
          
          <Box style={{ flexGrow: 1, overflowY: 'auto', marginBottom: soporteFiles.length > 0 ? 8 : 0 }}>
            {soporteFiles.map((file, idx) => (
              <Box
                key={idx}
                mb="xs"
                style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Group gap="sm">
                  <ThemeIcon size={32} variant="light" color="blue" radius="md">
                    <IconFile size={16} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" fw={600} truncate w={120}>{file.name}</Text>
                    <Text size="xs" color="dimmed">{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                  </Box>
                </Group>
                <ThemeIcon 
                  size={24} 
                  variant="subtle" 
                  color="red" 
                  radius="xl" 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => setSoporteFiles(soporteFiles.filter((_, i) => i !== idx))}
                >
                  <IconX size={14} />
                </ThemeIcon>
              </Box>
            ))}
          </Box>

          <Dropzone
            onDrop={(files) => setSoporteFiles([...soporteFiles, ...files])}
            onReject={() => console.log('File rejected')}
            maxSize={10 * 1024 ** 2}
            accept={['application/pdf', 'image/png', 'image/jpeg']}
            style={{
              height: soporteFiles.length > 0 ? '60px' : 'calc(100% - 24px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: soporteFiles.length > 0 ? '0' : undefined
            }}
          >
            <Group gap="md" style={{ pointerEvents: 'none' }}>
              <ThemeIcon size={soporteFiles.length > 0 ? 24 : 40} variant="outline" color="violet" radius="md">
                <IconUpload size={soporteFiles.length > 0 ? 14 : 20} />
              </ThemeIcon>
              <Box ta="left">
                <Text size={soporteFiles.length > 0 ? "xs" : "sm"} fw={600}>
                  {soporteFiles.length > 0 ? 'Añadir más archivos' : 'Arrastra o selecciona archivos'}
                </Text>
                {!soporteFiles.length && <Text size="xs" color="dimmed">PDF, JPG, PNG (Máx. 10MB)</Text>}
              </Box>
            </Group>
          </Dropzone>
        </Box>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }}>
        <Box p="xl" style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f1f3f5', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          <Flex justify="space-between" align="center" mb="md">
            <Text fw={600} color="dimmed">Débito Total</Text>
            <Text fw={800} size="xl" c="#1a1b4b">
              $ {debitoTotal.toLocaleString('es-CO')}
            </Text>
          </Flex>

          <Flex justify="space-between" align="center" mb="xl">
            <Text fw={600} color="dimmed">Crédito Total</Text>
            <Text fw={800} size="xl" c="#1a1b4b">
              $ {creditoTotal.toLocaleString('es-CO')}
            </Text>
          </Flex>

          <Box style={{ height: '1px', backgroundColor: '#e9ecef', marginBottom: '24px' }} />

          <Flex justify="space-between" align="center">
            <Text fw={600} color="dimmed">Diferencia</Text>
            <Group gap="xs">
              <Text fw={800} size="xl" color={diferencia === 0 ? 'green' : 'red'}>
                $ {Math.abs(diferencia).toLocaleString('es-CO')}
              </Text>
              {isBalanced && (
                <ThemeIcon color="green.1" size="sm" radius="xl" style={{ color: 'var(--mantine-color-green-7)' }}>
                  <IconCheck size={14} stroke={3} />
                </ThemeIcon>
              )}
            </Group>
          </Flex>

          {isBalanced ? (
             <Text size="sm" color="green" ta="right" mt="xs" fw={600} display="flex" style={{ justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
               <IconCheck size={16} /> Comprobante balanceado
             </Text>
          ) : (
            <Text size="sm" color="red" ta="right" mt="xs" fw={600}>
              Existen diferencias por cruzar
            </Text>
          )}

        </Box>
      </Grid.Col>
    </Grid>
  );
}
