import {QueryInterface} from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS timeline_events;

      CREATE TABLE IF NOT EXISTS timeline_events (
        id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4(),
        "playerId" VARCHAR NOT NULL REFERENCES players (id) ON DELETE CASCADE,
        "promptId" UUID REFERENCES prompts (id),
        "eventType" VARCHAR NOT NULL,
        roll INTEGER NOT NULL,
        "candyAmount" INTEGER NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() at time zone 'utc')
      );
    `);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS timeline_events;
    `);
  },
};
