const fs = require("fs");
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.json({ extended: false }));

const { v4: uuid4 } = require("uuid");
const { randomInt } = require("crypto");

const ROOM_TABLE = "ROOM_TABLE";
const USER_TABLE = "USER_TABLE";

const VOTING = 1;
const FREEZE = 2;

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: true,
    optionsSuccessStatus: 204,
  })
);

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const tables = {};

const getTable = (tableName) => {
  if (tables[tableName]) return tables[tableName];
  else {
    tables[tableName] = [];
    return [];
  }
  // const data = JSON.parse(
  //   fs.readFileSync(__dirname + "\\" + tableName, { flag: "a+" }).toString() ||
  //     `[]`
  // );
  // return data;
};
const updateTable = (tableName, data) => {
  if (!tables[tableName]) {
    tables[tableName] = [];
  }
  tables[tableName] = data;
  // fs.writeFileSync(__dirname + tableName, JSON.stringify(data, null, " "));
};

////////////////////////////////////////////
app.get("", (req, res) => {
  return res.send("Estiamte Poker v0.1\n https://pokero.ir");
});

/* 
این متد برای ایجاد یک اتاق استفاده میشود
برای ایجاد اتاق دو پارامتر نام کاربری و شماره اتاق الزامی است
username
ticket
*/
app.post("/room/create", (req, res) => {
  req;
  const { username, ticket } = req.body;
  let rooms = getTable(ROOM_TABLE);
  const users = getTable(USER_TABLE);

  if (rooms.find((i) => i.ticket == ticket))
    return res
      .status(400)
      .send({ message: "this room is already exists,refresh page" });

  if (!username || username.trim() == "")
    return res.status(400).send({ message: "username is invalid" });

  const new_user = {
    username,
    id: uuid4(),
    image: "https://i.pravatar.cc/150?img=" + (randomInt(0, 70) + 1).toString(),
  };

  users.push(new_user);

  const new_room = {
    ticket,
    id: uuid4(),
    users: [new_user.id],
    votes: [],
    ownerId: new_user.id,
    description: "",
    status: VOTING,
  };

  rooms.push(new_room);

  updateTable(ROOM_TABLE, rooms);
  updateTable(USER_TABLE, users);

  return res.status(200).send({
    message: "",
    data: {
      room: new_room,
      user: new_user,
      users: [new_user],
    },
  });
});
/* 
این متد برای پیوستن به یک اتاق استفاده میشود
برای پیوستن به اتاق دو پارامتر نام کاربری و شماره اتاق الزامی است
username
ticket
*/
app.post("/room/join", (req, res) => {
  const { username, ticket } = req.body;
  const rooms = getTable(ROOM_TABLE);
  const users = getTable(USER_TABLE);
  const room = rooms.find((i) => i.ticket == ticket);
  if (!room)
    return res
      .status(404)
      .send({ message: "this room not found,check ticket code" });
  const new_user = {
    username,
    id: uuid4(),
    image: "https://i.pravatar.cc/150?img=" + (randomInt(12) + 1).toString(),
  };

  users.push(new_user);
  room.users.push(new_user.id);

  updateTable(ROOM_TABLE, rooms);
  updateTable(USER_TABLE, users);

  return res.status(200).send({
    message: "",
    data: {
      room,
      user: new_user,
      users: room.users
        .map((i) => users.find((j) => j.id == i))
        .map((i) => ({ ...i, isAdmin: i.id == room.ownerId })),
    },
  });
});
/* 
این متد برای خروج از یک اتاق استفاده میشود
برای پیوستن به اتاق دو پارامتر نام کاربری و شماره اتاق الزامی است
username
ticket
*/
app.post("/room/leave", (req, res) => {
  const { userId, ticket } = req.body;
  let rooms = getTable(ROOM_TABLE);
  const users = getTable(USER_TABLE);
  const room = rooms.find((i) => i.ticket == ticket);
  const user = users.find((i) => i.id == userId);
  if (!room)
    return res
      .status(404)
      .send({ message: "this room not found,check ticket code" });
  if (!user)
    return res
      .status(404)
      .send({ message: "user not found,check ticket code" });

  room.users = room.users.filter((i) => i != userId);
  rooms = rooms.filter((i) => i.ticket != ticket);
  rooms.push(room);
  if (room.ownerId == userId) {
    if (room.users.length > 0) {
      room.ownerId = room.users[0];
      rooms = rooms.filter((i) => i.ticket != ticket);
      rooms.push(room);
    } else rooms = rooms.filter((i) => i.id != room.id);
  }

  updateTable(ROOM_TABLE, rooms);

  return res.status(200).send({ message: "", data: {} });
});
/* 
این متد برای گرفتن وضعیت فعلی اتاق استفاده میشود
*/
app.get("/room/state", (req, res) => {
  const { userId, ticket } = req.query;
  const rooms = getTable(ROOM_TABLE);
  const users = getTable(USER_TABLE);
  const room = rooms.find((i) => i.ticket == ticket);
  const user = users.find((i) => i.id == userId);
  if (!room)
    return res
      .status(404)
      .send({ message: "room not found,check ticket code" });
  if (!user)
    return res.status(404).send({ message: "user not found,check username" });
  const vote = room.votes.find((i) => i.userId == userId);
  return res.status(200).send({
    message: "",
    data: {
      room: {
        ...room,
        votes: room.votes.map((i) => ({
          ...i,
          ...users.find((j) => i.userId == j.id),
          vote: room.status == FREEZE ? i.vote : -1,
        })),
      },
      user,
      isAdmin: room.ownerId == user.id,
      yourVote: vote ? vote.vote : -1,
      status: room.status,
      users: room.users
        .map((i) => users.find((j) => j.id == i))
        .map((i) => ({ ...i, isAdmin: i.id == room.ownerId }))
        .map((i) => ({
          ...i,
          hasVoted: Boolean(room.votes.find((j) => j.userId == i.id)),
        })),
    },
  });
});
/* 
از این متد برای ست کردن توضیح ایتم استفاده میشود 
*/
app.post("/room/set-desc", (req, res) => {
  const { userId, ticket, description } = req.body;
  let rooms = getTable(ROOM_TABLE);
  const users = getTable(USER_TABLE);
  const room = rooms.find((i) => i.ticket == ticket);
  const user = users.find((i) => i.id == userId);
  if (!room)
    return res
      .status(404)
      .send({ message: "this room not found,check ticket code" });
  if (!user)
    return res
      .status(404)
      .send({ message: "user not found,check ticket code" });

  room.description = description;
  rooms = rooms.filter((i) => i.ticket != ticket);
  rooms.push(room);
  updateTable(ROOM_TABLE, rooms);

  return res.status(200).send({ message: "", data: {} });
});
/* 
برای حذف یوزر ها توسط کاربر ادمین 
*/
app.post("/user/remove", (req, res) => {
  const { userId, ticket, userIdToRemove } = req.body;
  let rooms = getTable(ROOM_TABLE);
  const users = getTable(USER_TABLE);
  const room = rooms.find((i) => i.ticket == ticket);
  const user = users.find((i) => i.id == userId);
  if (!room)
    return res
      .status(404)
      .send({ message: "this room not found,check ticket code" });
  if (!user)
    return res
      .status(404)
      .send({ message: "user not found,check ticket code" });

  if (!userIdToRemove)
    return res.status(404).send({ message: "userId to remove is required" });

  if (room.ownerId != userId || userId == userIdToRemove)
    return res.status(401).send({ message: "not allowed" });

  room.users = room.users.filter((i) => i != userIdToRemove);
  room.votes = room.votes.filter((i) => i.userId != userIdToRemove);
  rooms = rooms.filter((i) => i.ticket != ticket);
  rooms.push(room);
  updateTable(ROOM_TABLE, rooms);

  return res.status(200).send({ message: "", data: {} });
});
/* 
از این متد برای ست کردن توضیح ایتم استفاده میشود 
*/
app.post("/vote", (req, res) => {
  const { userId, ticket, vote } = req.body;
  let rooms = getTable(ROOM_TABLE);
  const users = getTable(USER_TABLE);
  const room = rooms.find((i) => i.ticket == ticket);
  const user = users.find((i) => i.id == userId);
  if (!room)
    return res
      .status(404)
      .send({ message: "this room not found,check ticket code" });
  if (!user)
    return res
      .status(404)
      .send({ message: "user not found,check ticket code" });

  if (room.status != VOTING)
    return res.status(401).send({ message: "you cant vote now" });

  const new_vote = {
    userId,
    vote,
  };

  room.votes = room.votes.filter((i) => i.userId != userId);
  if (vote != -1) room.votes.push(new_vote);
  rooms = rooms.filter((i) => i.ticket != ticket);
  rooms.push(room);

  updateTable(ROOM_TABLE, rooms);

  return res.status(200).send({ message: "", data: {} });
});
/* 
از این متد برای ست کردن وضعیت ایتم استفاده میشود 
*/
app.post("/status", (req, res) => {
  const { userId, ticket, status } = req.body;
  let rooms = getTable(ROOM_TABLE);
  const users = getTable(USER_TABLE);
  const room = rooms.find((i) => i.ticket == ticket);
  const user = users.find((i) => i.id == userId);
  if (!room)
    return res
      .status(404)
      .send({ message: "this room not found,check ticket code" });
  if (!user)
    return res
      .status(404)
      .send({ message: "user not found,check ticket code" });

  room.status = status;
  rooms = rooms.filter((i) => i.ticket != ticket);
  rooms.push(room);
  updateTable(ROOM_TABLE, rooms);
  return res.status(200).send({ message: "", data: {} });
});
/* 
از این متد برای ریست کردن ایتم استفاده میشود 
*/
app.post("/reset", (req, res) => {
  const { userId, ticket } = req.body;
  let rooms = getTable(ROOM_TABLE);
  const users = getTable(USER_TABLE);
  let room = rooms.find((i) => i.ticket == ticket);
  const user = users.find((i) => i.id == userId);
  if (!room)
    return res
      .status(404)
      .send({ message: "this room not found,check ticket code" });
  if (!user)
    return res
      .status(404)
      .send({ message: "user not found,check ticket code" });

  room = {
    ...room,
    votes: [],
    description: "",
    status: VOTING,
  };
  rooms = rooms.filter((i) => i.ticket != ticket);
  rooms.push(room);
  updateTable(ROOM_TABLE, rooms);
  return res.status(200).send({ message: "", data: {} });
});
/* 
از این متد برای ریست کردن  رای ها وضعیت ایتم استفاده میشود 
*/
app.post("/resetVote", (req, res) => {
  const { userId, ticket } = req.body;
  let rooms = getTable(ROOM_TABLE);
  const users = getTable(USER_TABLE);
  const room = rooms.find((i) => i.ticket == ticket);
  const user = users.find((i) => i.id == userId);
  if (!room)
    return res
      .status(404)
      .send({ message: "this room not found,check ticket code" });
  if (!user)
    return res
      .status(404)
      .send({ message: "user not found,check ticket code" });

  room.votes = [];
  room.status = VOTING;
  rooms = rooms.filter((i) => i.ticket != ticket);
  rooms.push(room);
  updateTable(ROOM_TABLE, rooms);
  return res.status(200).send({ message: "", data: {} });
});

/* 
update user
*/
app.post("/user/update", (req, res) => {
  req;
  const { userId, username, image } = req.body;
  let users = getTable(USER_TABLE);

  if (!username || username.trim() == "")
    return res.status(400).send({ message: "username is invalid" });

  const user = users.find((i) => i.id == userId);
  if (!user)
    return res
      .status(404)
      .send({ message: "user not found,check ticket code" });

  user.username = username;
  user.image = image;
  users = users.filter((i) => i.id != userId);
  users.push(user);

  updateTable(USER_TABLE, users);

  return res.status(200).send({});
});

app.get("/", (req, res) => {
  return res.send("Estiamte Poker v2.0");
});

app.listen(3000, "0.0.0.0", () => {
  console.log(`listening on http://0.0.0.0:3000/`);
}).timeout = 2000;
