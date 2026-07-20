import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

async function seed() {
    const prisma = new PrismaGlobal();

    const empresa = await prisma.empresas.create({
        data: {
            id: 'EMP000001',
            nombre: 'Empresa Test',
            dbUrl: 'file:../prisma/tenant_EMP000001.db'
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
