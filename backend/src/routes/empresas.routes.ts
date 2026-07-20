import { resolveTenant } from '../middlewares/tenant.middleware';
import { Router } from 'express';
import multer from 'multer';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { seedBasePUC } from '../services/pucSeeder';

const execPromise = util.promisify(exec);
const router = Router();
router.use(resolveTenant);
const prismaGlobal = new PrismaGlobal(); // Lee GLOBAL_DATABASE_URL desde .env

// Configuración de Multer para guardar en uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

export const disconnectEmpresasPrisma = () => prismaGlobal.$disconnect();

router.post('/', upload.single('logo'), async (req, res) => {
  try {
    const data = req.body;
    
    // 1. Crear registro en Base Global
    const pendingEmpresa = await prismaGlobal.empresaGlobal.create({
      data: {
        codigo_empresa: 'TEMP-' + Date.now(), 
        nombre_empresa: data.razonSocial,
        nit: data.nit,
        servidor_bd: 'localhost',
        nombre_bd: 'temp',
        estado: 'CREANDO'
      }
    });

    // 2. Generar código único y nombre de base de datos
    const idString = pendingEmpresa.id.toString().padStart(6, '0');
    const codigoEmpresa = `EMP${idString}`;
    const normalizedName = data.razonSocial.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const nombreBd = `${codigoEmpresa}_${normalizedName}`;
    const tenantDbUrl = `file:./${nombreBd}.db`;

    // 3. Actualizar registro global
    await prismaGlobal.empresaGlobal.update({
      where: { id: pendingEmpresa.id },
      data: {
        codigo_empresa: codigoEmpresa,
        nombre_bd: nombreBd
      }
    });

    // 4. Crear Base de Datos Física y Estructura (Push Schema)
    // 6. Configurar Base de Datos para el Tenant
    
    // 6.1 Ejecutar Prisma DB Push para crear las tablas
    console.log(`[Tenant DB] Creando esquema para ${nombreBd}...`);
    try {
      const { stdout } = await execPromise(`npx prisma db push --schema=prisma/tenant.schema.prisma`, {
        env: { ...process.env, TENANT_DATABASE_URL: tenantDbUrl }
      });
      console.log(`[Tenant DB] Esquema creado:`, stdout);
    } catch (e) {
      console.error(`[Tenant DB] Error creando esquema:`, e);
      throw new Error('No se pudo inicializar el esquema de la base de datos de la empresa');
    }

    // 5. Conectar a la nueva Base de Datos Específica
    const prismaTenant = new PrismaTenant({
      datasources: {
        db: {
          url: tenantDbUrl
        }
      }
    });

    // 6. Insertar la configuración profunda de la empresa
    const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    await prismaTenant.configuracionEmpresa.create({
      data: {
        razonSocial: data.razonSocial,
        nombreComercial: data.nombreComercial || null,
        nit: data.nit,
        dv: data.dv,
        tipoPersona: data.tipoPersona,
        regimenFiscalP1: data.regimenFiscalP1,
        direccion: data.direccion,
        ciudad: data.ciudad,
        departamento: data.departamento,
        pais: data.pais,
        telefono: data.telefono || null,
        email: data.email || null,
        sitioWeb: data.sitioWeb || null,
        representanteLegal: data.representanteLegal,
        identificacion: data.identificacion,

        marcoNormativo: data.marcoNormativo,
        planCuentas: data.planCuentas,
        moneda: data.moneda,
        anioFiscalInicio: data.anioFiscalInicio ? new Date(data.anioFiscalInicio) : null,
        anioFiscalFin: data.anioFiscalFin ? new Date(data.anioFiscalFin) : null,
        centrosCosto: data.centrosCosto,
        presupuesto: data.presupuesto,
        sucursales: data.sucursales,

        responsabilidades: data.responsabilidades || '[]',
        regimenTributarioP3: data.regimenTributarioP3,
        actividadCiiu: data.actividadCiiu,
        obligadoFacturar: data.obligadoFacturar,
        correoTributario: data.correoTributario,
        correoRecepcion: data.correoRecepcion,
        manejaReteFuente: data.manejaReteFuente,
        manejaReteIca: data.manejaReteIca,
        
        logoUrl: logoUrl
      }
    });

    // 6.2 Crear Tercero Principal de la Empresa
    const tercero = await prismaTenant.tercero.create({
      data: {
        tipoIdentificacion: 'NIT',
        identificacion: data.nit,
        dv: data.dv,
        razonSocial: data.razonSocial,
        nombreComercial: data.nombreComercial || null,
        tipoPersona: data.tipoPersona === 'JURIDICA' ? 'JURIDICA' : 'NATURAL',
        direccion: data.direccion,
        telefono: data.telefono || null,
        email: data.email || null,
        pais: data.pais,
        departamento: data.departamento,
        ciudad: data.ciudad,
        esEmpresaPrincipal: true,
        activa: true,
        usuarioCreacion: 'sistema',
        roles: {
          create: [
            { rol: 'CLIENTE' },
            { rol: 'PROVEEDOR' }
          ]
        }
      }
    });

    // Guardar una referencia del logo de forma global si se quiere mostrar en el Dashboard (Opcional, pero util)
    // Para hacerlo estrictamente como el usuario pidio, solo en tenant.
    // Desconectamos la sesión dinámica
    await prismaTenant.$disconnect();

    // 6.5 Sembrar Plan de Cuentas base
    try {
      await seedBasePUC(tenantDbUrl, pendingEmpresa.id.toString());
      const { seedTiposDocumento } = require('../seeders/tipoDocumento.seeder');
      await seedTiposDocumento(tenantDbUrl);
    } catch (e) {
      console.error('Error al sembrar PUC o Tipos Documento:', e);
      // No fallamos la creacion de la empresa si el seeding falla
    }

    // 7. Finalizar proceso marcando como ACTIVO
    const empresaFinal = await prismaGlobal.empresaGlobal.update({
      where: { id: pendingEmpresa.id },
      data: { estado: 'ACTIVO' }
    });

    res.status(201).json({ success: true, data: empresaFinal });
  } catch (error) {
    console.error('Error al crear la empresa y su base de datos:', error);
    res.status(500).json({ success: false, message: 'Error interno al crear la arquitectura multi-tenant' });
  }
});

