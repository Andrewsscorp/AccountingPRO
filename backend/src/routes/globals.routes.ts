import express from 'express';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

const router = express.Router();
const prismaGlobal = new PrismaGlobal();

router.get('/ciiu', async (req, res) => {
  try {
    const ciiuList = await prismaGlobal.ciiu.findMany({
      orderBy: { codigo: 'asc' }
    });
    res.json({ success: true, data: ciiuList });
  } catch (error) {
    console.error('Error fetching CIIU:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo códigos CIIU' });
  }
});

export default router;
