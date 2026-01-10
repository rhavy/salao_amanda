const db = require('../db');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('⚡ Novo cliente conectado:', socket.id);

        // Usuário entra na "sala" com seu email
        socket.on('join_room', (email) => {
            if (email) {
                socket.join(email);
                console.log(`📩 Cliente ${socket.id} entrou na sala: ${email}`);
            }
        });

        // Enviar mensagem
        socket.on('send_message', async (data) => {
            const { email, content, sender } = data; // sender: 'user' ou 'admin'

            try {
                // 1. Salvar no banco
                await db.query('INSERT INTO messages (user_email, sender, content) VALUES (?, ?, ?)', [email, sender || 'user', content]);

                // 2. Emitir para a sala do usuário (quem enviou também recebe se estiver ouvindo, útil para sync)
                // Se foi o usuário mandando, ele já tem a msg localmente (optimistic), mas o 'admin' precisa receber
                // Se foi 'admin' mandando, o usuário precisa receber

                // Simplesmente emitimos 'new_message' para a sala
                io.to(email).emit('new_message', {
                    id: Date.now(), // ID provisório até recarregar histórico ou usar insertId
                    user_email: email,
                    sender: sender || 'user',
                    content,
                    created_at: new Date().toISOString()
                });

                // 3. Simulação de Resposta do Admin
                if (sender === 'user') {
                    setTimeout(async () => {
                        const replyContent = 'Olá! Recebemos sua mensagem via WebSocket ⚡. Em breve responderemos.';

                        // Salva resposta
                        await db.query('INSERT INTO messages (user_email, sender, content) VALUES (?, ?, ?)', [email, 'admin', replyContent]);

                        // Envia resposta para a sala
                        io.to(email).emit('new_message', {
                            id: Date.now() + 1,
                            user_email: email,
                            sender: 'admin',
                            content: replyContent,
                            created_at: new Date().toISOString()
                        });
                    }, 2000); // 2 segundos
                }

            } catch (error) {
                console.error("Erro no socket send_message:", error);
                socket.emit('error', 'Falha ao processar mensagem');
            }
        });

        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
        });
    });
};
