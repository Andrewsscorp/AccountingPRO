import React from 'react';
import { Grid, Box, Text, Textarea, Group, ThemeIcon, Badge, Flex } from '@mantine/core';
import { IconUpload, IconCheck } from '@tabler/icons-react';

interface TotalesProps {
  comentarios: string;
  setComentarios: (val: string) => void;
  debitoTotal: number;
  creditoTotal: number;
  diferencia: number;
}

export default function TotalesAnexos({ comentarios, setComentarios, debitoTotal, creditoTotal, diferencia }: TotalesProps) {
  
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
        <Box p="md" style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f1f3f5', height: '100%' }}>
          <Text size="sm" fw={600} mb="xs">Documento Soporte</Text>
          <Box
            style={{
              border: '2px dashed #e9ecef',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer',
              height: 'calc(100% - 24px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Group gap="md">
              <ThemeIcon size={40} variant="outline" color="violet" radius="md">
                <IconUpload size={20} />
              </ThemeIcon>
              <Box ta="left">
                <Text size="sm" fw={600}>Arrastra o selecciona un archivo</Text>
                <Text size="xs" color="dimmed">PDF, JPG, PNG (Máx. 10MB)</Text>
              </Box>
            </Group>
          </Box>
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
