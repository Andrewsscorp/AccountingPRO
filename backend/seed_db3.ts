import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

async function seed() {
    const prisma = new PrismaGlobal();

    const empresa = await prisma.empresaGlobal.create({
        data: {
            codigo_empresa: 'EMP000001',
            nombre_empresa: 'Empresa Test',
            nit: '900123456-1',
            servidor_bd: 'localhost',
            nombre_bd: 'tenant_EMP000001.db'
        }
    });
    console.log('Empresa created:', empresa);

    const ue = await prisma.usuarioEmpresa.create({
        data: {
            usuarioId: 1,
            empresaId: empresa.id,
            rol: 'admin'
        }
    });
    console.log('UsuarioEmpresa created:', ue);
}
seed().catch(console.error).finally(() => process.exit(0));
