import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';

export class PdfExportService {
  public static async registrarYGuardar(
    prisma: PrismaTenant,
    tenantId: string,
    usuarioId: string,
    tipoReporte: string,
    filtros: any,
    columnas: string[],
    totalRegistros: number,
    pdfBuffer: Buffer
  ): Promise<{ uuid: string; rutaArchivo: string; hash: string }> {
    
    const fileUuid = crypto.randomUUID();
    const hashSum = crypto.createHash('sha256');
    hashSum.update(pdfBuffer);
    const hexHash = hashSum.digest('hex');

    // Create tenant specific folder
    const uploadDir = path.join(process.cwd(), 'uploads', tenantId, 'reportes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${tipoReporte}_${fileUuid}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    // Save to disk
    fs.writeFileSync(filePath, pdfBuffer);

    // Register in DB
    await prisma.$transaction([
      prisma.auditoriaReporte.create({
        data: {
          uuid: fileUuid,
          usuarioId,
          tipoReporte,
          filtros: JSON.stringify(filtros),
          columnas: JSON.stringify(columnas),
          totalRegistros,
          hash: hexHash
        }
      }),
      prisma.reporteGenerado.create({
        data: {
          uuid: fileUuid,
          usuarioId,
          tipoReporte,
          parametrosJson: JSON.stringify({ filtros, columnas }),
          rutaArchivo: filePath,
          pesoArchivo: pdfBuffer.length
        }
      })
    ]);

    return { uuid: fileUuid, rutaArchivo: filePath, hash: hexHash };
  }
}