router.get('/', async (req, res) => {
  try {
    const empresas = await prismaGlobal.empresaGlobal.findMany({
      where: { estado: 'ACTIVO' },
      orderBy: { fecha_creacion: 'desc' }
    });
    
    // Para mostrar el logo en el Dashboard, como el logo está guardado dentro de la BD Tenant,
    // debemos iterar e instanciar clientes tenant para leer la tabla ConfiguracionEmpresa.
    const empresasConDetalles = await Promise.all(empresas.map(async (emp) => {
      try {
        const tenantDbUrl = `file:./${emp.nombre_bd}.db`;
        const pTenant = new PrismaTenant({ datasources: { db: { url: tenantDbUrl } } });
        const conf = await pTenant.configuracionEmpresa.findFirst();
        await pTenant.$disconnect();
        return {
          ...emp,
          dv: conf?.dv || null, // necesitamos el DV y Logo para el dashboard frontend
          razonSocial: conf?.razonSocial || emp.nombre_empresa,
          logoUrl: conf?.logoUrl || null
        };
      } catch (tenantError) {
        console.error(`Error al obtener detalles del tenant ${emp.nombre_bd}:`, tenantError);
        return {
          ...emp,
          dv: null,
          razonSocial: emp.nombre_empresa,
          logoUrl: null
        };
      }
    }));

    res.json({ success: true, data: empresasConDetalles });
  } catch (error) {
    console.error('Error al obtener las empresas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener empresas multi-tenant' });
  }
});

export default router;
