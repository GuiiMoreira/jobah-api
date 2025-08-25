const { PrismaClient } = require('@prisma/client');
const { email } = require('zod/v4');
const prisma = new PrismaClient();

async function getDashboardData(req, res) {
    try {
        // Para evitar repetição, definimos o nosso "select" de dados do prestador uma vez.
        const providerSelectClause = {
            id: true,
            name: true,
            avatar_url: true,
            bio: true, // <-- Incluindo a bio
            averageRating: true,
            email: true,
            totalReviews: true,
            professions: { // <-- Incluindo todas as profissões
                select: {
                    profession: { select: { name: true } }
                }
            }
        };

        // --- LÓGICA PARA "RECOMENDADOS" COM FALLBACK ---

        // 1. Tenta a busca ideal
        let recommendedProviders = await prisma.user.findMany({
            where: {
                type: 'provider',
                verificationStatus: 'VERIFIED',
                averageRating: { gte: 4.7 },
                totalReviews: { gte: 5 },
            },
            orderBy: { averageRating: 'desc' },
            take: 10,
            select: providerSelectClause, // Usamos nosso select padrão
        });

        // 2. Se a busca ideal não retornar resultados, executa o FALLBACK
        if (recommendedProviders.length === 0) {
            console.log("Fallback Ativado: Nenhum 'Recomendado' encontrado. Buscando os prestadores com mais avaliações.");
            recommendedProviders = await prisma.user.findMany({
                where: { type: 'provider' },
                orderBy: { totalReviews: 'desc' },
                take: 10,
                select: providerSelectClause, // Usamos nosso select padrão
            });
        }

        // --- LÓGICA PARA "EM ALTA" COM FALLBACK ---

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Tenta a busca ideal
        let trendingProviders = await prisma.user.findMany({
            where: {
                type: 'provider',
                orders_as_provider: { some: { status: 'COMPLETED', updatedAt: { gte: thirtyDaysAgo } } },
            },
            orderBy: [{ orders_as_provider: { _count: 'desc' } }, { averageRating: 'desc' }],
            take: 10,
            select: providerSelectClause, // Usamos nosso select padrão
        });

        // 2. Se a busca ideal não retornar resultados, executa o FALLBACK
        if (trendingProviders.length === 0) {
            console.log("Fallback Ativado: Nenhum 'Em Alta' encontrado. Buscando os prestadores mais recentes.");
            trendingProviders = await prisma.user.findMany({
                where: { type: 'provider', professions: { some: {} } },
                orderBy: { created_at: 'desc' },
                take: 10,
                select: providerSelectClause, // Usamos nosso select padrão
            });
        }

        // --- FORMATAÇÃO E RESPOSTA FINAL ---

        // Função para transformar o array de objetos de profissões em um array de strings
        const formatProfessions = (providerList) => providerList.map(p => ({
            ...p,
            professions: p.professions.map(prof => prof.profession.name)
        }));

        return res.json({
            recommendedProviders: formatProfessions(recommendedProviders),
            trendingProviders: formatProfessions(trendingProviders),
        });

    } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        return res.status(500).json({ error: "Erro ao processar sua requisição." });
    }
}

module.exports = { getDashboardData };