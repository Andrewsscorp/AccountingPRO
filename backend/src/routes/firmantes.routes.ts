import { Router } from 'express';
import { 
  getAllFirmantes, 
  createFirmante, 
  updateFirmante, 
  deleteFirmante 
} from '../controllers/configuracion/firmantes.controller';
import { resolveTenant } from '../middlewares/tenant.middleware';

const router = Router();

router.use(resolveTenant);

router.get('/', getAllFirmantes);
router.post('/', createFirmante);
router.put('/:id', updateFirmante);
router.delete('/:id', deleteFirmante);

export default router;
