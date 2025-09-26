import 'dotenv/config';
import moment = require('moment');
import Config from '../models/Config';
import {isAfterDate, isBeforeDate} from './time';

interface IsGameActiveRes {
  content?: string;
  active: boolean;
}

export function isGameActive(
  config: Config,
  channelId: string,
): IsGameActiveRes {
  if (
    process.env.GAME_CHANNEL_ID &&
    channelId !== process.env.GAME_CHANNEL_ID
  ) {
    return {
      content: `You can only trick-or-treat in <#${process.env.GAME_CHANNEL_ID}>`,
      active: false,
    };
  }
  if (!config.enabled) {
    return {
      content: "It's not time to trick or treat yet!",
      active: false,
    };
  }

  if (config.startDate && isBeforeDate(config.startDate)) {
    return {
      content: `It's not time to trick or treat yet! You need to wait until ${moment(config.startDate, 'YYYY-MM-DD').format('MMMM Do')}`,
      active: false,
    };
  }

  if (config.endDate && isAfterDate(config.endDate)) {
    return {
      content: 'It is too late to trick or treat. Halloween is over.',
      active: false,
    };
  }

  return {
    active: true,
  };
}
