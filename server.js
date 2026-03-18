const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => { res.send('TikTok Server is alive!'); });

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    let tiktokConn;

    socket.on('setUniqueId', (username) => {
        if (tiktokConn) tiktokConn.disconnect();

        tiktokConn = new WebcastPushConnection(username);

        tiktokConn.connect()
            .then(state => socket.emit('connected', state))
            .catch(err => socket.emit('error', err.toString()));

        // Отримуємо чат та передаємо потрібні дані
        tiktokConn.on('chat', data => {
            socket.emit('chat', { 
                nickname: data.uniqueId, 
                comment: data.comment,
                profilePicture: data.profilePictureUrl 
            });
        });
    });

    socket.on('disconnect', () => {
        if (tiktokConn) tiktokConn.disconnect();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
