const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function searchProviders(req, res) {
    const { q, location, page = 1, limit = 10, minRating, superCategoryId, professionId } = req.query;

    try {
        const filterConditions = [
            { type: 'provider' }
        ];

        if (superCategoryId) {
            filterConditions.push({
                professions: { some: { profession: { superCategoryId: superCategoryId } } }
            });
        }

        if (professionId) {
            filterConditions.push({
                professions: { some: { professionId: professionId } }
            });
        }

        // <-- MUDANÇA: Lógica de localização atualizada
        // Agora, o parâmetro 'location' busca tanto na cidade quanto no estado.
        if (location) {
            filterConditions.push({
                OR: [
                    { city: { contains: location, mode: 'insensitive' } },
                    { state: { contains: location, mode: 'insensitive' } }
                ]
            });
        }

        if (minRating) {
            filterConditions.push({ averageRating: { gte: parseFloat(minRating) } });
        }

        // A lógica do 'q' (Full-Text Search) foi movida para o final para maior clareza
        if (q) {
            const ftsQuery = q.trim().split(' ').join(' | ');
            filterConditions.push({
                OR: [
                    { name: { search: ftsQuery } },
                    { bio: { search: ftsQuery } },
                    { professions: { some: { profession: { name: { search: ftsQuery } } } } }
                ]
            });
        }

        // O bug do código duplicado foi removido daqui.

        const where = {
            AND: filterConditions
        };

        const providers = await prisma.user.findMany({
            where,
            orderBy: [
                { averageRating: 'desc' },
                { totalReviews: 'desc' },
            ],
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            select: {
                id: true,
                name: true,
                avatar_url: true,
                bio: true,
                // <-- MUDANÇA: Selecionando os novos campos de endereço
                city: true,
                state: true,
                // 'location' foi removido
                averageRating: true,
                totalReviews: true,
                professions: {
                    select: {
                        profession: { select: { name: true } }
                    }
                }
            },
        });

        const formattedProviders = providers.map(p => ({
            ...p,
            professions: p.professions.map(prof => prof.profession.name)
        }));

        const total = await prisma.user.count({ where });

        return res.json({
            data: formattedProviders,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });

    } catch (error) {
        console.error('Erro na busca por prestadores:', error);
        return res.status(500).json({ error: 'Ocorreu um erro ao processar sua busca.' });
    }
}

module.exports = { searchProviders };