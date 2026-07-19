import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

interface FormatCurrencyOptions {
  value: number;
}
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);
};

export const generatePdfClientSide = async (config: any, filtros: any, dataset: any[], tenantId: string) => {
  const { paperSize, orientacion, columnasIds, incluirTotales, incluirFirmas, incluirLogo, incluirObservaciones, observacionesTexto } = config;
  
  let empresaData = null;
  let logoBase64: string | null = null;
  try {
    const res = await fetch(`http://localhost:3000/api/configuracion/empresa`, {
      headers: {
        'x-tenant-id': tenantId
      }
    });
    const data = await res.json();
    if (data.success) {
      empresaData = data.data;
    }

    // Try to fetch global info if config is empty
    if (!empresaData) {
      const globalRes = await fetch(`http://localhost:3000/api/empresas/${tenantId}`);
      const globalData = await globalRes.json();
      if (globalData.success) {
        empresaData = {
          razonSocial: globalData.data.razonSocial,
          nit: globalData.data.identificacion,
          direccion: '',
          ciudad: '',
          departamento: '',
          telefono: '',
          email: globalData.data.email,
        };
      }
    }
    
    if (empresaData && empresaData.logoUrl) {
      if (empresaData.logoUrl.startsWith('data:')) {
        logoBase64 = empresaData.logoUrl;
      } else {
        const imgUrl = empresaData.logoUrl.startsWith('http') ? empresaData.logoUrl : `http://localhost:3000${empresaData.logoUrl}`;
        const imgRes = await fetch(imgUrl);
        const blob = await imgRes.blob();
        logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    }
  } catch (e) {
    console.error("Error fetching empresa info for PDF", e);
  }

  // Fetch Firmantes
  let firmantes: any[] = [];
  if (incluirFirmas) {
    try {
      const firmantesRes = await fetch(`http://localhost:3000/api/configuracion/firmantes`, {
        headers: { 'x-tenant-id': tenantId }
      });
      const fData = await firmantesRes.json();
      if (fData.success) {
        firmantes = fData.data;
      }
    } catch (e) {
      console.error("Error fetching firmantes", e);
    }
  }
  
  const empresaName = empresaData && empresaData.razonSocial ? empresaData.razonSocial.toUpperCase() : 'EMPRESA NO CONFIGURADA';
  const empresaNit = empresaData && empresaData.nit ? `NIT: ${empresaData.nit}` : '';
  const empresaDir = empresaData && empresaData.direccion ? empresaData.direccion : '';
  const empresaCiudad = empresaData && empresaData.ciudad && empresaData.departamento ? `${empresaData.ciudad} - ${empresaData.departamento}` : '';
  const empresaTel = empresaData && empresaData.telefono ? `Tel: ${empresaData.telefono}` : '';
  const empresaWeb = empresaData && empresaData.sitioWeb ? empresaData.sitioWeb : (empresaData && empresaData.email ? empresaData.email : '');

  
  // Format is [width, height] in mm. jsPDF uses 'p' or 'l' for orientation
  const format = [paperSize.widthMm, paperSize.heightMm];
  const doc = new jsPDF({
    orientation: orientacion === 'Vertical' ? 'p' : 'l',
    unit: 'mm',
    format: format
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  let startY = 15;

  // Header
  // Logo placeholder
  if (incluirLogo) {
    if (logoBase64) {
      doc.addImage(logoBase64, margin, startY, 15, 15);
    } else {
      doc.setFillColor(34, 61, 142); // Dark blue color similar to the image
      doc.rect(margin, startY, 15, 15, 'F');
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 61, 142);
    doc.text(empresaName, margin + 20, startY + 6);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Soluciones Contables y Administrativas', margin + 20, startY + 12);
  }

  // Company details (Middle)
  const middleX = pageWidth / 2.5;
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(empresaNit, middleX, startY + 2);
  doc.text(empresaDir, middleX, startY + 6);
  doc.text(empresaCiudad, middleX, startY + 10);
  doc.text(empresaTel, middleX, startY + 14);
  doc.text(empresaWeb, middleX, startY + 18);

  // Document Title (Right)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 34, 97);
  const titleText = 'CONSULTA DE MOVIMIENTOS';
  doc.text(titleText, pageWidth - margin, startY + 4, { align: 'right' });
  
  // Doc Info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  
  const periodoText = `Período: ${filtros.fechaInicial ? dayjs(filtros.fechaInicial).format('DD/MM/YYYY') : 'Todos'} - ${filtros.fechaFinal ? dayjs(filtros.fechaFinal).format('DD/MM/YYYY') : 'Todos'}`;
  doc.text(periodoText, pageWidth - margin, startY + 10, { align: 'right' });
  
  let filtrosAdicionales = `Búsqueda por: ${filtros.tipoFiltro}`;
  if (filtros.numeroDocumento) filtrosAdicionales += ` | Doc: ${filtros.numeroDocumento}`;
  if (filtros.naturaleza && filtros.naturaleza !== 'TODOS') filtrosAdicionales += ` | Nat: ${filtros.naturaleza}`;
  if (filtros.estadoDocumento && filtros.estadoDocumento !== 'TODOS') filtrosAdicionales += ` | Est: ${filtros.estadoDocumento}`;
  
  doc.text(filtrosAdicionales, pageWidth - margin, startY + 14, { align: 'right' });
  doc.text('Generado por: Auditor Senior', pageWidth - margin, startY + 18, { align: 'right' });
  doc.text(`Fecha de generación: ${dayjs().format('DD/MM/YYYY hh:mm:ss a')}`, pageWidth - margin, startY + 22, { align: 'right' });
  
  // Separator Line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, startY + 26, pageWidth - margin, startY + 26);

  startY += 32;

  // Table Data
  const ALL_COLUMNS = [
    { id: 'fecha', label: 'Fecha' },
    { id: 'documento', label: 'Documento' },
    { id: 'tipoDoc', label: 'Tipo Doc.' },
    { id: 'cuenta', label: 'Cuenta' },
    { id: 'descripcionCuenta', label: 'Descripción Cuenta' },
    { id: 'concepto', label: 'Concepto' },
    { id: 'tercero', label: 'Tercero' },
    { id: 'centroCosto', label: 'Centro de Costo' },
    { id: 'debito', label: 'Débito' },
    { id: 'credito', label: 'Crédito' },
    { id: 'saldo', label: 'Saldo' }
  ];

  const columns = ALL_COLUMNS.filter(c => columnasIds.includes(c.id));
  const head = [columns.map(c => c.label)];

  const body = dataset.map(row => {
    return columns.map(c => {
      if (c.id === 'fecha') return dayjs(row.fecha).format('DD/MM/YYYY');
      if (c.id === 'tipoDoc') return row.tipoDocumento;
      if (c.id === 'descripcionCuenta') return row.descripcionCuenta;
      if (c.id === 'centroCosto') return row.centroCosto;
      if (c.id === 'debito') return formatCurrency(row.debito);
      if (c.id === 'credito') return formatCurrency(row.credito);
      if (c.id === 'saldo') return formatCurrency(row.saldo);
      return row[c.id] || '-';
    });
  });

  let finalY = startY;

  autoTable(doc, {
    startY: startY,
    head: head,
    body: body,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 34, 97], // Dark blue
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [50, 50, 50]
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    columnStyles: {
      8: { halign: 'right' }, // Debito
      9: { halign: 'right' }, // Credito
      10: { halign: 'right' } // Saldo
    },
    margin: { top: 20, left: margin, right: margin, bottom: 40 },
    didDrawPage: (data) => {
      // Add page number
      const str = `Página: ${(doc as any).internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(str, pageWidth - margin, 10, { align: 'right' }); // Fixed overlapping at the top right

      // Bottom Bar for each page
      doc.setFillColor(15, 34, 97);
      doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text(empresaWeb, margin, pageHeight - 4);
      doc.text('soluciones@accountingpro.com', pageWidth / 2, pageHeight - 4, { align: 'center' });
      doc.text(empresaTel, pageWidth - margin - 20, pageHeight - 4, { align: 'right' });

      // Right vertical text
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(6);
      doc.text('Documento generado electrónicamente - AccountingPro', pageWidth - 5, pageHeight - 20, { angle: 90 });
    }
  });

  finalY = (doc as any).lastAutoTable.finalY + 5;

  // Totals Row
  if (incluirTotales) {
    const totalDebitos = dataset.reduce((acc, r) => acc + (Number(r.debito) || 0), 0);
    const totalCreditos = dataset.reduce((acc, r) => acc + (Number(r.credito) || 0), 0);
    const saldoFinal = totalDebitos - totalCreditos; // Or sum of saldos depending on logic, let's use the image's logic or just calculate from dataset

    // Background for totals row
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, finalY, pageWidth - margin * 2, 8, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 34, 97);
    
    doc.text(`Registros: ${dataset.length}`, margin + 2, finalY + 5);
    
    // Position totals based on approximate columns or center
    doc.text(`Total Débitos: ${formatCurrency(totalDebitos)}`, pageWidth / 2 - 20, finalY + 5, { align: 'center' });
    doc.text(`Total Créditos: ${formatCurrency(totalCreditos)}`, pageWidth / 2 + 30, finalY + 5, { align: 'center' });

    // Saldo final with dark background
    const saldoWidth = 45;
    doc.setFillColor(15, 34, 97);
    doc.rect(pageWidth - margin - saldoWidth, finalY, saldoWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`Saldo Final: ${formatCurrency(saldoFinal)}`, pageWidth - margin - 2, finalY + 5, { align: 'right' });

    finalY += 15;
  }

  // Observaciones
  if (incluirObservaciones && observacionesTexto) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 34, 97);
    doc.text('Observaciones:', margin, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(observacionesTexto, margin, finalY + 4, { maxWidth: pageWidth - margin * 2 });
    
    finalY += 15;
  }

  // Firmas
  if (incluirFirmas) {
    if (finalY + 30 > pageHeight - 40) {
      doc.addPage();
      finalY = 20;
    }

    finalY += 20;
    const signatureWidth = 40;
    
    // Si hay firmantes configurados, usamos esos, de lo contrario dejamos las lineas en blanco
    const signaturesToDraw = firmantes.length > 0 ? firmantes : [
      { cargo: 'Representante Legal' },
      { cargo: 'Contador Público' },
      { cargo: 'Revisor Fiscal' }
    ];

    const numFirmas = signaturesToDraw.length;
    // Calculate total width needed and space between signatures to center them
    const totalSigWidth = (numFirmas * signatureWidth) + ((numFirmas - 1) * 15);
    let startX = (pageWidth - totalSigWidth) / 2;

    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.5);

    signaturesToDraw.forEach((firmante: any, idx: number) => {
      let sigX = startX + (idx * (signatureWidth + 15));
      
      doc.line(sigX, finalY, sigX + signatureWidth, finalY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      if (firmante.tercero) {
        doc.text(`${firmante.tercero.primerNombre || ''} ${firmante.tercero.primerApellido || ''}`.trim(), sigX + signatureWidth / 2, finalY + 4, { align: 'center' });
      } else {
        doc.text('', sigX + signatureWidth / 2, finalY + 4, { align: 'center' });
      }
      
      doc.setFont('helvetica', 'normal');
      doc.text(firmante.cargo || '', sigX + signatureWidth / 2, finalY + 8, { align: 'center' });
      
      if (firmante.tercero) {
        doc.text(`${firmante.tercero.identificacion || ''}`, sigX + signatureWidth / 2, finalY + 12, { align: 'center' });
      }
    });
  }

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};
