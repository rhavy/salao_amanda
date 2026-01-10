const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /info - Retorna constantes do salão (horários, contato, etc)
router.get('/info', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT config_key, config_value FROM salon_config');

        const config = {};
        rows.forEach(row => {
            try {
                config[row.config_key] = JSON.parse(row.config_value);
            } catch (e) {
                config[row.config_key] = row.config_value;
            }
        });

        // Transforma a estrutura legada de horários para a nova estrutura de array
        if (!config.business_hours && (config.business_hours_weekdays || config.business_hours_saturday)) {
            const newBusinessHours = [];
            if (config.business_hours_weekdays) {
                newBusinessHours.push({ day: 'Segunda', ...config.business_hours_weekdays });
                newBusinessHours.push({ day: 'Terça', ...config.business_hours_weekdays });
                newBusinessHours.push({ day: 'Quarta', ...config.business_hours_weekdays });
                newBusinessHours.push({ day: 'Quinta', ...config.business_hours_weekdays });
                newBusinessHours.push({ day: 'Sexta', ...config.business_hours_weekdays });
            }
            if (config.business_hours_saturday) {
                newBusinessHours.push({ day: 'Sábado', ...config.business_hours_saturday });
            }
            if (config.business_hours_sunday && config.business_hours_sunday.open) {
                newBusinessHours.push({ day: 'Domingo', ...config.business_hours_sunday });
            }
            config.business_hours = newBusinessHours;
        }


        res.json(config);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar configurações do salão: ' + error.message });
    }
});

// PUT /info - Atualiza as configurações do salão
router.put('/info', async (req, res) => {
    const {
        whatsapp,
        street,
        number,
        neighborhood,
        city,
        businessHours
    } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Mapeamento dos dados do frontend para as chaves do banco
        const configToSave = {
            contact_whatsapp: whatsapp,
            contact_address: `${street}, ${number}, ${neighborhood}, ${city}`,
            business_hours: JSON.stringify(businessHours)
        };

        const sql = `
            INSERT INTO salon_config (config_key, config_value) 
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
        `;

        for (const [key, value] of Object.entries(configToSave)) {
            if (value !== undefined) { // Salva apenas se o valor foi enviado
                await connection.query(sql, [key, value]);
            }
        }

        await connection.commit();
        res.status(200).json({ message: 'Configurações atualizadas com sucesso!' });

    } catch (error) {
        await connection.rollback();
        console.error('Erro ao salvar configurações:', error);
        res.status(500).json({ message: 'Erro ao salvar as configurações.' });
    } finally {
        connection.release();
    }
});

module.exports = router;
