import { PdfLayoutEngine, LayoutOptions, ColumnDef, PaperSize, mmToPt } from './PdfLayoutEngine';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';

export interface ReportConfig {
  tenantId: string;
  filtros: any; // e.g. { tipoFiltro, cuentaId, terceroId, fechaInicial, fechaFinal... }
  columnasIds: string[]; // IDs of columns to include
  paperSize: PaperSize;
  incluirTotales: boolean;
  incluirFirmas: boolean;
  incluirLogo: boolean;
  incluirObservaciones: boolean;
  observacionesTexto?: string;
  ordenarPor: string;
  orientacion: 'Vertical' | 'Horizontal';
}

const ALL_COLUMNS: ColumnDef[] = [
  { id: 'fecha', header: 'Fecha', minWidthMm: 15, prefWidthMm: 22, maxWidthMm: 25 },
  { id: 'documento', header: 'Documento', minWidthMm: 25, prefWidthMm: 35, maxWidthMm: 45 },
  { id: 'tipoDoc', header: 'Tipo Doc.', minWidthMm: 15, prefWidthMm: 20, maxWidthMm: 25 },
  { id: 'cuenta', header: 'Cuenta', minWidthMm: 15, prefWidthMm: 20, maxWidthMm: 25 },
  { id: 'descripcionCuenta', header: 'Descripción Cuenta', minWidthMm: 30, prefWidthMm: 50, maxWidthMm: 80 },
  { id: 'concepto', header: 'Concepto', minWidthMm: 30, prefWidthMm: 50, maxWidthMm: 80 },
  { id: 'tercero', header: 'Tercero', minWidthMm: 30, prefWidthMm: 50, maxWidthMm: 80 },
  { id: 'centroCosto', header: 'Centro de Costo', minWidthMm: 20, prefWidthMm: 30, maxWidthMm: 50 },
  { id: 'debito', header: 'Débito', minWidthMm: 20, prefWidthMm: 25, maxWidthMm: 30, align: 'right' },
  { id: 'credito', header: 'Crédito', minWidthMm: 20, prefWidthMm: 25, maxWidthMm: 30, align: 'right' },
  { id: 'saldo', header: 'Saldo', minWidthMm: 25, prefWidthMm: 30, maxWidthMm: 35, align: 'right' }
];

