const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');

const PUBLIC_FOLDER = 'public';

app.use(express.static(PUBLIC_FOLDER));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, PUBLIC_FOLDER, 'index.html'));
});

const connectedClients = {};

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('login', (userId) => {
    connectedClients[userId] = socket.id;
    console.log(`User ${userId} logged in`);
    console.log('Connected clients:', connectedClients);

    // Let the client know they're logged in
    socket.emit('login', userId);
  });

  socket.on('message', (data) => {
    const { sender, recipient, message } = data;

    console.log(`Received message from ${sender} to ${recipient}: ${message}`);

    const recipientSocketId = connectedClients[recipient];
    const senderSocketId = connectedClients[sender];

    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message', { sender, message });
    } else {
      console.log(`Recipient ${recipient} not found`);
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit('message', { sender, message });
    } else {
      console.log(`Sender ${sender} not found`);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    // Remove the client from the connected clients list
    const userId = Object.keys(connectedClients).find(key => connectedClients[key] === socket.id);
    if (userId) {
      delete connectedClients[userId];
    }
    console.log('Connected clients:', connectedClients);
  });
});

server.listen(3000, 'localhost', () => {
  console.log('Server running at http://localhost:3000/');
});
