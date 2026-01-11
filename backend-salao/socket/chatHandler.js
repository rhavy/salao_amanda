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

                            const [result] = await db.query(

                                'INSERT INTO messages (user_email, sender, content, is_read) VALUES (?, ?, ?, ?)',

                                [email, sender || 'user', content, sender === 'admin' ? 1 : 0]

                            );

            

                            const messageId = result.insertId; // Captura o ID gerado

            

                            // 2. Emitir para a sala do usuário (quem enviou também recebe se estiver ouvindo, útil para sync)

                            // Se foi o usuário mandando, ele já tem a msg localmente (optimistic), mas o 'admin' precisa receber

                            // Se foi 'admin' mandando, o usuário precisa receber

            

                            // Simplesmente emitimos 'new_message' para a sala

                            io.to(email).emit('new_message', {

                                id: messageId, // Usar o ID real do banco de dados

                                user_email: email,

                                sender: sender || 'user',

                                content,

                                created_at: new Date().toISOString()

                            });

                        } catch (error) {

                            console.error("Erro no socket send_message (DB INSERT):", error);

                            socket.emit('error', { message: 'Falha ao processar mensagem no DB', error: error.message });

                        }
        });

        socket.on('mark_read', async ({ userEmail, actor }) => {
            try {
                if (actor === 'user') {
                    // User is marking messages from admin as read
                    await db.query(
                        'UPDATE messages SET is_read = 1 WHERE user_email = ? AND sender = "admin" AND is_read = 0',
                        [userEmail]
                    );
                    // Emit to admin to notify messages sent to this user are read
                    io.to('admin_room').emit('message_read_receipt', {
                        readerEmail: userEmail,
                        readByUserEmail: 'admin', // The messages read were sent by admin
                        actor: 'user',
                        timestamp: new Date().toISOString()
                    });
                } else if (actor === 'admin') {
                    // Admin is marking messages from user as read
                    await db.query(
                        'UPDATE messages SET is_read = 1 WHERE user_email = ? AND sender = "user" AND is_read = 0',
                        [userEmail]
                    );
                    // Emit to the user whose messages were read
                    io.to(userEmail).emit('message_read_receipt', {
                        readerEmail: 'admin', // The messages read were sent by user
                        readByUserEmail: userEmail,
                        actor: 'admin',
                        timestamp: new Date().toISOString()
                    });
                }
                console.log(`✅ Mensagens de ${userEmail} marcadas como lidas por ${actor}.`);
            } catch (error) {
                console.error("❌ Erro ao marcar mensagens como lidas no DB:", error);
                socket.emit('error', { message: 'Falha ao marcar mensagens como lidas no DB', error: error.message });
            }
        });

        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
        });
    });
};
