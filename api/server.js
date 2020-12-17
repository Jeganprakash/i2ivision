const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const { ExpressPeerServer } = require("peer");
const mongoose = require("mongoose");
const config = require("config");

const app = express();

const server = http.createServer(app);
const io = socketio(server).sockets;




//*Auth routes
app.use('/api/users', require("./routes/users"))


//** Peer Server */
const customGenerationFunction = () =>
  (Math.random().toString(36) + "0000000000000000000").substr(2, 16);

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/",
  generateClientId: customGenerationFunction

});



app.use("/peerjs", peerServer);

peerServer.on('connection', (client) => console.log("peer connected", client))

//** Config */
const db = config.get("mongoURI");
const Active = require('./schema/Active')
console.log(Active)

//mongo DB connection

mongoose.connect(db, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

//* Websocket *//
io.on("connection", function (socket) {
  console.log('user-connected')

  socket.on('hey', data => {
    console.log('hey', data)
  })

  socket.on("join-general-room", (roomID) => {
    socket.join(roomID);
    console.log(roomID);
  });

  socket.on('user-exists', ({ user, socketID }) => {
    console.log("user-exists", socketID)
    //check if the new user exists in active chat
    Active.findOne({ email: user.email }).then((user) => {
      //emit found to last connected user
      console.log("from so user-found", user)
      io.in(socketID).emit('user-found', user);
    }).catch(function (error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
      // ADD THIS THROW error
      throw error;
    });

    //Update user if found
    socket.on('update-user', ({ user, socketID, allUserRoomID }) => {
      socket.join(allUserRoomID);
      Active.findOneAndUpdate(
        { email: user.email },
        { $set: { socketID } },
        { new: true },
        (err, doc) => {
          if (doc) {
            //**send active users to last connected user */
            Active.find({}).then(allUsers => {
              const otherUsers = allUsers.filter(({ email: otherEmails }) => otherEmails !== user.email)
              console.log("otherusers", otherUsers)
              io.in(socketID).emit("activeUsers", otherUsers)
            });
          }
        }
      );

      //**Notify Other Users about Updated or joined User */
      socket.to(allUserRoomID).broadcast.emit("new-user-join", [{ ...user, socketID }]);
    });

    socket.on('user-join', ({ allUserRoomID, user, socketID }) => {
      console.log("from user-join server ", allUserRoomID, user, socketID)
      socket.join(allUserRoomID);
      //** store new user in active chats */
      const active = new Active({ ...user, socketID })

      //Find the document || add the document
      Active.findOne(
        { email: user.email }
      ).then(user => {
        if (!user) {
          active.save().then(({ email }) => {
            Active.find({}).then(users => {
              const otherUsers = users.filter(({ email: otherEmails }) => otherEmails !== email);

              //** send others to new connected user */
              io.in(socketID).emit('activeUsers', otherUsers);
            })
          });
        } else {
          //emit to all other users the last joined users
          socket.to(allUserRoomID).broadcast.emit("new-user-join", user);
        }
      })
    });

  })
  //Listen for peer connections

  socket.on('join-stream-room', ({ roomID, peerID, socketID, user }) => {
    socket.join(roomID);
    console.log('join-stream-room', peerID, roomID)
    socket.to(roomID).broadcast.emit("user-connected", {
      peerID,
      user,
      roomID,
      socketID,
    });
  })

});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server started on port ${port}`));
