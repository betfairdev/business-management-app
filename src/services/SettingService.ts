import { BaseService } from './core/BaseService';
import { Setting } from '../entities/Setting';
import { CreateSettingDto } from '../dtos/CreateSettingDto';
import { UpdateSettingDto } from '../dtos/UpdateSettingDto';

export class SettingService extends BaseService<Setting, CreateSettingDto, UpdateSettingDto> {
  constructor() {
    super(Setting, CreateSettingDto, UpdateSettingDto, ['key', 'value']);
  }

  async getSettingValue(key: string): Promise<string | null> {
    const setting = await this.findOneByField('key', key);
    return setting?.value || null;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.findOneByField('key', key);
    
    if (existing) {
      return await this.update(existing.id, { value } as UpdateSettingDto);
    } else {
      return await this.create({ key, value } as CreateSettingDto);
    }
  }

  async getSettings(keys?: string[]): Promise<Record<string, string>> {
    let settings: Setting[];
    
    if (keys) {
      settings = await Promise.all(
        keys.map(key => this.findOneByField('key', key))
      ).then(results => results.filter(Boolean) as Setting[]);
    } else {
      const result = await this.findAll();
      settings = result.data;
    }

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  }

  async deleteSetting(key: string): Promise<void> {
    const setting = await this.findOneByField('key', key);
    if (setting) {
      await this.delete(setting.id);
    }
  }

  async getAppSettings(): Promise<{
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    businessEmail: string;
    currency: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    language: string;
    theme: string;
  }> {
    const keys = [
      'business_name',
      'business_address', 
      'business_phone',
      'business_email',
      'currency',
      'timezone',
      'date_format',
      'time_format',
      'language',
      'theme'
    ];

    const settings = await this.getSettings(keys);

    return {
      businessName: settings.business_name || '',
      businessAddress: settings.business_address || '',
      businessPhone: settings.business_phone || '',
      businessEmail: settings.business_email || '',
      currency: settings.currency || 'USD',
      timezone: settings.timezone || 'UTC',
      dateFormat: settings.date_format || 'MM/DD/YYYY',
      timeFormat: settings.time_format || '12h',
      language: settings.language || 'en',
      theme: settings.theme || 'system',
    };
  }
}