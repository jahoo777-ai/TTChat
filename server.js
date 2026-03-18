const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const cors = require('cors');

const app = express();
app.use(cors());

// Додаємо базовий маршрут, щоб Render бачив, що сервер живий
app.get('/', (req, res) => { res.send('TikTok Server is running!'); });

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

        tiktokConn.on('chat', data => {
            socket.emit('chat', { user: data.uniqueId, comment: data.comment });
        });
    });

    socket.on('disconnect', () => {
        if (tiktokConn) tiktokConn.disconnect();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
