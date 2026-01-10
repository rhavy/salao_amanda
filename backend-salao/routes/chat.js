const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota para buscar mensagens de um usuário
router.get('/:email', async (req, res) => {
    const { email } = req.params;

    try {
        // Busca mensagens
        const [rows] = await db.query('SELECT * FROM messages WHERE user_email = ? ORDER BY created_at ASC', [email]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar mensagens.' });
    }
});

// Rota para enviar mensagem
router.post('/', async (req, res) => {
    const { email, content, sender } = req.body; // sender: 'user' ou 'admin'

    try {
        await db.query('INSERT INTO messages (user_email, sender, content) VALUES (?, ?, ?)', [email, sender || 'user', content]);

        // Simulação de resposta automática do admin (opcional, para teste)
        if (sender === 'user') {
            setTimeout(async () => {
                await db.query('INSERT INTO messages (user_email, sender, content) VALUES (?, ?, ?)', [email, 'admin', 'Olá! Recebemos sua mensagem. Em breve um atendente entrará em contato.']);
            }, 5000); // Responde em 5 segundos
        }

        res.status(201).json({ message: 'Mensagem enviada!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao enviar mensagem.' });
    }
});

module.exports = router;
