import {QueryInterface} from 'sequelize';

module.exports = {
  async up(q: QueryInterface) {
    await q.sequelize.query(`
      ALTER TABLE players
        ADD COLUMN IF NOT EXISTS status VARCHAR,
        ADD COLUMN IF NOT EXISTS status_set timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text);
    `);
  },

  async down(q: QueryInterface) {
    await q.sequelize.query(`
      ALTER TABLE players
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS status_set;
    `);
  },
};
