import { prisma } from '../config/database';
import { AppError, errorCodes } from '../utils/errors';
import { authService } from './auth.service';
import { airtableService } from './airtable.service';

export interface CreateUserData {
  email: string;
  password: string;
  role: 'mentor' | 'mentee' | 'admin';
  name?: string;
  bio?: string;
  expertiseAreas?: string[];
  industryFocus?: string[];
  startupStage?: string;
}

export interface UpdateUserData {
  name?: string;
  bio?: string;
  profilePictureUrl?: string;
  expertiseAreas?: string[];
  industryFocus?: string[];
  startupStage?: string;
}

export class UserService {
  async createUser(data: CreateUserData) {
    // Validate password
    await authService.validatePassword(data.password);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError(409, errorCodes.DUPLICATE_EMAIL, 'Email already exists');
    }

    // Hash password
    const passwordHash = await authService.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role,
        name: data.name,
        bio: data.bio,
        expertiseAreas: data.expertiseAreas || [],
        industryFocus: data.industryFocus || [],
        startupStage: data.startupStage,
        airtableSyncStatus: 'pending',
      },
    });

    // Sync to Airtable (async, don't wait)
    airtableService.syncUserToAirtable(user.id).catch((error) => {
      console.error('Failed to sync user to Airtable:', error);
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        bio: true,
        profilePictureUrl: true,
        expertiseAreas: true,
        industryFocus: true,
        startupStage: true,
        airtableSyncStatus: true,
        airtableRecordId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, errorCodes.NOT_FOUND, 'User not found');
    }

    return user;
  }

  async updateUser(userId: string, data: UpdateUserData) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        bio: data.bio,
        profilePictureUrl: data.profilePictureUrl,
        expertiseAreas: data.expertiseAreas,
        industryFocus: data.industryFocus,
        startupStage: data.startupStage,
        airtableSyncStatus: 'pending', // Mark for sync
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        bio: true,
        profilePictureUrl: true,
        expertiseAreas: true,
        industryFocus: true,
        startupStage: true,
        airtableSyncStatus: true,
        airtableRecordId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Sync to Airtable (async)
    airtableService.syncUserToAirtable(userId).catch((error) => {
      console.error('Failed to sync user to Airtable:', error);
    });

    return user;
  }

  async getUsers(filters: {
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: {
      role?: 'mentor' | 'mentee' | 'admin';
      isActive?: boolean;
    } = {};
    if (filters.role) {
      where.role = filters.role as 'mentor' | 'mentee' | 'admin';
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          bio: true,
          profilePictureUrl: true,
          expertiseAreas: true,
          industryFocus: true,
          startupStage: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }
}

export const userService = new UserService();

