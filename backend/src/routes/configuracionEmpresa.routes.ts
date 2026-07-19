import { Router } from 'express';
import { 
  getConfiguracion, 
  updateConfiguracion 
} from '../controllers/configuracion/empresa.controller';
import { resolveTenant } from '../middlewares/tenant.middleware';

const router = Router();

router.use(resolveTenant);

router.get('/', getConfiguracion);
router.put('/', updateConfiguracion);

export default router;
