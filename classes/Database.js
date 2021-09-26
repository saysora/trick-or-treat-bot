const mongoose = require("mongoose");
require("dotenv").config();

const db = mongoose.connect(process.env.MONGODB, {});

module.exports = class Database {
  static db() {
    return db;
  }

  static async connect() {
    const db = mongoose.connection;

    db.on("error", console.error.bind("Connection error:"));
    db.once("open", () => {
      console.log("Connected to Player DB");
    });
  }
};
