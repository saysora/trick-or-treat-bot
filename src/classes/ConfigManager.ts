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
  static async getConfig(): Promise<Config> {
    const config = await Config.findOne();
    if (!config) {
      throw new Error('No config');
    }
    return config;
  }

  static async updateConfig(update: UpdateConfigProps): Promise<Config> {
    const config = await Config.findOne();

    if (!config) {
      throw new Error('No config');
    }

    for (const key of Object.keys(update)) {
      if (update[key as keyof UpdateConfigProps] === 'null') {
        config[key as keyof Config] = null!;
      } else {
        //@ts-ignore - We don't care to deal with the overhead
        //the only person who can use this is me
        config[key] = update[key]!;
      }
    }

    await config.save();

    return config;
  }
}
