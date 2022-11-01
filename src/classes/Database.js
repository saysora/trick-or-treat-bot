import mongoose from "mongoose";

const url = process.env.MONGODB_URL;
const mongodb = process.env.MONGODB;
const user = process.env.MONGODB_USER;
const pass = process.env.MONGODB_PASS;
const auth = process.env.MONGO_AUTH;

const mongostring = `mongodb://${url}/${mongodb}`;

export class Database {
  db;

  constructor() {
    this.db = mongoose.connection;
  }

  connect() {
    mongoose.connect(mongostring, {
      authSource: auth,
      user,
      pass,
    });

    const db = mongoose.connection;
    this.db = db;

    db.on("error", console.error.bind("Connection error:"));
    db.once("open", () => {
      console.log("Connected to Mog DB");
    });
  }

  disconnect() {
    this.db.close();
  }

  reconnect() {
    this.db.close();
    this.connect();
  }
}
