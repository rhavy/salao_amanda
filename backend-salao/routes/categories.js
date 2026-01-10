const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota para buscar todas as categorias (GET)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar categorias', details: error.message });
    }
});

// Rota para adicionar uma nova categoria (POST)
router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO categories (name) VALUES (?)',
            [name]
        );
        res.status(201).json({ id: result.insertId, name });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar categoria', details: error.message });
    }
});

// Rota para atualizar uma categoria existente (PUT)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
    }
    try {
        const [result] = await db.query(
            'UPDATE categories SET name = ? WHERE id = ?',
            [name, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }
        res.json({ message: 'Categoria atualizada com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar categoria', details: error.message });
    }
});

// Rota para deletar uma categoria (DELETE)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }
        res.json({ message: 'Categoria deletada com sucesso.' });
    } catch (error) {
        // Handle foreign key constraint violation if categories are still linked to services
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'Não é possível deletar esta categoria. Existem serviços associados a ela.' });
        }
        res.status(500).json({ error: 'Erro ao deletar categoria', details: error.message });
    }
});

module.exports = router;
