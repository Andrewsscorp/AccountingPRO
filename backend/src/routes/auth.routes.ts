import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

const router = Router();
const prismaGlobal = new PrismaGlobal();
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
  console.error("CRITICAL ERROR: JWT_SECRET or REFRESH_SECRET not set in environment variables. Failing to start.");
  process.exit(1);
}

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

    // Save refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prismaGlobal.refreshToken.create({
      data: {
        userId: usuario.id,
        token: refreshToken,
        expiresAt: expiresAt
      }
    });

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

    // Check DB first
    const tokenDb = await prismaGlobal.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    if (!tokenDb || tokenDb.revocado || tokenDb.expiresAt < new Date()) {
      return res.status(403).json({ success: false, message: 'Refresh token inválido, expirado o revocado' });
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

router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prismaGlobal.refreshToken.update({
        where: { token: refreshToken },
        data: { revocado: true }
      });
    }
    res.json({ success: true, message: 'Sesión cerrada' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

export default router;
