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

app.get("/user", getUser);
app.post("/friends", addFriend);
app.get("/friends", getFriends);
app.post("/messages", addMessage);
app.get("/messages", getMessages);

async function getUser(req, res) {
  const { email, id } = req.query;
  if (email)
    try {
      const user = await getAuth().getUserByEmail(email);
      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  else if (id)
    try {
      const user = await getAuth().getUser(id);
      return res.status(200).json({ email: user.email });
    } catch (error) {
      return res.status(500).json({ error: error });
    }
}

async function getMessages(req, res) {
  const { userEmail, friendEmail } = req.body;
  const userId = (await getAuth().getUserByEmail(userEmail)).uid;
  const friendId = (await getAuth().getUserByEmail(friendEmail)).uid;

  const messagesSent = await messagesTable
    .where("sender_id", "==", userId)
    .where("receiver_id", "==", friendId)
    .orderBy("created_at", "asc")
    .get();
  const messagesReceived = await messagesTable
    .where("sender_id", "==", friendId)
    .where("receiver_id", "==", userId)
    .orderBy("created_at", "asc")
    .get();
}

async function addMessage(req, res) {
  const { message, senderEmail, receiverEmail } = req.body;
  const senderId = (await getAuth().getUserByEmail(senderEmail)).uid;
  const receiverId = (await getAuth().getUserByEmail(receiverEmail)).uid;

  try {
    const response = await messagesTable.add({
      created_at: Timestamp.now(),
      message_text: message,
      sender_id: senderId,
      receiver_id: receiverId,
    });
    return res.status(200).json({ message: "Message sent" });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
}

async function getFriends(req, res) {
  const userEmail = req.query.email;
  const userId = (await getAuth().getUserByEmail(userEmail)).uid;
  const friends1 = await friendsTable.where("user_one_id", "==", userId).get();
  const friends2 = await friendsTable.where("user_two_id", "==", userId).get();
  let friendsArray = [];
  friends1.forEach((doc) => {
    let friend = doc.data();
    friend["id"] = doc.id;
    friendsArray.push(friend);
  });
  friends2.forEach((doc) => {
    let friend = doc.data();
    friend["id"] = doc.id;
    friendsArray.push(friend);
  });
  friendsArray.forEach((friend) => {
    if (friend["user_one_id"] === userId) {
      delete friend["user_one_id"];
      friend["friend_id"] = friend["user_two_id"];
      delete friend["user_two_id"];
    } else if (friend["user_two_id"] === userId) {
      delete friend["user_two_id"];
      friend["friend_id"] = friend["user_one_id"];
      delete friend["user_one_id"];
    }
  });
  return res.status(200).json({ friends: friendsArray });
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
      const response = await friendsTable.add({
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
