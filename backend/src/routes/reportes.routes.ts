import { resolveTenant } from '../middlewares/tenant.middleware';
import { Router } from 'express';
const router = Router();
router.use(resolveTenant);
export default router;
