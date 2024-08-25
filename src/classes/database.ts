import 'dotenv/config';
import * as path from 'node:path';
import {Sequelize} from 'sequelize-typescript';

const DB_VARS = ['DBNAME', 'DBUSER', 'DBPASS', 'DBHOST', 'DBPORT'];

DB_VARS.forEach(envVar => {
  if (!(envVar in process.env)) {
    throw Error(`Missing ${envVar}`);
  }
});

const modelPaths = path.join(__dirname, '..', 'models/**/*.js');

export const db = new Sequelize({
  host: process.env.DBHOST,
  database: process.env.DBNAME,
  username: process.env.DBUSER,
  password: process.env.DBPASS,
  port: Number(process.env.DBPORT ?? 5432),
  dialect: 'postgres',
  models: [modelPaths],
});
