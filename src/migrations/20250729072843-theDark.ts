import {QueryInterface} from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS the_dark (
        id SERIAL PRIMARY KEY,
        target_id VARCHAR REFERENCES players ("id"),
        status VARCHAR
      );

    INSERT INTO the_dark VALUES (1, null, 'Inactive')
    `);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS the_dark;
    `);
  },
};
