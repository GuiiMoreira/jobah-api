function adminMiddleware(req, res, next) {
    if (req.userType !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Rota exclusiva para administradores.' });
    }

    return next();
}

module.exports = adminMiddleware;