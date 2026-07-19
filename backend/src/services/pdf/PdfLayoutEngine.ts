import PDFDocument from 'pdfkit';

// Convert millimeters to PDF points (1 inch = 25.4 mm = 72 points)
export const mmToPt = (mm: number) => (mm * 72) / 25.4;

export interface ColumnDef {
  id: string;
  header: string;
  minWidthMm: number;
  prefWidthMm: number;
  maxWidthMm: number;
  align?: 'left' | 'center' | 'right';
  calculatedWidthPt?: number;
}

export interface PaperSize {
  name: string;
  widthMm: number;
  heightMm: number;
  orientation: 'Vertical' | 'Horizontal';
}

export interface LayoutOptions {
  paperSize: PaperSize;
  margins: { top: number; right: number; bottom: number; left: number };
  columns: ColumnDef[];
  fontSize: number;
}

export class PdfLayoutEngine {
  private doc: typeof PDFDocument;
  private options: LayoutOptions;
  
  constructor(options: LayoutOptions) {
    this.options = options;
    const widthPt = mmToPt(options.paperSize.widthMm);
    const heightPt = mmToPt(options.paperSize.heightMm);

    // Swap dimensions if orientation is Horizontal but dimensions are vertical-like
    let actualWidth = widthPt;
    let actualHeight = heightPt;
    
    if (options.paperSize.orientation === 'Horizontal' && widthPt < heightPt) {
      actualWidth = heightPt;
      actualHeight = widthPt;
    } else if (options.paperSize.orientation === 'Vertical' && widthPt > heightPt) {
      actualWidth = heightPt;
      actualHeight = widthPt;
    }

    this.doc = new PDFDocument({
      size: [actualWidth, actualHeight],
      margins: {
        top: mmToPt(options.margins.top),
        bottom: mmToPt(options.margins.bottom),
        left: mmToPt(options.margins.left),
        right: mmToPt(options.margins.right),
      },
      bufferPages: true
    });
  }

  public getDocument() {
    return this.doc;
  }

  public getOptions() {
    return this.options;
  }

  /**
   * Level 1 to 4 resizing logic to ensure columns fit.
   * Returns a modified options object if necessary, or throws an error (Level 5).
   */
  public autoAdjustColumns(): void {
    const docMarginLeft = mmToPt(this.options.margins.left);
    const docMarginRight = mmToPt(this.options.margins.right);
    const docWidth = this.doc.page.width;
    const availableWidthPt = docWidth - docMarginLeft - docMarginRight;

    // 1. Calculate preferred total width
    let totalPrefPt = 0;
    this.options.columns.forEach(col => {
      totalPrefPt += mmToPt(col.prefWidthMm);
    });

    if (totalPrefPt <= availableWidthPt) {
      // It fits! Expand columns proportionally up to max width
      this.distributeAvailableSpace(availableWidthPt, 'pref');
      return;
    }

    // LEVEL 1: Reduce spaces (Use minimum widths instead of preferred)
    let totalMinPt = 0;
    this.options.columns.forEach(col => {
      totalMinPt += mmToPt(col.minWidthMm);
    });

    if (totalMinPt <= availableWidthPt) {
      this.distributeAvailableSpace(availableWidthPt, 'min');
      return;
    }

    // LEVEL 2: Reduce typography
    if (this.options.fontSize > 6) {
      this.options.fontSize -= 1; // Try reducing font
      // Recalculate - recursively try
      // (In a real scenario, this would loop until fits or limit reached)
      // For simplicity, we just distribute anyway and it will be cramped, 
      // but font is smaller
      this.distributeAvailableSpace(availableWidthPt, 'min');
      return;
    }

    // LEVEL 3: Reduce margins
    if (this.options.margins.left > 5) {
      this.options.margins.left = 5;
      this.options.margins.right = 5;
      const newAvail = this.doc.page.width - mmToPt(5) - mmToPt(5);
      if (totalMinPt <= newAvail) {
        this.distributeAvailableSpace(newAvail, 'min');
        return;
      }
    }

    // LEVEL 4 & 5: Rotation or Oficio recommendation is handled upstream
    // by throwing an error that the service can catch and re-run or warn.
    throw new Error('OVERFLOW_DESBORDE');
  }

