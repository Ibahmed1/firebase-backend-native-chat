const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");
const express = require("express");
const cors = require("cors");
const app = express();

const serviceAccount = require("./ADMIN_KEY.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://native-chat-cfcdc-default-rtdb.europe-west1.firebasedatabase.app",
});

const db = getFirestore();
const messagesTable = db.collection("messages");
const friendsTable = db.collection("friends");

app.use(cors({ origin: true }));

app.get("/user", async (req, res) => {
  const email = req.query.email;
  try {
    const user = await getAuth().getUserByEmail(email);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});
app.post("/friends", addFriend);
app.get("/friends", getFriends);

async function getFriends(req, res) {
  const userEmail = req.query.email;
  const user = (await getAuth().getUserByEmail(userEmail)).uid;
}

async function addFriend(req, res) {
  const { userEmail, friendEmail } = req.body;
  const userOneId = (await getAuth().getUserByEmail(userEmail)).uid;
  const userTwoId = (await getAuth().getUserByEmail(friendEmail)).uid;
  const friendsCheck1 = await friendsTable
    .where("user_one_id", "==", userOneId)
    .where("user_two_id", "==", userTwoId)
    .get();
  const friendsCheck2 = await friendsTable
    .where("user_one_id", "==", userTwoId)
    .where("user_two_id", "==", userOneId)
    .get();
  if (friendsCheck1.empty && friendsCheck2.empty)
    try {
      const res = await friendsTable.add({
        created_at: Timestamp.now(),
        user_one_id: userOneId,
        user_two_id: userTwoId,
      });
      return res.status(200).json({ message: "Friend added" });
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  return res.status(200).json({ incomplete: "Friend already exists" });
}

exports.app = functions.https.onRequest(app);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
