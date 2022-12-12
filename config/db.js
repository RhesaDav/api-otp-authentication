const mongoose = require("mongoose");

async function db() {
  try {
    await mongoose
      .connect(process.env.MONGO_URI)
      .then(() => console.log("database connected"));
  } catch (error) {
    console.log("error", error);
  }
}

module.exports = db;
