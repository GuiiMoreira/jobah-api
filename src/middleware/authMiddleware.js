const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const [, token] = authorization.split(' '); // Formato "Bearer TOKEN"

    try {
        const decoded = jwt.verify(token, 'SEGREDO_SUPER_SECRETO_MUDAR_EM_PROD');
        const { id, type, name } = decoded;

        // Adiciona o id e o tipo do usuário ao objeto req para uso posterior
        req.userId = id;
        req.userType = type;
        req.userName = name;

        return next();
    } catch {
        return res.status(401).json({ error: 'Token inválido.' });
    }
}

module.exports = authMiddleware;