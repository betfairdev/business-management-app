import { BaseService } from './BaseService';
import { Setting } from '../entities/Setting';
import { CreateSettingDto } from '../dtos/CreateSettingDto';
import { UpdateSettingDto } from '../dtos/UpdateSettingDto';

export class SettingService extends BaseService<Setting, CreateSettingDto, UpdateSettingDto> {
  constructor() {
    super(Setting, CreateSettingDto, UpdateSettingDto, ['key', 'value']);
  }

  async getSettingByKey(key: string): Promise<Setting | null> {
    return await this.repository.findOne({
      where: { key },
    });
  }

  async getSettingValue(key: string, defaultValue?: string): Promise<string | null> {
    const setting = await this.getSettingByKey(key);
    return setting?.value || defaultValue || null;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existingSetting = await this.getSettingByKey(key);
    
    if (existingSetting) {
      await this.repository.update(existingSetting.id, { value });
      return await this.repository.findOne({ where: { id: existingSetting.id } }) as Setting;
    } else {
      const newSetting = this.repository.create({ key, value });
      return await this.repository.save(newSetting);
    }
  }

  async getSettingsByCategory(category: string): Promise<Setting[]> {
    return await this.repository
      .createQueryBuilder('setting')
      .where('setting.key LIKE :pattern', { pattern: `${category}.%` })
      .getMany();
  }

  async getSystemSettings(): Promise<Record<string, string>> {
    const settings = await this.repository.find();
    const settingsMap: Record<string, string> = {};
    
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });
    
    return settingsMap;
  }

  async updateMultipleSettings(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.setSetting(key, value);
    }
  }

  async deleteSetting(key: string): Promise<void> {
    const setting = await this.getSettingByKey(key);
    if (setting) {
      await this.repository.delete(setting.id);
    }
  }
}