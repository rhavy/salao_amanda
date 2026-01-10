const express = require('express');
const cors = require('cors');
const path = require('path');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Permitir conexões do app móvel
        methods: ["GET", "POST"]
    }
});

// Inicializa Migrações (Cria tabela/colunas se não existirem)
const runMigrations = require('./migrations');
runMigrations();

// Inicializa o handler de Chat
require('./socket/chatHandler')(io);

// Servir arquivos estáticos da pasta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROTAS ---
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const appointmentRoutes = require('./routes/appointments');
const userRoutes = require('./routes/user');
const configRoutes = require('./routes/config');
const chatRoutes = require('./routes/chat');
const financeRoutes = require('./routes/finance');
const categoryRoutes = require('./routes/categories');

app.use('/auth', authRoutes);
app.use('/services', serviceRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/user', userRoutes);
app.use('/config', configRoutes);
app.use('/chat', chatRoutes);
app.use('/finance', financeRoutes);
app.use('/categories', categoryRoutes);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🌸 Salão Amanda Backend + Socket.io rodando em http://localhost:${PORT}`);
});