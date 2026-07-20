import { PrismaClient as PrismaGlobal } from '@prisma/client-global';
import bcrypt from 'bcrypt';

async function seed() {
    const prisma = new PrismaGlobal();
    const hash = await bcrypt.hash('securepassword123', 10);
    const user = await prisma.usuario.create({
        data: {
            email: 'admin@accountingpro.com',
            passwordHash: hash,
            nombre: 'Admin User',
            rol: 'admin',
        }
    });
    console.log('User created:', user);

    const empresa = await prisma.tenant.create({
        data: {
            id: 'EMP000001',
            nombre: 'Empresa Test',
            dbUrl: 'file:../prisma/tenant_EMP000001.db'
        }
    });
    console.log('Empresa created:', empresa);

    const ue = await prisma.usuarioEmpresa.create({
        data: {
            usuarioId: user.id,
            empresaId: empresa.id,
            rol: 'admin'
        }
    });
    console.log('UsuarioEmpresa created:', ue);
}
seed().catch(console.error).finally(() => process.exit(0));
