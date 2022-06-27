# firebase-backend-native-chat

## Overview

This is a personal project of mine built to learn how React Native and Firebase work. This is a messaging app which users must sign up and log in using email, they can then add friends via email address and then send and receive messages from their friends.

This is the backend of the app which deals with all queries to the firebase cloud firestore database.

## In progress

Currently in progress is creating the get to the /messages endpoint which will expect a user and a friend email from a fetch request from the frontend. Using these emails, a query will be made to the messages database and will return an array (ordered by sent_at) containing all messages (and who sent/received them) between the two users.
