import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

const router = Router();
const prismaGlobal = new PrismaGlobal();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_dev_only';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'super_secret_refresh_key_for_dev_only';

// Rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: { success: false, message: 'Demasiados intentos de inicio de sesión, intente más tarde.' }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Faltan credenciales' });
    }

    const usuario = await prismaGlobal.usuario.findUnique({
      where: { email },
      include: { empresas: true }
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas o usuario inactivo' });
    }

    const passwordMatch = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas o usuario inactivo' });
    }

    const empresasAcceso = usuario.empresas.map(ue => ue.empresaId);

    const token = jwt.sign(
      { userId: usuario.id, empresas: empresasAcceso },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: usuario.id },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token in DB if we implement token rotation later, for now just returning it
    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token requerido' });
    }

    const payload: any = jwt.verify(refreshToken, REFRESH_SECRET);
    const usuario = await prismaGlobal.usuario.findUnique({
      where: { id: payload.userId },
      include: { empresas: true }
    });

    if (!usuario || !usuario.activo) {
      return res.status(403).json({ success: false, message: 'Usuario inválido' });
    }

    const empresasAcceso = usuario.empresas.map(ue => ue.empresaId);

    const newToken = jwt.sign(
      { userId: usuario.id, empresas: empresasAcceso },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ success: true, token: newToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ success: false, message: 'Refresh token inválido o expirado' });
  }
});

router.post('/logout', (req, res) => {
  // If we had a database table for refresh tokens, we would invalidate it here.
  // For now, client just deletes it.
  res.json({ success: true, message: 'Sesión cerrada' });
});

export default router;
