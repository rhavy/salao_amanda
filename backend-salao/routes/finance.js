const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /finance?month=MM&year=YYYY
router.get('/', async (req, res) => {
    const { month, year } = req.query;

    if (!month || !year) {
        return res.status(400).json({ message: 'O mês e o ano são obrigatórios.' });
    }

    try {
        // Formata o mês para ter sempre dois dígitos (ex: 01, 02, 11)
        const monthFormatted = month.padStart(2, '0');
        const datePattern = `${year}-${monthFormatted}-%`; // Ex: '2024-07-%'

        // 1. Buscar agendamentos concluídos para o mês/ano
        const [monthAppointments] = await db.query(
            "SELECT price, date FROM appointments WHERE status = 'completed' AND date LIKE ?",
            [datePattern]
        );

        // 2. Calcular o realIncome e o count
        const realIncome = monthAppointments.reduce((sum, app) => sum + parseFloat(app.price), 0);
        const count = monthAppointments.length;

        // 3. Calcular a projeção
        const today = new Date();
        const currentDay = today.getDate();
        const daysInMonth = new Date(year, month, 0).getDate();
        
        let projection = 0;
        if (currentDay < daysInMonth) {
            const averageDailyIncome = realIncome / currentDay;
            const remainingDays = daysInMonth - currentDay;
            projection = averageDailyIncome * remainingDays;
        }

        // 4. Calcular o totalYear (acumulado do ano)
        const yearPattern = `${year}-%`;
        const [yearAppointments] = await db.query(
            "SELECT price FROM appointments WHERE status = 'completed' AND date LIKE ?",
            [yearPattern]
        );
        const totalYear = yearAppointments.reduce((sum, app) => sum + parseFloat(app.price), 0);

        // 5. Retornar o JSON
        res.json({
            real: realIncome,
            projection: Math.round(projection), // Arredonda para um número inteiro
            count: count,
            totalYear: totalYear
        });

    } catch (error) {
        console.error('Erro ao calcular finanças:', error);
        res.status(500).json({ message: 'Erro interno ao processar a solicitação financeira.' });
    }
});

module.exports = router;
