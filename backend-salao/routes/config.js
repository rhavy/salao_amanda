const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /info - Retorna constantes do salão (horários, contato, etc)
router.get('/info', async (req, res) => {
    try {
        // 2. Buscar configurações
        const [rows] = await db.query('SELECT config_key, config_value FROM salon_config');

        // Organizar os dados em um objeto estruturado
        const config = {};
        rows.forEach(row => {
            try {
                config[row.config_key] = JSON.parse(row.config_value);
            } catch {
                config[row.config_key] = row.config_value;
            }
        });

        // Formatar a resposta para corresponder ao formato esperado pelo frontend
        res.json({
            BUSINESS_HOURS: {
                weekdays: config.business_hours_weekdays || { open: "09:00", close: "20:00" },
                saturday: config.business_hours_saturday || { open: "09:00", close: "18:00" },
                sunday: config.business_hours_sunday || { open: null, close: null },
            },
            CONTACT_INFO: {
                address: config.contact_address || "Endereço não configurado",
                whatsappNumber: config.contact_whatsapp || "",
                whatsappMessage: config.contact_whatsapp_message || "Olá!"
            },
            DAYS: config.days_of_week || ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"],
            TIME_SLOTS: config.time_slots || ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar configurações do salão: ' + error.message });
    }
});

module.exports = router;
