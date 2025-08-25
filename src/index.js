const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const router = require('./routes');
const initializeSocket = require('./socket');
const uploadConfig = require('./config/upload');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Em produção, restrinja para o domínio do seu frontend
        methods: ["GET", "POST"]
    }
});

initializeSocket(io);

const PORT = process.env.PORT || 3333;

app.use(express.json());
app.use('/files', express.static(uploadConfig.directory));
app.use('/api/v1', router);

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});