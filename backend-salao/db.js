// db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',      // Usuário padrão do HeidiSQL
    password: '',      // Sua senha (vazia por padrão no XAMPP/Wamp)
    database: 'salao_amanda',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise(); // Usamos promise para facilitar o uso de async/await