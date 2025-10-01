import {WebhookClient} from 'discord.js';

export function wHook(url: string) {
  try {
    return new WebhookClient({
      url,
    });
  } catch (e) {
    console.error(e);
  }
  return null;
}
