import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client-tenant';

export const getAllFirmantes = async (req: any, res: any) => {
  try {
    const prisma = req.tenantPrisma as PrismaClient;
    const firmantes = await prisma.firmaUsuario.findMany({
      include: { tercero: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: firmantes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFirmante = async (req: any, res: any) => {
  try {
    const prisma = req.tenantPrisma as PrismaClient;
    const data = req.body;
    
    const newFirmante = await prisma.firmaUsuario.create({
      data: {
        nombre: data.nombre,
        cargo: data.cargo,
        tipoDocumento: data.tipoDocumento,
        documento: data.documento,
        correo: data.correo,
        telefono: data.telefono,
        tarjetaProfesional: data.tarjetaProfesional,
        fechaExpedicionTarjeta: data.fechaExpedicionTarjeta ? new Date(data.fechaExpedicionTarjeta) : null,
        firmaImagen: data.firmaImagen, // Base64
        selloImagen: data.selloImagen, // Base64
        permisosFirma: data.permisosFirma, // JSON string
        estado: data.estado || 'Activo',
        terceroId: data.terceroId ? parseInt(data.terceroId) : null,
      }
    });

    res.json({ success: true, data: newFirmante });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFirmante = async (req: any, res: any) => {
  try {
    const prisma = req.tenantPrisma as PrismaClient;
    const { id } = req.params;
    const data = req.body;

    const updated = await prisma.firmaUsuario.update({
      where: { id: parseInt(id) },
      data: {
        nombre: data.nombre,
        cargo: data.cargo,
        tipoDocumento: data.tipoDocumento,
        documento: data.documento,
        correo: data.correo,
        telefono: data.telefono,
        tarjetaProfesional: data.tarjetaProfesional,
        fechaExpedicionTarjeta: data.fechaExpedicionTarjeta ? new Date(data.fechaExpedicionTarjeta) : null,
        firmaImagen: data.firmaImagen !== undefined ? data.firmaImagen : undefined,
        selloImagen: data.selloImagen !== undefined ? data.selloImagen : undefined,
        permisosFirma: data.permisosFirma,
        estado: data.estado,
        terceroId: data.terceroId ? parseInt(data.terceroId) : null,
      }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFirmante = async (req: any, res: any) => {
  try {
    const prisma = req.tenantPrisma as PrismaClient;
    const { id } = req.params;
    
    await prisma.firmaUsuario.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Firmante eliminado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
