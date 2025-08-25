function providerMiddleware(req, res, next) {
    // Este middleware deve ser usado SEMPRE DEPOIS do authMiddleware,
    // pois ele depende do req.userType que o authMiddleware adiciona.

    if (req.userType !== 'provider') {
        // Se o tipo de usuário não for 'provider', retorna um erro de acesso proibido.
        return res.status(403).json({ error: "Acesso restrito a prestadores de serviço." });
    }

    // Se o usuário for um prestador, permite que a requisição continue para o próximo passo (o controller).
    return next();
}

module.exports = providerMiddleware