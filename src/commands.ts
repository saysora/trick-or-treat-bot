import {SlashCommandBuilder} from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('go-out')
    .setDescription('Use this command to begin trick-or-treating'),
  new SlashCommandBuilder()
    .setName('trick-or-treat')
    .setDescription('Gather candy'),
  new SlashCommandBuilder().setName('tot').setDescription('Gather candy'),
];

export default commands;
