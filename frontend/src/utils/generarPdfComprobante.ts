import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import { PDFDocument } from 'pdf-lib';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);
};

// Helper function to load an image from URL and convert to Base64 so jsPDF can use it
const getBase64ImageFromUrl = async (imageUrl: string): Promise<{ dataUrl: string, width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Handle CORS if the image is from an external source
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        // Assuming JPEG or PNG, toDataURL determines the format
        const dataURL = canvas.toDataURL('image/png');
        resolve({ dataUrl: dataURL, width: img.width, height: img.height });
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = imageUrl;
  });
};

export const generarPdfComprobante = async (empresa: any, comprobante: any) => {
  const doc = new jsPDF('p', 'pt', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Encabezado Empresa
  let startHeaderY = 40;
  
  if (empresa?.logoUrl) {
    try {
      // Build full URL for logo
      const fullLogoUrl = empresa.logoUrl.startsWith('http') ? empresa.logoUrl : `http://localhost:3000${empresa.logoUrl}`;
      const imgRes = await getBase64ImageFromUrl(fullLogoUrl);
      // Parameters: base64, format, x, y, width, height. Width/Height hardcoded to 50x50 approx.
      doc.addImage(imgRes.dataUrl, 'PNG', 40, 30, 50, 50);
      startHeaderY = 100; // Move text down if logo exists
    } catch (e) {
      console.warn("No se pudo cargar el logo de la empresa para el PDF", e);
    }
  }
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(empresa?.razonSocial || empresa?.nombre_empresa || 'Empresa Generica', 40, startHeaderY);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIT: ` + (empresa?.nit || ''), 40, startHeaderY + 15);
  doc.text(`Dirección: ` + (empresa?.direccion || ''), 40, startHeaderY + 30);
  if (empresa?.telefono) doc.text(`Teléfono: ` + empresa.telefono, 40, startHeaderY + 45);
  if (empresa?.email) doc.text(`Email: ` + empresa.email, 40, startHeaderY + 60);
  
  // Titulo Comprobante
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`COMPROBANTE CONTABLE`, pageWidth - 40, 40, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número: ` + comprobante.numero, pageWidth - 40, 55, { align: 'right' });
  doc.text(`Fecha: ` + dayjs(comprobante.fecha).format('DD/MM/YYYY'), pageWidth - 40, 70, { align: 'right' });

  // Tercero Principal (del primer movimiento que lo tenga)
  let topTableY = Math.max(startHeaderY + 80, 110);
  const principalTercero = comprobante.movimientos.find((m: any) => m.terceroRef)?.terceroRef;
  
  if (principalTercero) {
    let terceroY = 90;
    doc.setFont('helvetica', 'bold');
    doc.text(`A nombre de:`, pageWidth - 40, terceroY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    const name = principalTercero.razonSocial || principalTercero.nombreComercial || `${principalTercero.nombre1 || ''} ${principalTercero.apellido1 || ''}`.trim();
    terceroY += 12;
    doc.text(`${name} - ${principalTercero.identificacion}`, pageWidth - 40, terceroY, { align: 'right' });
    
    if (principalTercero.direccion || principalTercero.ciudad) {
      terceroY += 12;
      const ubicacion = [principalTercero.direccion, principalTercero.ciudad].filter(Boolean).join(', ');
      doc.text(ubicacion, pageWidth - 40, terceroY, { align: 'right' });
    }
    
    if (principalTercero.telefono || principalTercero.email) {
      terceroY += 12;
      const contacto = [principalTercero.telefono, principalTercero.email].filter(Boolean).join(' | ');
      doc.text(contacto, pageWidth - 40, terceroY, { align: 'right' });
    }
    
    topTableY = Math.max(topTableY, terceroY + 30);
  }
  
  // Concepto
  doc.setFont('helvetica', 'bold');
  doc.text(`Concepto General:`, 40, topTableY);
  doc.setFont('helvetica', 'normal');
  const splitConcepto = doc.splitTextToSize(comprobante.concepto || '', pageWidth - 100);
  doc.text(splitConcepto, 140, topTableY);
  
  let startY = topTableY + (splitConcepto.length * 12) + 10;
  
  // Tabla de Movimientos
  const bodyData = comprobante.movimientos.map((m: any, i: number) => {
    let terceroStr = '';
    if (m.terceroRef) {
      terceroStr = `${m.terceroRef.identificacion || ''} - ${m.terceroRef.razonSocial || m.terceroRef.nombreComercial || m.terceroRef.nombres || ''}`;
    }
    return [
      (i + 1).toString(),
      m.cuentaRef ? m.cuentaRef.codigo : '',
      m.cuentaRef ? m.cuentaRef.nombre : '',
      terceroStr,
      m.centroCostoRef ? m.centroCostoRef.codigo : '',
      m.debito ? formatCurrency(Number(m.debito)) : '$ 0',
      m.credito ? formatCurrency(Number(m.credito)) : '$ 0',
      m.observacion || ''
    ];
  });
  
  autoTable(doc, {
    startY,
    head: [['#', 'Cuenta', 'Nombre', 'Tercero', 'C.C.', 'Débito', 'Crédito', 'Detalle']],
    body: bodyData,
    theme: 'grid',
    headStyles: { fillColor: [92, 60, 230] }, // Violeta Mantine
    styles: { fontSize: 8 },
    columnStyles: {
      5: { halign: 'right' },
      6: { halign: 'right' }
    }
  });
  
  let finalY = (doc as any).lastAutoTable.finalY + 20;
  
  // Totales
  const totalDebito = comprobante.movimientos.reduce((acc: number, m: any) => acc + (Number(m.debito) || 0), 0);
  const totalCredito = comprobante.movimientos.reduce((acc: number, m: any) => acc + (Number(m.credito) || 0), 0);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Débitos: ${formatCurrency(totalDebito)}`, pageWidth / 2, finalY, { align: 'right' });
  doc.text(`Total Créditos: ${formatCurrency(totalCredito)}`, pageWidth - 40, finalY, { align: 'right' });
  
  finalY += 30;

  // Comentarios Adicionales
  if (comprobante.comentarios) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Comentarios Adicionales:`, 40, finalY);
    doc.setFont('helvetica', 'normal');
    const splitComentarios = doc.splitTextToSize(comprobante.comentarios, pageWidth - 80);
    doc.text(splitComentarios, 40, finalY + 15);
    finalY += (splitComentarios.length * 12) + 25;
  }
  
  // Firmas
  const lineY = finalY + 60;
  // Solo imprimir firmas si caben en la pagina actual
  if (lineY < doc.internal.pageSize.getHeight() - 40) {
    doc.setLineWidth(0.5);
    doc.line(40, lineY, 180, lineY);
    doc.text('Elaborado por', 110, lineY + 15, { align: 'center' });
    
    doc.line(220, lineY, 360, lineY);
    doc.text('Revisado por', 290, lineY + 15, { align: 'center' });
    
    doc.line(400, lineY, 540, lineY);
    doc.text('Aprobado por', 470, lineY + 15, { align: 'center' });
  }
  
  // Anexar Documentos Soporte si existen
  if (comprobante.documentosSoporte && comprobante.documentosSoporte.length > 0) {
    let mainPdfBytes: Uint8Array | null = null;
    let currentJsPdfBlob = doc.output('arraybuffer');

    // Inicializamos el documento base con pdf-lib (que contiene la tabla generada por jsPDF)
    let mainPdfDoc = await PDFDocument.load(currentJsPdfBlob);

    for (const docSoporte of comprobante.documentosSoporte) {
      const fileUrl = `http://localhost:3000/${docSoporte.rutaArchivo.replace(/\\/g, '/')}`;
      
      try {
        const resp = await fetch(fileUrl);
        if (!resp.ok) {
          console.error(`Fallo al obtener el anexo: ${fileUrl} (Status: ${resp.status})`);
          continue;
        }
        
        const fileBuffer = await resp.arrayBuffer();

        if (docSoporte.mimeType === 'application/pdf') {
          const attachmentPdfDoc = await PDFDocument.load(fileBuffer);
          const copiedPages = await mainPdfDoc.copyPages(attachmentPdfDoc, attachmentPdfDoc.getPageIndices());
          copiedPages.forEach((page) => {
            mainPdfDoc.addPage(page);
          });
        } else if (docSoporte.mimeType.startsWith('image/')) {
          // Para imágenes, creamos una página nueva en pdf-lib
          // Nota: ya no usamos jsPDF porque el documento base ahora está en pdf-lib
          const image = docSoporte.mimeType === 'image/png' 
            ? await mainPdfDoc.embedPng(fileBuffer)
            : await mainPdfDoc.embedJpg(fileBuffer);

          const { width, height } = image.scale(1);
          const page = mainPdfDoc.addPage();
          const { width: pageWidth, height: pageHeight } = page.getSize();
          
          const maxWidth = pageWidth - 80;
          const maxHeight = pageHeight - 80;
          
          let w = width;
          let h = height;
          
          if (w > maxWidth || h > maxHeight) {
            const ratio = Math.min(maxWidth / w, maxHeight / h);
            w = w * ratio;
            h = h * ratio;
          }
          
          page.drawImage(image, {
            x: 40,
            y: pageHeight - h - 40, // pdf-lib y-axis starts from bottom
            width: w,
            height: h
          });
        }
      } catch (e) {
        console.error(`Error al procesar el anexo ${docSoporte.nombreOriginal}:`, e);
      }
    }
    
    const mergedPdfBytes = await mainPdfDoc.save();
    return new Blob([mergedPdfBytes], { type: 'application/pdf' });
  }

  return doc.output('blob');
};
