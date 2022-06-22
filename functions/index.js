const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
const express = require("express");
const cors = require("cors");
const app = express();

const serviceAccount = require("./ADMIN_KEY.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://native-chat-cfcdc-default-rtdb.europe-west1.firebasedatabase.app",
});

app.use(cors({ origin: true }));

app.get("/hello-world", (req, res) => {
  return res.status(200).send("Hello World!");
});
app.get("/user", async (req, res) => {
  const email = req.query.email;
  try {
    const user = await getAuth().getUserByEmail(email);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json(error);
  }
});

exports.app = functions.https.onRequest(app);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
