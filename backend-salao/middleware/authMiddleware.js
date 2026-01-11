const jwt = require('jsonwebtoken');

// TODO: Use an environment variable for JWT_SECRET in production
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const authMiddleware = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Nenhum token, autorização negada.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Attach user from token payload to the request object
        req.user = decoded; 
        next();
    } catch (error) {
        console.error("Erro na verificação do token:", error);
        res.status(401).json({ error: 'Token inválido.' });
    }
};

module.exports = authMiddleware;
