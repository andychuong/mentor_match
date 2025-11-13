import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { AppError, errorCodes } from '../utils/errors';
import { emailService } from './email.service';
import logger from '../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<{
    tokens: AuthTokens;
    user: {
      id: string;
      email: string;
      role: string;
      name: string | null;
      bio: string | null;
      profilePictureUrl: string | null;
      expertiseAreas: string[];
      industryFocus: string[];
      startupStage: string | null;
      airtableSyncStatus: string;
      airtableRecordId: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  }> {
    const { email, password } = credentials;

    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user || !user.isActive) {
        throw new AppError(401, errorCodes.AUTH_INVALID, 'Invalid email or password');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new AppError(401, errorCodes.AUTH_INVALID, 'Invalid email or password');
      }

      // Generate tokens
      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Return user without password
      const { passwordHash, ...userWithoutPassword } = user;

      return {
        tokens,
        user: userWithoutPassword,
      };
    } catch (error) {
      // If it's already an AppError, rethrow it
      if (error instanceof AppError) {
        throw error;
      }

      // Handle Prisma/database errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as { code: string; message: string };
        // Prisma error codes: P1000 (connection), P1001 (can't reach), P1002 (timeout), etc.
        if (dbError.code && dbError.code.startsWith('P')) {
          logger.error('Database error during login', { 
            code: dbError.code, 
            message: dbError.message,
            email 
          });
          throw new AppError(
            500,
            'DATABASE_ERROR',
            'Database error occurred. Please check database configuration and connectivity.'
          );
        }
      }

      // Log unexpected errors
      logger.error('Unexpected error during login', { error, email });
      throw new AppError(
        500,
        errorCodes.INTERNAL_ERROR,
        'An unexpected error occurred during login'
      );
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new AppError(401, errorCodes.AUTH_INVALID, 'Invalid refresh token');
      }

      // Generate new access token
      // @ts-expect-error - expiresIn accepts string format like '15m', '7d' which is valid
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.accessExpiresIn }
      );

      // Calculate expires in seconds
      const expiresIn = this.parseExpiresIn(config.jwt.accessExpiresIn);

      return { accessToken, expiresIn };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(401, errorCodes.AUTH_EXPIRED, 'Refresh token expired or invalid');
      }
      throw error;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async validatePassword(password: string): Promise<void> {
    if (password.length < 8) {
      throw new AppError(422, errorCodes.VALIDATION_ERROR, 'Password must be at least 8 characters');
    }

    // Check for complexity (at least one letter and one number)
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
      throw new AppError(
        422,
        errorCodes.VALIDATION_ERROR,
        'Password must contain at least one letter and one number'
      );
    }
  }

  private generateTokens(payload: TokenPayload): AuthTokens {
    // Validate JWT secrets are configured
    if (!config.jwt.secret || config.jwt.secret.trim() === '') {
      throw new AppError(
        500,
        'CONFIG_ERROR',
        'JWT_SECRET is not configured. Please set JWT_SECRET environment variable.'
      );
    }

    if (!config.jwt.refreshSecret || config.jwt.refreshSecret.trim() === '') {
      throw new AppError(
        500,
        'CONFIG_ERROR',
        'JWT_REFRESH_SECRET is not configured. Please set JWT_REFRESH_SECRET environment variable.'
      );
    }

    try {
      // @ts-ignore - expiresIn accepts string format like '15m', '7d'
      const accessToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.accessExpiresIn,
      });

      // @ts-ignore - expiresIn accepts string format like '15m', '7d'
      const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
      });

      const expiresIn = this.parseExpiresIn(config.jwt.accessExpiresIn);

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      logger.error('Failed to generate JWT tokens', { error });
      throw new AppError(
        500,
        'TOKEN_GENERATION_ERROR',
        'Failed to generate authentication tokens'
      );
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal if user exists for security
    if (!user || !user.isActive) {
      return;
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Invalidate any existing tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send reset email
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
    await emailService.sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Capital Factory Office Hours',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    // Validate password
    await this.validatePassword(newPassword);

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new AppError(400, errorCodes.AUTH_INVALID, 'Invalid or expired reset token');
    }

    if (resetToken.usedAt) {
      throw new AppError(400, errorCodes.AUTH_INVALID, 'Reset token has already been used');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new AppError(400, errorCodes.AUTH_EXPIRED, 'Reset token has expired');
    }

    if (!resetToken.user.isActive) {
      throw new AppError(400, errorCodes.AUTH_INVALID, 'User account is not active');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }
}

export const authService = new AuthService();

