import bcrypt from 'bcrypt';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';
const prismaGlobal = new PrismaGlobal();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const user = await prismaGlobal.usuario.upsert({
    where: { email: 'admin@accountingpro.com' },
    update: { passwordHash },
    create: {
      email: 'admin@accountingpro.com',
      passwordHash,
      nombre: 'Administrador Principal',
      rol: 'ADMIN'
    }
  });

  const emp = await prismaGlobal.empresaGlobal.findFirst();
  if (emp) {
    await prismaGlobal.usuarioEmpresa.upsert({
      where: {
        usuarioId_empresaId: { usuarioId: user.id, empresaId: emp.id }
      },
      update: {},
      create: {
        usuarioId: user.id,
        empresaId: emp.id,
        rol: 'ADMIN'
      }
    });
  }
  console.log("Admin user created.");
}
main().catch(console.error).finally(() => prismaGlobal.$disconnect());