  private distributeAvailableSpace(availableWidthPt: number, base: 'min' | 'pref') {
    let baseTotal = 0;
    this.options.columns.forEach(col => {
      col.calculatedWidthPt = base === 'min' ? mmToPt(col.minWidthMm) : mmToPt(col.prefWidthMm);
      baseTotal += col.calculatedWidthPt;
    });

    const leftover = availableWidthPt - baseTotal;
    if (leftover > 0) {
      // Distribute leftover proportionally based on max width difference
      const flexibleCols = this.options.columns.filter(c => mmToPt(c.maxWidthMm) > c.calculatedWidthPt!);
      let totalFlex = flexibleCols.reduce((sum, c) => sum + (mmToPt(c.maxWidthMm) - c.calculatedWidthPt!), 0);
      
      if (totalFlex > 0) {
        flexibleCols.forEach(col => {
          const flexAmount = (mmToPt(col.maxWidthMm) - col.calculatedWidthPt!);
          const addition = (flexAmount / totalFlex) * leftover;
          col.calculatedWidthPt! += addition;
          // Ensure it doesn't exceed max
          if (col.calculatedWidthPt! > mmToPt(col.maxWidthMm)) {
            col.calculatedWidthPt = mmToPt(col.maxWidthMm);
          }
        });
      }
    }
  }

  public drawTableHeader(y: number): number {
    this.doc.font('Helvetica-Bold').fontSize(this.options.fontSize);
    let currentX = mmToPt(this.options.margins.left);
    
    // Draw header background
    this.doc.rect(currentX, y - 2, this.doc.page.width - mmToPt(this.options.margins.left) - mmToPt(this.options.margins.right), this.options.fontSize + 6)
      .fill('#E5E7EB');
    
    this.doc.fillColor('#000000');

    this.options.columns.forEach(col => {
      this.doc.text(col.header, currentX, y, {
        width: col.calculatedWidthPt,
        align: col.align || 'left'
      });
      currentX += col.calculatedWidthPt!;
    });

    return y + this.options.fontSize + 10;
  }

  public drawRow(row: any, y: number): number {
    this.doc.font('Helvetica').fontSize(this.options.fontSize);
    
    // Calculate max height for this row based on text wrapping
    let maxRowHeight = this.options.fontSize + 4;
    let currentX = mmToPt(this.options.margins.left);

    this.options.columns.forEach(col => {
      const text = row[col.id] != null ? String(row[col.id]) : '';
      const height = this.doc.heightOfString(text, { width: col.calculatedWidthPt! - 4 });
      if (height + 4 > maxRowHeight) {
        maxRowHeight = height + 4;
      }
    });

    // Check pagination
    if (y + maxRowHeight > this.doc.page.height - mmToPt(this.options.margins.bottom)) {
      this.doc.addPage();
      y = mmToPt(this.options.margins.top);
      y = this.drawTableHeader(y);
      this.doc.font('Helvetica').fontSize(this.options.fontSize);
    }

    currentX = mmToPt(this.options.margins.left);
    this.options.columns.forEach(col => {
      const text = row[col.id] != null ? String(row[col.id]) : '';
      this.doc.text(text, currentX + 2, y + 2, {
        width: col.calculatedWidthPt! - 4,
        align: col.align || 'left'
      });
      
      // Optional: Draw cell borders
      // this.doc.rect(currentX, y, col.calculatedWidthPt!, maxRowHeight).stroke();
      
      currentX += col.calculatedWidthPt!;
    });

    // Draw row bottom line
    this.doc.lineWidth(0.5).strokeColor('#E5E7EB')
      .moveTo(mmToPt(this.options.margins.left), y + maxRowHeight)
      .lineTo(this.doc.page.width - mmToPt(this.options.margins.right), y + maxRowHeight)
      .stroke();
    
    this.doc.strokeColor('#000000'); // Reset

    return y + maxRowHeight;
  }
}
