import Airtable from 'airtable';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { AirtableRecordData } from '../types';

let base: Airtable.Base | null = null;

if (config.airtable.apiKey && config.airtable.baseId) {
  Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: config.airtable.apiKey,
  });
  base = Airtable.base(config.airtable.baseId);
}

export class AirtableService {
  async syncUserToAirtable(userId: string): Promise<void> {
    if (!base) {
      console.warn('Airtable not configured, skipping sync');
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const tableName = user.role === 'mentor' ? config.airtable.tableMentors : config.airtable.tableUsers;

      const recordData: AirtableRecordData = {
        'Email': user.email,
        'Name': user.name || '',
        'Role': user.role,
        'Bio': user.bio || '',
        'Profile Picture URL': user.profilePictureUrl || '',
        'Is Active': user.isActive,
      };

      if (user.role === 'mentor') {
        recordData['Expertise Areas'] = user.expertiseAreas || [];
      } else {
        recordData['Industry Focus'] = user.industryFocus || [];
        recordData['Startup Stage'] = user.startupStage || '';
      }

      let airtableRecordId = user.airtableRecordId;

      if (airtableRecordId) {
        // Update existing record
        await base(tableName).update(airtableRecordId, recordData);
      } else {
        // Create new record
        const records = await base(tableName).create([{ fields: recordData }]);
        airtableRecordId = records[0].id;

        // Update user with Airtable record ID
        await prisma.user.update({
          where: { id: userId },
          data: {
            airtableRecordId,
            airtableSyncStatus: 'synced',
          },
        });
      }

      // Log sync
      await prisma.airtableSyncLog.create({
        data: {
          userId,
          operation: airtableRecordId ? 'update' : 'create',
          status: 'success',
        },
      });

      // Update sync status
      await prisma.user.update({
        where: { id: userId },
        data: { airtableSyncStatus: 'synced' },
      });
    } catch (error) {
      console.error('Airtable sync error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log error
      await prisma.airtableSyncLog.create({
        data: {
          userId,
          operation: 'sync',
          status: 'error',
          errorMessage,
        },
      }).catch(() => {
        // Ignore logging errors
      });

      // Update sync status
      await prisma.user.update({
        where: { id: userId },
        data: { airtableSyncStatus: 'error' },
      }).catch(() => {
        // Ignore update errors
      });

      throw error;
    }
  }

  async handleWebhook(data: Record<string, unknown>): Promise<void> {
    // Handle Airtable webhook updates
    // This would process updates from Airtable and sync back to database
    try {
      // Implementation depends on Airtable webhook format
      console.log('Airtable webhook received:', data);
    } catch (error) {
      console.error('Airtable webhook error:', error);
      throw error;
    }
  }
}

export const airtableService = new AirtableService();

