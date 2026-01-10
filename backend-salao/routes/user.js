const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de avatar
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/avatars/');
    },
    filename: function (req, file, cb) {
        // Usa o email do usuário (se disponível) para um nome de arquivo mais descritivo
        const userEmail = req.body.email ? req.body.email.split('@')[0] : 'user';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${userEmail}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });


// GET /profile/:email - Retorna dados do perfil e contagem de agendamentos
router.get('/profile/:email', async (req, res) => {
    const { email } = req.params;

    try {
        // 1. Busca os dados básicos e configurações do usuário
        const [userRows] = await db.query(`
            SELECT name, email, avatar, memberSince, phone, cpf, birthDate, 
                   notifications_reminders, notifications_marketing, privacy_use_photos 
            FROM users WHERE email = ?
        `, [email]);

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const user = userRows[0];

        // Converter bit/tinyint para boolean JS se necessário (MySQL retorna 0/1)
        user.notifications_reminders = !!user.notifications_reminders;
        user.notifications_marketing = !!user.notifications_marketing;
        user.privacy_use_photos = !!user.privacy_use_photos;

        // 2. Conta os agendamentos total (concluídos ou não)
        const [countRows] = await db.query('SELECT COUNT(*) as appointmentsCount FROM appointments WHERE user_email = ?', [email]);

        res.json({
            ...user,
            appointmentsCount: countRows[0].appointmentsCount
        });

    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar perfil do usuário: ' + error.message });
    }
});

// PUT /profile - Atualiza dados do usuário
router.put('/', async (req, res) => {
    const { email, name, phone, notifications_reminders, notifications_marketing, privacy_use_photos } = req.body;

    try {
        // Construção dinâmica da query seria melhor, mas para simplicidade vamos atualizar tudo ou manter o atual
        // Mas como podemos mandar parciais, o ideal é atualizar campos específicos se vierem
        // Vamos assumir que o frontend manda o objeto "user" atualizado ou campos específicos.

        // Estratégia: Update fixo com COALESCE (mantém o valor antigo se o novo for nulo) não funciona bem para updates parciais em JS simples sem query builder.
        // Vamos fazer 3 queries separadas ou uma query grande assumindo que o FE manda tudo. 
        // Vamos assumir que o FE manda TUDO o que é editável 'Dados Pessoais' ou 'Configs'.

        // Vamos permitir atualizar grupos de dados.
        // Se vier 'name', atualiza perfil basico. Se vier 'notifications_reminders', atualiza configs.

        let sql = 'UPDATE users SET ';
        const params = [];
        const updates = [];

        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
        if (notifications_reminders !== undefined) { updates.push('notifications_reminders = ?'); params.push(notifications_reminders); }
        if (notifications_marketing !== undefined) { updates.push('notifications_marketing = ?'); params.push(notifications_marketing); }
        if (privacy_use_photos !== undefined) { updates.push('privacy_use_photos = ?'); params.push(privacy_use_photos); }

        if (updates.length === 0) {
            return res.json({ message: 'Nada para atualizar.' });
        }

        sql += updates.join(', ') + ' WHERE email = ?';
        params.push(email);

        await db.query(sql, params);
        res.json({ message: 'Dados atualizados com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar: ' + error.message });
    }
});

// POST /profile/avatar - Faz upload de uma nova imagem de avatar
router.post('/profile/avatar', upload.single('avatar'), async (req, res) => {
    const { email } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }
    if (!email) {
        return res.status(400).json({ message: 'O email do usuário é obrigatório.' });
    }

    try {
        // O caminho do arquivo deve ser acessível pela web, então usamos /uploads/...
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        // Atualiza o caminho do avatar no banco de dados
        await db.query('UPDATE users SET avatar = ? WHERE email = ?', [avatarUrl, email]);

        res.json({ message: 'Avatar atualizado com sucesso!', avatarUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao salvar o avatar: ' + error.message });
    }
});

module.exports = router;
