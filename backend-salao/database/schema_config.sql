-- Criar tabela de configurações gerais do salão
CREATE TABLE IF NOT EXISTS salon_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL, -- Category name, must be unique
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar tabela de serviços
CREATE TABLE IF NOT EXISTS services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    duration INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT NOT NULL, -- Changed from 'category' to 'category_id'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT -- Link to categories table
);

-- -- Inserir horários de funcionamento
-- INSERT INTO salon_config (config_key, config_value) VALUES
-- ('business_hours_weekdays', '{"open": "09:00", "close": "20:00"}'),
-- ('business_hours_saturday', '{"open": "09:00", "close": "18:00"}'),
-- ('business_hours_sunday', '{"open": null, "close": null}')
-- ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- -- Inserir informações de contato
-- INSERT INTO salon_config (config_key, config_value) VALUES
-- ('contact_address', 'Rua das Flores, 123, Bairro Jardim, Belo Horizonte - MG'),
-- ('contact_whatsapp', '5527988722086'),
-- ('contact_whatsapp_message', 'Olá, gostaria de saber mais sobre o Salão.')
-- ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- -- Inserir dias da semana
-- INSERT INTO salon_config (config_key, config_value) VALUES
-- ('days_of_week', '["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]')
-- ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- -- Inserir horários disponíveis
-- INSERT INTO salon_config (config_key, config_value) VALUES
-- ('time_slots', '["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]')
-- ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
