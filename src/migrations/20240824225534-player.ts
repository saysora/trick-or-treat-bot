import {QueryInterface} from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "players" (
        id VARCHAR PRIMARY KEY,
        "serverId" VARCHAR NOT NULL,
        "isDead" BOOLEAN DEFAULT false,
        "latestAttempt" TIMESTAMP WITH TIME ZONE DEFAULT (now() at time zone 'utc'),
        candy INTEGER DEFAULT 0,
        "gatherAttempts" INTEGER DEFAULT 0,
        "lostCandyCount" INTEGER DEFAULT 0,
        "allCandyLostCount" INTEGER DEFAULT 0,
        "destroyedCandy" INTEGER DEFAULT 0
      );
    `);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS players;
    `);
  },
};
