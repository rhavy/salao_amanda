const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota para buscar a lista de conversas ativas (para o admin)
router.get('/admin/list', async (req, res) => {
    try {
        // Busca usuários que enviaram mensagens, ordenados pela última mensagem
        // Supondo que 'messages' tem 'user_email' e 'created_at'
        const [chats] = await db.query(`
            SELECT 
                m.user_email AS email,
                u.name,
                (SELECT content FROM messages WHERE user_email = m.user_email ORDER BY created_at DESC LIMIT 1) AS lastMessage,
                (SELECT created_at FROM messages WHERE user_email = m.user_email ORDER BY created_at DESC LIMIT 1) AS lastMessageTime,
                (SELECT COUNT(*) FROM messages WHERE user_email = m.user_email AND is_read = 0 AND sender = 'user') AS unreadCount
            FROM messages m
            JOIN users u ON m.user_email = u.email
            GROUP BY m.user_email, u.name
            ORDER BY lastMessageTime DESC
        `);
        // Adicionar um campo 'unread' booleano para a renderização do frontend
        const formattedChats = chats.map(chat => ({
            ...chat,
            unread: chat.unreadCount > 0 // Cria a propriedade 'unread' baseada na contagem
        }));
        
        res.json(formattedChats);
    } catch (error) {
        console.error("Erro ao buscar lista de chats para admin:", error);
        res.status(500).json({ message: 'Erro ao buscar lista de conversas.', error: error.message });
    }
});

        
// Rota para o cliente buscar suas próprias mensagens
router.get('/my-messages', async (req, res) => {
    // req.user.email comes from authMiddleware
    const userEmail = req.user.email; 

    try {
        const [rows] = await db.query('SELECT * FROM messages WHERE user_email = ? ORDER BY created_at ASC', [userEmail]);
        res.json(rows);
    } catch (error) {
        console.error(`Erro ao buscar minhas mensagens para ${userEmail}:`, error);
        res.status(500).json({ message: 'Erro ao buscar minhas mensagens.', error: error.message });
    }
});

// Rota para buscar mensagens de um usuário
router.get('/:email', async (req, res) => {
    const { email } = req.params;

    try {
        // Busca mensagens
        const [rows] = await db.query('SELECT * FROM messages WHERE user_email = ? ORDER BY created_at ASC', [email]);
        
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar mensagens.', error: error.message });
    }
});

// Rota para enviar mensagem
router.post('/', async (req, res) => {
    const { email, content, sender } = req.body; // sender: 'user' ou 'admin'

    try {
        await db.query('INSERT INTO messages (user_email, sender, content) VALUES (?, ?, ?)', [email, sender || 'user', content]);

        res.status(201).json({ message: 'Mensagem enviada!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao enviar mensagem.', error: error.message });
    }
});

module.exports = router;
