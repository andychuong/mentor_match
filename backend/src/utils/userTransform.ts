/**
 * Transforms backend user format (flat) to frontend format (nested profile)
 */

export interface BackendUser {
  id: string;
  email: string;
  role: string | 'mentor' | 'mentee' | 'admin';
  name: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
  expertiseAreas: string[];
  industryFocus: string[];
  startupStage: string | null;
  airtableSyncStatus: string;
  airtableRecordId?: string | null;
  isActive?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FrontendUser {
  id: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  profile: {
    name: string;
    bio: string;
    profilePictureUrl: string;
    expertiseAreas?: string[];
    industryFocus?: string[];
    startupStage?: string;
  };
  airtableSyncStatus: 'synced' | 'pending' | 'error';
  createdAt: string;
  updatedAt: string;
}

export function transformUserToFrontendFormat(user: BackendUser): FrontendUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role as 'mentor' | 'mentee' | 'admin',
    profile: {
      name: user.name || '',
      bio: user.bio || '',
      profilePictureUrl: user.profilePictureUrl || '',
      ...(user.expertiseAreas && user.expertiseAreas.length > 0 && { expertiseAreas: user.expertiseAreas }),
      ...(user.industryFocus && user.industryFocus.length > 0 && { industryFocus: user.industryFocus }),
      ...(user.startupStage && { startupStage: user.startupStage }),
    },
    airtableSyncStatus: user.airtableSyncStatus as 'synced' | 'pending' | 'error',
    createdAt: typeof user.createdAt === 'string' ? user.createdAt : user.createdAt.toISOString(),
    updatedAt: typeof user.updatedAt === 'string' ? user.updatedAt : user.updatedAt.toISOString(),
  };
}

