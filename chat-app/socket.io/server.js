const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const users = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('user_join', (username) => {
        if (!username || username.trim() === '') {
            socket.emit('join_error', 'Username cannot be empty');
            return;
        }
        
        users.set(socket.id, username);
        console.log(`${username} joined the chat`);
        
        socket.broadcast.emit('user_joined', username);
        socket.emit('user_list', Array.from(users.values()));
        socket.emit('join_success', true);
    });

    socket.on('send_message', (data) => {
        const username = users.get(socket.id);
        if (!username) return;
        
        io.emit('receive_message', {
            username: username,
            message: data.message,
            timestamp: new Date().toLocaleTimeString()
        });
    });

    socket.on('typing_start', () => {
        const username = users.get(socket.id);
        if (username) {
            socket.broadcast.emit('user_typing', username);
        }
    });

    socket.on('typing_stop', () => {
        socket.broadcast.emit('user_stopped_typing');
    });

    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        if (username) {
            users.delete(socket.id);
            socket.broadcast.emit('user_left', username);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});