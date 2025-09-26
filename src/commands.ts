import {SlashCommandBuilder} from 'discord.js';
import {StoryCategory} from './constants';

const commands = [
  new SlashCommandBuilder()
    .setName('go-out')
    .setDescription('Use this command to begin trick-or-treating'),
  new SlashCommandBuilder()
    .setName('trick-or-treat')
    .setDescription('Gather candy'),
  new SlashCommandBuilder().setName('tot').setDescription('Gather candy'),
  new SlashCommandBuilder()
    .setName('backpack')
    .setDescription('Check your stats')
    .addBooleanOption(boolOpt =>
      boolOpt.setName('public').setDescription('show your backpack to others'),
    ),
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('See who has the most candy')
    .addNumberOption(option =>
      option.setName('page').setDescription('Page of the leaderboard to check'),
    ),
  new SlashCommandBuilder()
    .setName('eat')
    .setDescription('███ █L███R█ █████')
    .addUserOption(option =>
      option.setName('player').setDescription('██R███').setRequired(true),
    ),

  // Admin only commands
  new SlashCommandBuilder()
    .setName('config-get')
    .setDescription('View the current game config')
    .setDefaultMemberPermissions(0),
  new SlashCommandBuilder()
    .setName('config-update')
    .setDescription('Update the games config')
    .addStringOption(option =>
      option
        .setName('item')
        .setDescription('Select config item to change')
        .setRequired(true)
        .addChoices(
          {name: 'Game Enabled', value: 'enabled'},
          {name: 'Cooldown Enabled', value: 'cooldownEnabled'},
          {name: 'Cooldown Time Value', value: 'cooldownTime'},
          {name: 'Cooldown Time Unit', value: 'cooldownUnit'},
          {name: 'Game Start Date', value: 'startDate'},
          {name: 'Game End Date', value: 'endDate'},
        ),
    )
    .addStringOption(option =>
      option
        .setName('value')
        .setDescription('Set config item value')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(0),
  // Story commands
  new SlashCommandBuilder()
    .setName('story-create')
    .setDescription('Add a story to the list')
    .addStringOption(option =>
      option
        .setName('category')
        .setDescription('The category of the story')
        .setRequired(true)
        .addChoices(
          {
            name: 'Critical Win',
            value: StoryCategory.critWin,
          },
          {name: 'Win', value: StoryCategory.win},
          {
            name: 'Single Win',
            value: StoryCategory.singularWin,
          },
          {
            name: 'False Win',
            value: StoryCategory.falseWin,
          },
          {
            name: 'Loss',
            value: StoryCategory.loss,
          },
          {
            name: 'Total Loss',
            value: StoryCategory.totalLoss,
          },
          {
            name: 'Game Over',
            value: StoryCategory.gameover,
          },
        ),
    )
    .addStringOption(option =>
      option
        .setName('content')
        .setDescription('Content of the story')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(0),
  new SlashCommandBuilder()
    .setName('story-delete')
    .setDescription('Delete a story from the list')
    .addStringOption(option =>
      option.setName('id').setDescription('Id of the story').setRequired(true),
    )
    .setDefaultMemberPermissions(0),
  new SlashCommandBuilder()
    .setName('reset-all')
    .setDescription('Resets all player data')
    .setDefaultMemberPermissions(0),
];

export default commands;
