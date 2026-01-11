const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const saltRounds = 10;

// TODO: Use an environment variable for JWT_SECRET in production
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Define a secret key

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

        // 3. Gera o Token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, // Payload
            JWT_SECRET,                                          // Secret key
            { expiresIn: '8h' }                                  // Token expiration
        );

        // 4. Retorna os dados do usuário (exceto a senha) e o token
        const { password: _, ...userWithoutPassword } = user;
        res.json({ message: 'Login bem-sucedido!', user: userWithoutPassword, token }); // Include the token

    } catch (error) {
        console.error("Erro no login:", error); // Adicionei log para depuração
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

// --- ROTA DE MUDANÇA DE SENHA ---
router.post('/change-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        // 1. Busca o usuário pelo e-mail
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            // Resposta genérica para não revelar se o email existe
            return res.status(401).json({ error: 'Senha atual incorreta.' });
        }
        const user = rows[0];

        // 2. Compara a senha atual enviada com o hash do banco
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Senha atual incorreta.' });
        }

        // 3. Criptografa a nova senha
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // 4. Atualiza a senha no banco de dados
        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedNewPassword, email]);

        res.json({ message: 'Senha alterada com sucesso!' });

    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        res.status(500).json({ error: 'Erro interno ao alterar a senha.' });
    }
});

module.exports = router;
