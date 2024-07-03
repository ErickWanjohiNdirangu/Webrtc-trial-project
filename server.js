const http = require("http");
const socketio = require("socket.io");
const express = require("express");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static("static"));

app.get("/", (req, res) => {
  io.on("connection", (socket) => {
    console.log("new connection active");

    socket.on("signalling", (msg) => {
      // console.log(msg);

      socket.broadcast.emit("serverResponse", msg);
    });
  });
  res.sendFile(__dirname + "/video.html");
});

server.listen(5050, console.log("server is listening on port 5050"));
