const db = require('./db');

// Definição de todas as tabelas do sistema
const tables = {
    users: `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            cpf VARCHAR(14),
            birthDate DATE,
            gender ENUM('Feminino', 'Masculino', 'Outro') DEFAULT 'Feminino',
            role ENUM('user', 'admin') DEFAULT 'user',
            avatar TEXT,
            memberSince DATETIME DEFAULT CURRENT_TIMESTAMP,
            appointmentsCount INT DEFAULT 0,
            notifications_reminders BOOLEAN DEFAULT TRUE,
            notifications_marketing BOOLEAN DEFAULT FALSE,
            privacy_use_photos BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `,
    categories: `
        CREATE TABLE IF NOT EXISTS categories (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) UNIQUE NOT NULL, -- Category name, must be unique
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `,
    services: `
        CREATE TABLE IF NOT EXISTS services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            duration INT NOT NULL, -- Duração em minutos
            category_id INT NOT NULL,
            available BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- ADDED THIS LINE BACK
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
        );
    `,
    appointments: `
        CREATE TABLE IF NOT EXISTS appointments (
            id VARCHAR(255) PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            serviceName VARCHAR(255) NOT NULL,
            date VARCHAR(20) NOT NULL,
            time VARCHAR(10) NOT NULL,
            status VARCHAR(50) DEFAULT 'pendente',
            price DECIMAL(10, 2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
        );
    `,
    salon_config: `
        CREATE TABLE IF NOT EXISTS salon_config (
            id INT PRIMARY KEY AUTO_INCREMENT,
            config_key VARCHAR(100) UNIQUE NOT NULL,
            config_value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `,
    messages: `
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            sender ENUM('user', 'admin') NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
        );
    `
};

// Dados iniciais para popular as tabelas
const initialData = {
    categories: [ // NEW: Initial categories
        ['Geral'], // Will get id 1
        ['Cabelo'], // Will get id 2
        ['Manicure'], // Will get id 3
        ['Estética'] // Will get id 4
    ],
    services: [
        ['Corte Feminino', 80.00, 60, 2], // name, price, duration, category_id for 'Cabelo'
        ['Escova Progressiva', 250.00, 180, 2], // category_id for 'Cabelo'
        ['Manicure e Pedicure', 55.00, 90, 3], // category_id for 'Manicure'
        ['Design de Sobrancelha', 35.00, 30, 4], // category_id for 'Estética'
        ['Maquiagem Social', 150.00, 75, 4] // category_id for 'Estética'
    ],
    salon_config: [
        ['business_hours_weekdays', '{"open": "09:00", "close": "20:00"}'],
        ['business_hours_saturday', '{"open": "09:00", "close": "18:00"}'],
        ['business_hours_sunday', '{"open": null, "close": null}'],
        ['contact_address', "Rua das Flores, 123, Bairro Jardim, Belo Horizonte - MG"],
        ['contact_whatsapp', "5527988722086"],
        ['contact_whatsapp_message', "Olá! Gostaria de agendar um horário no Salão da Amanda."],
        ['days_of_week', '["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]'],
        ['time_slots', '["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]']
    ]
};

// Definir a ordem de criação das tabelas para respeitar as chaves estrangeiras
const tableOrder = ['users', 'categories', 'salon_config', 'appointments', 'messages', 'services']; // services MUST come AFTER categories

async function runMigrations() {
    console.log("🔄 Iniciando migrações do banco de dados...");
    let connection;
    try {
        connection = await db.getConnection();
        console.log("✅ Conexão com o banco estabelecida.");

        // // --- COMEÇO: Dropping tables (DESTRUTIVO) ---
        // console.log("🗑️ Apagando tabelas existentes (se houver) para recriação...");
        // // Drop tables in reverse order of dependencies
        // const reverseTableOrder = [...tableOrder].reverse(); // Make a copy and reverse
        // for (const tableName of reverseTableOrder) {
        //     console.log(`- Apagando tabela [${tableName}]...`);
        //     await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
        // }
        // console.log("🗑️ Todas as tabelas existentes foram apagadas.");
        // // --- FIM: Dropping tables ---


        // Loop through tables in the defined order (creation)
        for (const tableName of tableOrder) {
            console.log(`- Verificando/Criando tabela [${tableName}]...`);
            if (!tables[tableName]) {
                console.warn(`⚠️ Definição da tabela '${tableName}' não encontrada no objeto 'tables'. Pulando...`);
                continue;
            }
            await connection.query(tables[tableName]);
        }
        console.log("✨ Todas as tabelas foram criadas com sucesso.");

        // === Início: Correções e Adições de Colunas Específicas (Mover ou remover se tabelas são sempre dropadas) ===
        // Since we are dropping all tables, these ALTER TABLE statements for columns like 'created_at', 'id' type,
        // 'user_email' type, 'status' type are likely no longer needed
        // because the CREATE TABLE statements now define them correctly from scratch.
        // I will remove them for now. If issues arise with fresh installs, they can be re-evaluated.
        console.log("🚧 Pulando verificações de colunas específicas, pois as tabelas são recriadas.");
        // === FIM: Correções e Adições de Colunas Específicas ===


        // Populando dados iniciais
        console.log("🔄 Populando tabelas com dados iniciais (se necessário)...");

        // Categories (NEW: Ensure initial categories are added)
        const [categoriesCount] = await connection.query('SELECT COUNT(*) as count FROM categories');
        if (categoriesCount[0].count === 0 && initialData.categories) { // Check if initialData.categories exists
            console.log("- Populando tabela [categories]...");
            const sql = 'INSERT INTO categories (name) VALUES ?';
            await connection.query(sql, [initialData.categories]);
        }

        // Services
        const [servicesCount] = await connection.query('SELECT COUNT(*) as count FROM services');
        if (servicesCount[0].count === 0 && initialData.services) { // Check if initialData.services exists
            console.log("- Populando tabela [services]...");
            const sql = 'INSERT INTO services (name, price, duration, category_id) VALUES ?';
            await connection.query(sql, [initialData.services]);
        }

        // Salon Config
        const [configCount] = await connection.query('SELECT COUNT(*) as count FROM salon_config');
        if (configCount[0].count === 0 && initialData.salon_config) { // Check if initialData.salon_config exists
            console.log("- Populando tabela [salon_config]...");
            const sql = 'INSERT INTO salon_config (config_key, config_value) VALUES ?';
            await connection.query(sql, [initialData.salon_config]);
        }

        console.log("✅ Migrações e população de dados concluídas com sucesso!");

    } catch (error) {
        console.error("❌ Erro fatal ao rodar migrações:", error);
        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
            console.log("➖ Conexão com o banco liberada.");
        }
    }
}

module.exports = runMigrations;