const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  const prismaDir = path.join(__dirname, 'prisma');
  const files = fs.readdirSync(prismaDir).filter(f => f.endsWith('.db') && f.startsWith('EMP'));

  for (const file of files) {
    const dbPath = `file:./${file}`;
    console.log(`Pushing schema to ${file}...`);
    
    // Push schema
    try {
      execSync(`npx prisma db push --schema prisma/tenant.schema.prisma --accept-data-loss`, {
        env: { ...process.env, TENANT_DATABASE_URL: dbPath },
        stdio: 'inherit'
      });
    } catch (e) {
      console.error(`Failed to push to ${file}`);
      continue;
    }

    console.log(`Syncing principal Tercero for ${file}...`);
    // Connect to tenant DB and sync Tercero
    const { PrismaClient } = require('@prisma/client-tenant');
    const prisma = new PrismaClient({
      datasources: {
        db: { url: dbPath }
      }
    });

    try {
      const empresa = await prisma.configuracionEmpresa.findFirst();
      if (empresa) {
        // Create Tercero Principal
        const tercero = await prisma.tercero.upsert({
          where: { identificacion: empresa.nit },
          update: {
            tipoIdentificacion: 'NIT',
            dv: empresa.dv,
            razonSocial: empresa.razonSocial,
            nombreComercial: empresa.nombreComercial,
            tipoPersona: empresa.tipoPersona === 'JURIDICA' ? 'JURIDICA' : 'NATURAL',
            direccion: empresa.direccion,
            telefono: empresa.telefono,
            email: empresa.email,
            pais: empresa.pais,
            departamento: empresa.departamento,
            ciudad: empresa.ciudad,
            esEmpresaPrincipal: true,
            activa: true,
            usuarioCreacion: 'sistema'
          },
          create: {
            tipoIdentificacion: 'NIT',
            identificacion: empresa.nit,
            dv: empresa.dv,
            razonSocial: empresa.razonSocial,
            nombreComercial: empresa.nombreComercial,
            tipoPersona: empresa.tipoPersona === 'JURIDICA' ? 'JURIDICA' : 'NATURAL',
            direccion: empresa.direccion,
            telefono: empresa.telefono,
            email: empresa.email,
            pais: empresa.pais,
            departamento: empresa.departamento,
            ciudad: empresa.ciudad,
            esEmpresaPrincipal: true,
            activa: true,
            usuarioCreacion: 'sistema'
          }
        });

        // Add Roles
        const rolesBase = ['CLIENTE', 'PROVEEDOR'];
        for (const r of rolesBase) {
          await prisma.terceroRol.upsert({
            where: { terceroId_rol: { terceroId: tercero.id, rol: r } },
            update: {},
            create: { terceroId: tercero.id, rol: r }
          });
        }
        console.log(`Tercero principal synced for ${file} - ${empresa.razonSocial}`);
      }
    } catch (e) {
      console.error(`Error syncing tercero for ${file}:`, e);
    } finally {
      await prisma.$disconnect();
    }
  }
}

main().catch(console.error);
