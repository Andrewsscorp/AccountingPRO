import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

const prisma = new PrismaGlobal();

const ciiuData = [
  { codigo: '0010', descripcion: 'Asalariados', tarifaIca: 0 },
  { codigo: '0020', descripcion: 'Pensionados', tarifaIca: 0 },
  { codigo: '0081', descripcion: 'Personas naturales sin actividad económica', tarifaIca: 0 },
  { codigo: '0082', descripcion: 'Personas naturales subsidiadas por terceros', tarifaIca: 0 },
  { codigo: '0090', descripcion: 'Rentistas de capital', tarifaIca: 0 },
  { codigo: '4719', descripcion: 'Comercio al por menor en establecimientos no especializados', tarifaIca: 11.04 },
  { codigo: '4791', descripcion: 'Comercio al por menor realizado a través de internet', tarifaIca: 11.04 },
  { codigo: '4921', descripcion: 'Transporte urbano de pasajeros', tarifaIca: 4.14 },
  { codigo: '5611', descripcion: 'Expendio a la mesa de comidas preparadas (restaurantes)', tarifaIca: 6.9 },
  { codigo: '6201', descripcion: 'Actividades de desarrollo de sistemas informáticos (software)', tarifaIca: 9.66 },
  { codigo: '6810', descripcion: 'Actividades inmobiliarias realizadas con bienes propios o arrendados', tarifaIca: 9.66 },
  { codigo: '6910', descripcion: 'Actividades jurídicas', tarifaIca: 9.66 },
  { codigo: '6920', descripcion: 'Actividades de contabilidad, teneduría de libros, auditoría y asesoría tributaria', tarifaIca: 9.66 },
  { codigo: '7020', descripcion: 'Actividades de consultoría de gestión', tarifaIca: 9.66 },
  { codigo: '7110', descripcion: 'Actividades de arquitectura e ingeniería y otras actividades conexas', tarifaIca: 9.66 },
  { codigo: '7310', descripcion: 'Publicidad', tarifaIca: 9.66 },
  { codigo: '7490', descripcion: 'Otras actividades profesionales, científicas y técnicas n.c.p.', tarifaIca: 9.66 },
  { codigo: '8211', descripcion: 'Actividades combinadas de apoyo a la oficina', tarifaIca: 9.66 },
  { codigo: '8621', descripcion: 'Actividades de la práctica médica, sin internación', tarifaIca: 6.9 },
  { codigo: '9602', descripcion: 'Peluquería y otros tratamientos de belleza', tarifaIca: 4.14 }
];

async function seedCiiu() {
  console.log('Iniciando semilla de CIIU...');
  for (const item of ciiuData) {
    await prisma.ciiu.upsert({
      where: { codigo: item.codigo },
      update: {},
      create: item,
    });
  }
  console.log('20 códigos CIIU insertados/verificados en la base global exitosamente.');
}

seedCiiu()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
