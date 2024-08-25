import 'dotenv/config';

module.exports = {
  development: {
    username: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME,
    host: process.env.DBHOST,
    port: Number(process.env.DBPORT),
    dialect: 'postgres',
  },
  prod: {
    username: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME,
    host: process.env.DBHOST,
    port: Number(process.env.DBPORT),
    dialect: 'postgres',
  },
};
