import React, { useEffect, useState } from 'react';
import { Modal, Button, Group, Text, Stack } from '@mantine/core';
import { IconPrinter, IconDownload, IconCheck, IconEye } from '@tabler/icons-react';
import { generarPdfComprobante } from '../../utils/generarPdfComprobante';

interface PostSaveModalProps {
  opened: boolean;
  onClose: () => void;
  comprobante: any;
  empresa: any;
}

export default function PostSaveModal({ opened, onClose, comprobante, empresa }: PostSaveModalProps) {
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);

  useEffect(() => {
    if (opened && comprobante) {
      generarPdfComprobante(empresa, comprobante).then((blob) => {
        setPdfBlob(URL.createObjectURL(blob));
      });
    }
  }, [opened, comprobante, empresa]);

  const handlePrint = () => {
    if (!comprobante) return;
    generarPdfComprobante(empresa, comprobante).then((blob) => {
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    });
  };

  const handleDownload = () => {
    if (!comprobante) return;
    generarPdfComprobante(empresa, comprobante).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Comprobante_${comprobante.numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={<Group><IconCheck color="green" /><Text fw={700} c="green">Comprobante guardado con éxito</Text></Group>}
      size="xl"
      centered
      closeOnClickOutside={false}
      closeOnEscape={true}
    >
      <Stack mt="md">
        <Text>¿Qué deseas hacer con el comprobante <b>{comprobante?.numero}</b>?</Text>
        
        <Group mt="md" grow>
          <Button variant="outline" color="violet" leftSection={<IconPrinter size={18} />} onClick={handlePrint}>
            Imprimir
          </Button>
          <Button variant="outline" color="blue" leftSection={<IconDownload size={18} />} onClick={handleDownload}>
            Descargar PDF
          </Button>
          <Button variant="filled" color="gray" onClick={onClose}>
            Continuar Capturando
          </Button>
        </Group>

        {pdfBlob && (
          <div style={{ height: '60vh', marginTop: 20 }}>
            <iframe src={pdfBlob} width="100%" height="100%" style={{ border: 'none', borderRadius: 8 }}></iframe>
          </div>
        )}
      </Stack>
    </Modal>
  );
}
