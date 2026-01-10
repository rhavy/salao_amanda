const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. Rota para buscar todos os serviços (GET)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                s.id, s.name, s.duration, s.price, s.created_at, s.updated_at,
                c.id AS category_id, c.name AS category_name
            FROM services s
            JOIN categories c ON s.category_id = c.id
        `);
        res.json(rows);
    } catch (error) {
        console.error("Erro detalhado ao buscar serviços:", error); // Added console.error
        res.status(500).json({ error: 'Erro ao buscar serviços', details: error.message });
    }
});

// 2. Rota para adicionar um novo serviço (POST)
router.post('/', async (req, res) => {
    const { name, duration, price, category_id } = req.body;
    if (!name || !duration || !price || !category_id) {
        return res.status(400).json({ error: 'Nome, duração, preço e category_id são obrigatórios.' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO services (name, duration, price, category_id) VALUES (?, ?, ?, ?)',
            [name, duration, price, category_id]
        );
        res.status(201).json({ id: result.insertId, name, duration, price, category_id });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar serviço', details: error.message });
    }
});

// 3. Rota para atualizar um serviço existente (PUT)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, duration, price, category_id } = req.body;
    if (!name || !duration || !price || !category_id) {
        return res.status(400).json({ error: 'Nome, duração, preço e category_id são obrigatórios.' });
    }
    try {
        const [result] = await db.query(
            'UPDATE services SET name = ?, duration = ?, price = ?, category_id = ? WHERE id = ?',
            [name, duration, price, category_id, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado.' });
        }
        res.json({ message: 'Serviço atualizado com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar serviço', details: error.message });
    }
});

// 4. Rota para deletar um serviço (DELETE)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM services WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado.' });
        }
        res.json({ message: 'Serviço deletado com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar serviço', details: error.message });
    }
});

module.exports = router;
