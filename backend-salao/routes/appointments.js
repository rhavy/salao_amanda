const express = require('express');
const router = express.Router();
const db = require('../db');

// 2. Rota para salvar um agendamento (POST)
router.post('/', async (req, res) => {
    let { id, user_email, serviceName, date, time, status, price } = req.body;

    // Se não vier ID (ex: via API externa ou teste), gera um
    if (!id) {
        id = Date.now().toString();
    }

    try {
        const sql = `INSERT INTO appointments (id, user_email, serviceName, date, time, status, price) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

        await db.query(sql, [id, user_email, serviceName, date, time, status, price]);

        res.status(201).json({ message: 'Agendamento realizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao salvar agendamento: ' + error.message });
    }
});

// Rota para buscar TODOS os agendamentos (para admin)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM appointments ORDER BY `created_at` DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar todos os agendamentos' });
    }
});

// 3. Rota para buscar agendamentos de um usuário (GET)
router.get('/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM appointments WHERE user_email = ? ORDER BY date DESC', [email]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar sua agenda' });
    }
});

// Rota para atualizar o status de um agendamento (PATCH)
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'O novo status é obrigatório.' });
    }

    try {
        await db.query("UPDATE appointments SET status = ? WHERE id = ?", [status, id]);
        res.json({ message: `Status do agendamento atualizado para '${status}' com sucesso!` });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ message: 'Erro ao atualizar status do agendamento.' });
    }
});

// 4. Rota para cancelar agendamento (PUT/DELETE Lógico)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE appointments SET status = 'cancelado' WHERE id = ?", [id]);
        res.json({ message: 'Agendamento marcado como cancelado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao cancelar agendamento' });
    }
});

// Rota para buscar horários ocupados em uma data específica
router.get('/by-date/:date', async (req, res) => {
    const { date } = req.params;
    try {
        // Retorna apenas os horários de agendamentos que NÃO estão cancelados.
        const [rows] = await db.query(
            "SELECT time FROM appointments WHERE date = ? AND status <> 'cancelado'",
            [date]
        );
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar horários por data:', error);
        res.status(500).json({ error: 'Erro ao buscar horários por data' });
    }
});

module.exports = router;
