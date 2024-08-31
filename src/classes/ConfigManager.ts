import {Repository} from 'sequelize-typescript';
import Config from '../models/Config';

interface UpdateConfigProps {
  enabled?: boolean;
  cooldownEnabled?: boolean;
  cooldownTime?: number;
  cooldownUnit?: string;
  startDate?: string;
  endDate?: string;
}

export default class ConfigManager {
  constructor(private configRepo: Repository<Config>) {}

  async getConfig(): Promise<Config> {
    const config = await this.configRepo.findOne();
    if (!config) {
      throw new Error('No config');
    }
    return config;
  }

  async updateConfig(update: UpdateConfigProps): Promise<Config> {
    const config = await this.configRepo.findOne();

    if (!config) {
      throw new Error('No config');
    }

    for (const key of Object.keys(update)) {
      // @ts-ignore
      if (update[key] === 'null') {
        // @ts-ignore
        config[key] = null;
      } else {
        // @ts-ignore
        config[key] = update[key];
      }
    }

    await config.save();

    return config;
  }
}