export class PdfReportService {
  public static async generarReporte(prisma: PrismaTenant, config: ReportConfig, data: any[], totals: any): Promise<Buffer> {
    
    // 1. Fetch Company Data
    const empresa = await prisma.configuracionEmpresa.findFirst();
    if (!empresa) throw new Error('Configuración de empresa no encontrada');

    // 2. Map Columns
    const activeColumns = ALL_COLUMNS.filter(c => config.columnasIds.includes(c.id));
    if (activeColumns.length === 0) throw new Error('Debe seleccionar al menos una columna');

    // 3. Setup Engine Options
    const options: LayoutOptions = {
      paperSize: { ...config.paperSize, orientation: config.orientacion },
      margins: { top: 15, right: 15, bottom: 20, left: 15 },
      columns: activeColumns,
      fontSize: 8
    };

    const engine = new PdfLayoutEngine(options);

    // Auto Adjust
    engine.autoAdjustColumns();

    const doc = engine.getDocument();
    
    // Prepare Buffer collection
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    const result = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    // START DRAWING //
    const pageWidth = doc.page.width;
    const marginL = mmToPt(options.margins.left);
    const marginR = mmToPt(options.margins.right);
    let y = mmToPt(options.margins.top);

    // Encabezado Corporativo
    if (config.incluirLogo && empresa.logoUrl) {
      // Logic for drawing logo would go here (fetch image, etc)
      // We skip real fetch for now to avoid network delay, placeholder box
      doc.rect(marginL, y, 40, 40).stroke();
      doc.text('LOGO', marginL + 5, y + 15);
    }

    const headerX = config.incluirLogo ? marginL + 50 : marginL;
    doc.font('Helvetica-Bold').fontSize(14).text(empresa.razonSocial, headerX, y);
    doc.font('Helvetica').fontSize(10).text(`NIT: ${empresa.nit}-${empresa.dv}`, headerX, y + 16);
    doc.text(`${empresa.direccion} - ${empresa.ciudad}`, headerX, y + 28);
    
    doc.font('Helvetica-Bold').fontSize(12).text('CONSULTA DE MOVIMIENTOS', marginL, y, { align: 'right' });
    
    // Filtros Info
    doc.font('Helvetica').fontSize(8);
    let filterY = y + 20;
    doc.text(`Periodo: ${config.filtros.fechaInicial || ''} - ${config.filtros.fechaFinal || ''}`, marginL, filterY, { align: 'right' });
    doc.text(`Consultado por: ${config.filtros.tipoFiltro}`, marginL, filterY + 10, { align: 'right' });
    doc.text(`Generado el: ${new Date().toLocaleString()}`, marginL, filterY + 20, { align: 'right' });

    y = Math.max(y + 50, filterY + 40);

    // Tabla Headers
    y = engine.drawTableHeader(y);

    // Rows
    for (const row of data) {
      const mappedRow: any = {
        fecha: new Date(row.comprobante.fecha).toLocaleDateString(),
        documento: `${row.comprobante.tipoDocumento.codigo}-${row.comprobante.numero}`,
        tipoDoc: row.comprobante.tipoDocumento.codigo,
        cuenta: row.cuenta.codigo,
        descripcionCuenta: row.cuenta.nombre,
        concepto: row.descripcion || row.comprobante.concepto,
        tercero: row.tercero ? `${row.tercero.identificacion} - ${row.tercero.razonSocial || (row.tercero.nombre1 + ' ' + row.tercero.apellido1)}` : '',
        centroCosto: row.centroCosto ? `${row.centroCosto.codigo}` : '',
        debito: row.debito > 0 ? row.debito.toLocaleString('es-CO', { minimumFractionDigits: 2 }) : '0,00',
        credito: row.credito > 0 ? row.credito.toLocaleString('es-CO', { minimumFractionDigits: 2 }) : '0,00',
        saldo: row.saldo !== undefined ? row.saldo.toLocaleString('es-CO', { minimumFractionDigits: 2 }) : ''
      };
      y = engine.drawRow(mappedRow, y);
    }

    // Totales
    if (config.incluirTotales) {
      y += 10;
      doc.rect(marginL, y, pageWidth - marginL - marginR, 20).stroke('#E5E7EB');
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text(`REGISTROS: ${totals.registros}`, marginL + 5, y + 6);
      
      const w3 = (pageWidth - marginL - marginR) / 3;
      doc.text(`TOTAL DÉBITOS: $ ${totals.debitos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, marginL + w3, y + 6, { align: 'center', width: w3 });
      doc.text(`TOTAL CRÉDITOS: $ ${totals.creditos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, marginL + w3 * 2, y + 6, { align: 'right', width: w3 - 5 });
      y += 30;
    }

    // Observaciones
    if (config.incluirObservaciones && config.observacionesTexto) {
      y += 10;
      doc.font('Helvetica').fontSize(8);
      doc.text('Observaciones:', marginL, y);
      doc.text(config.observacionesTexto, marginL, y + 10, { width: pageWidth - marginL - marginR });
      y += 30;
    }

    // Firmas
    if (config.incluirFirmas) {
      y += 30;
      const firmas = await prisma.firmaUsuario.findMany({ where: { estado: 'ACTIVO' } });
      const signatureWidth = 150;
      const spacing = ((pageWidth - marginL - marginR) - (firmas.length * signatureWidth)) / (firmas.length + 1);
      
      let sigX = marginL + spacing;
      for (const firma of firmas) {
        // Line
        doc.moveTo(sigX, y + 30).lineTo(sigX + signatureWidth, y + 30).strokeColor('#000000').stroke();
        
        doc.font('Helvetica-Bold').fontSize(8);
        doc.text(firma.nombre.toUpperCase(), sigX, y + 35, { width: signatureWidth, align: 'center' });
        doc.font('Helvetica').fontSize(7);
        doc.text(firma.cargo, sigX, y + 45, { width: signatureWidth, align: 'center' });
        if (firma.tarjetaProfesional) {
          doc.text(`TP ${firma.tarjetaProfesional}`, sigX, y + 55, { width: signatureWidth, align: 'center' });
        }
        sigX += signatureWidth + spacing;
      }
    }

    // Pagination numbers at the bottom (We must do this at the end if we want x of y)
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.font('Helvetica').fontSize(7);
      doc.text(
        `Generado por: AccountingPro - Página ${i + 1} de ${pages.count}`,
        marginL,
        doc.page.height - 15,
        { width: pageWidth - marginL - marginR, align: 'center' }
      );
    }

    doc.end();
    return result;
  }
}
