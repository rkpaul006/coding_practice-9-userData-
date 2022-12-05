const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const passWordLength = (password) => {
  return password.length > 4;
};
///
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassWord = await bcrypt.hash(request.body.password, 10);
  const userQuery = `
    SELECT * FROM user WHERE username = "${username}"`;
  const dbUser = await db.get(userQuery);

  if (dbUser === undefined) {
    const createUserQuery = `
        INSERT INTO 
          user (username, name, password, gender, location)
        VALUES (
            "${username}",
            "${name}",
            "${hashedPassWord}",
            "${gender}",
            "${location}"
        );`;
    if (passWordLength(password)) {
      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login//
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `SELECT * FROM user WHERE username = "${username}"`;
  const dbUser = await db.get(userQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//changePassword//
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `SELECT * FROM user WHERE username = "${username}";`;
  const dbUser = await db.get(userQuery);
  if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPasswordMatch === true) {
      const hashedPassword1 = await bcrypt.hash(newPassword, 10);
      const updatedPassword = `
        UPDATE
          user
        SET password = "${hashedPassword1}";`;
      db.run(updatedPassword);
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
