import {SlashCommandBuilder} from 'discord.js';

const commands = [
  // TODO: Add in leaderboard and backpack comands
  new SlashCommandBuilder()
    .setName('go-out')
    .setDescription('Use this command to begin trick-or-treating'),
  new SlashCommandBuilder()
    .setName('trick-or-treat')
    .setDescription('Gather candy'),
  new SlashCommandBuilder().setName('tot').setDescription('Gather candy'),

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
          {name: 'Game End Date', value: 'endDate'}
        )
    )
    .addStringOption(option =>
      option
        .setName('value')
        .setDescription('Set config item value')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(0),
];

export default commands;
