import Config from '../models/Config';

export async function getConfig(): Promise<Config> {
  const config = await Config.findOne();
  if (!config) {
    throw new Error('No config');
  }
  return config;
}

export async function updateConfig(values: Partial<Config>): Promise<Config> {
  const config = await getConfig();

  config.set(values);

  await config.save();

  await config.reload();

  return config;
}
