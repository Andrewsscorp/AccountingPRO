import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client-tenant';

export const getConfiguracion = async (req: any, res: Response) => {
  try {
    const prisma = req.tenantPrisma as PrismaClient;
    
    const config = await prisma.configuracionEmpresa.findFirst({
      include: {
        impuestos: true
      }
    });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuración no encontrada' });
    }

    res.json({ success: true, data: config });
  } catch (error: any) {
    console.error('Error al obtener configuración de empresa:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateConfiguracion = async (req: any, res: Response) => {
  try {
    const prisma = req.tenantPrisma as PrismaClient;
    const data = req.body;

    const configExistente = await prisma.configuracionEmpresa.findFirst();
    
    if (!configExistente) {
      return res.status(404).json({ success: false, message: 'Configuración no encontrada para actualizar' });
    }

    const configEditada = await prisma.configuracionEmpresa.update({
      where: { id: configExistente.id },
      data: {
        razonSocial: data.razonSocial,
        nombreComercial: data.nombreComercial,
        nit: data.nit,
        dv: data.dv,
        tipoPersona: data.tipoPersona,
        regimenFiscalP1: data.regimenFiscalP1,
        direccion: data.direccion,
        ciudad: data.ciudad,
        departamento: data.departamento,
        pais: data.pais,
        telefono: data.telefono,
        email: data.email,
        sitioWeb: data.sitioWeb,
        representanteLegal: data.representanteLegal,
        identificacion: data.identificacion,
        marcoNormativo: data.marcoNormativo,
        planCuentas: data.planCuentas,
        moneda: data.moneda,
        anioFiscalInicio: data.anioFiscalInicio ? new Date(data.anioFiscalInicio) : undefined,
        anioFiscalFin: data.anioFiscalFin ? new Date(data.anioFiscalFin) : undefined,
        centrosCosto: data.centrosCosto,
        presupuesto: data.presupuesto,
        sucursales: data.sucursales,
        responsabilidades: data.responsabilidades,
        regimenTributarioP3: data.regimenTributarioP3,
        actividadCiiu: data.actividadCiiu,
        obligadoFacturar: data.obligadoFacturar,
        correoTributario: data.correoTributario,
        correoRecepcion: data.correoRecepcion,
        manejaReteFuente: data.manejaReteFuente,
        manejaReteIca: data.manejaReteIca,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : undefined,
        direccionCorrespondencia: data.direccionCorrespondencia,
        codigoPostal: data.codigoPostal,
        telefonoSecundario: data.telefonoSecundario,
        celularCorporativo: data.celularCorporativo,
        fax: data.fax,
        emailFacturacion: data.emailFacturacion,
        emailNotificaciones: data.emailNotificaciones,
        facebook: data.facebook,
        instagram: data.instagram,
        linkedin: data.linkedin,
        xTwitter: data.xTwitter,
        youtube: data.youtube,
        diasAtencion: data.diasAtencion,
        horaApertura: data.horaApertura,
        horaCierre: data.horaCierre,
        zonaHoraria: data.zonaHoraria,
        observacionesContacto: data.observacionesContacto,
        latitud: data.latitud !== undefined ? parseFloat(data.latitud) : undefined,
        longitud: data.longitud !== undefined ? parseFloat(data.longitud) : undefined,
        
        // Tributario (EFTC-006)
        naturalezaJuridica: data.naturalezaJuridica,
        actividadSecundariaCiiu: data.actividadSecundariaCiiu,
        responsabilidadFiscal: data.responsabilidadFiscal,
        granContribuyente: data.granContribuyente,
        agenteRetencionIva: data.agenteRetencionIva,
        autorretenedor: data.autorretenedor,
        resolucionFacturacion: data.resolucionFacturacion,
        fechaResolucion: data.fechaResolucion ? new Date(data.fechaResolucion) : undefined,
        prefijoFacturacion: data.prefijoFacturacion,
        rangoDesde: data.rangoDesde,
        rangoHasta: data.rangoHasta,
        fechaInicioVigencia: data.fechaInicioVigencia ? new Date(data.fechaInicioVigencia) : undefined,
        fechaFinVigencia: data.fechaFinVigencia ? new Date(data.fechaFinVigencia) : undefined,
        habilitaNominaElectronica: data.habilitaNominaElectronica,
        codigoDianPrincipal: data.codigoDianPrincipal,
        codigoDianSecundario: data.codigoDianSecundario,
        codigoExogena: data.codigoExogena,
        responsabilidadIva: data.responsabilidadIva,
        responsabilidadRenta: data.responsabilidadRenta,
        tipoContribuyente: data.tipoContribuyente,

        impuestos: data.impuestos ? {
          deleteMany: {},
          create: data.impuestos.map((i: any) => ({
            nombre: i.nombre,
            codigoDian: i.codigoDian,
            tarifa: parseFloat(i.tarifa),
            aplicaFuente: i.aplicaFuente,
            aplicaIva: i.aplicaIva,
            aplicaIca: i.aplicaIca,
            estado: i.estado || 'Activo'
          }))
        } : undefined
      },
      include: {
        impuestos: true
      }
    });

    res.json({ success: true, data: configEditada, message: 'Configuración actualizada correctamente' });
  } catch (error: any) {
    console.error('Error al actualizar configuración de empresa:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
