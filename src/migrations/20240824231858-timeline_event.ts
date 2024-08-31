import {QueryInterface} from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id VARCHAR PRIMARY KEY,
        "playerId" VARCHAR NOT NULL REFERENCES players (id),
        "promptId" UUID NOT NULL REFERENCES prompts (id),
        date TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS timeline_events;
    `);
  },
};
