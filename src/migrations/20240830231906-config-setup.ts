import {QueryInterface} from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE config (
        id INTEGER PRIMARY KEY generated always as identity,
        enabled BOOLEAN DEFAULT FALSE,
        "cooldownEnabled" BOOLEAN DEFAULT FALSE,
        "cooldownTime" INTEGER,
        "cooldownUnit" VARCHAR,
        "startDate" VARCHAR,
        "endDate" VARCHAR
      );

      INSERT INTO config ("cooldownTime", "cooldownUnit") VALUES (15, 'm');
    `);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS config;
    `);
  },
};
