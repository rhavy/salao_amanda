const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// --- ROTA DE REGISTRO ---
router.post('/register', async (req, res) => {
    const { name, email, password, gender, phone, cpf, birthDate } = req.body;

    // Converte Data de DD/MM/YYYY para YYYY-MM-DD (Formato do MySQL)
    let formattedBirthDate = birthDate;
    if (birthDate && birthDate.includes('/')) {
        const [day, month, year] = birthDate.split('/');
        formattedBirthDate = `${year}-${month}-${day}`;
    }

    try {
        // 1. Verifica se o e-mail já existe
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'E-mail já cadastrado.' });
        }

        // 2. Criptografa a senha
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. Salva no banco
        const sql = `INSERT INTO users (name, email, password, phone, cpf, birthDate, gender, memberSince) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
        await db.query(sql, [name, email, hashedPassword, phone, cpf, formattedBirthDate, gender]);

        res.status(201).json({ message: 'Conta criada com sucesso!' });
    } catch (error) {
        console.error("Erro detalhado no registro:", error); // Log no terminal do backend
        res.status(500).json({ error: `Erro ao registrar: ${error.message}` }); // Retorna o erro real para o app
    }
});

// --- ROTA DE LOGIN ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Busca o usuário pelo e-mail
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        const user = rows[0];

        // 2. Compara a senha enviada com o hash do banco
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        // 3. Retorna os dados do usuário (exceto a senha)
        const { password: _, ...userWithoutPassword } = user;
        res.json({ message: 'Login bem-sucedido!', user: userWithoutPassword });

    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar login.' });
    }
});

// --- ROTA DE ESQUECI A SENHA (Simulação) ---
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'E-mail não encontrado.' });
        }

        console.log(`Solicitação de recuperação para: ${email}`);
        res.json({ message: 'Link de recuperação enviado para o seu e-mail!' });

    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar solicitação.' });
    }
});

module.exports = router;
