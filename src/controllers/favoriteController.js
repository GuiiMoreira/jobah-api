const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Adicionar um prestador aos favoritos
async function addFavorite(req, res) {
    const { providerId } = req.params;
    const { userId: favoriterId } = req;

    if (providerId === favoriterId) {
        return res.status(400).json({ error: "Você não pode favoritar a si mesmo." });
    }

    try {
        const favorite = await prisma.favorite.create({
            data: {
                favoriterId,
                favoritedId: providerId,
            }
        });
        return res.status(201).json(favorite);
    } catch (error) {
        // Código P2002 significa violação de restrição única (já favoritou)
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "Este prestador já está na sua lista de favoritos." });
        }
        return res.status(500).json({ error: "Erro ao adicionar aos favoritos." });
    }
}

// Remover um prestador dos favoritos
async function removeFavorite(req, res) {
    const { providerId } = req.params;
    const { userId: favoriterId } = req;

    try {
        // A exclusão é baseada na combinação única de quem favoritou e quem foi favoritado
        await prisma.favorite.delete({
            where: {
                favoriterId_favoritedId: {
                    favoriterId,
                    favoritedId: providerId,
                }
            }
        });
        return res.status(204).send();
    } catch (error) {
        // Código P2025 significa que o registro a ser deletado não foi encontrado
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Este prestador não está na sua lista de favoritos." });
        }
        return res.status(500).json({ error: "Erro ao remover dos favoritos." });
    }
}

// Listar todos os prestadores favoritados pelo usuário logado
async function listFavorites(req, res) {
    const { userId: favoriterId } = req;

    try {
        const favorites = await prisma.favorite.findMany({
            where: { favoriterId },
            include: {
                favorited: { // Traz o perfil completo do prestador favoritado
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        avatar_url: true,
                        bio: true,
                        created_at: true,
                        averageRating: true,
                        totalReviews: true,
                        // Novos campos públicos
                        city: true,
                        state: true,
                        websiteUrl: true,
                        instagramUrl: true,
                        linkedinUrl: true,
                        operatingHours: true,
                        yearsOfExperience: true,
                        verificationStatus: true,
                        // Relações
                        portfolioImages: { select: { id: true, imageUrl: true, caption: true }, orderBy: { createdAt: 'asc' } },
                        professions: { select: { id: true, description: true, base_price: true, profession: { select: { name: true, icon_url: true } } } },
                        reviews_received: {
                            where: { status: 'ACTIVE' },
                            orderBy: { createdAt: 'desc' },
                            select: { id: true, rating: true, comment: true, createdAt: true, reviewer: { select: { id: true, name: true, avatar_url: true } }, photos: { select: { id: true, imageUrl: true } } }
                        }
                    }
                }
            }
        });

        // Formata a resposta, agora de forma segura
        const favoriteProfiles = favorites
            // 1. Filtra qualquer registro "órfão" cujo prestador não foi encontrado (f.favorited é null)
            .filter(f => f.favorited)
            // 2. Agora, com segurança, mapeia os resultados
            .map(f => {
                const provider = f.favorited;
                return {
                    ...provider,
                    // Garante que o array de profissões exista antes de mapear
                    professions: (provider.professions || []).map(p => p.profession.name),
                };
            });

        return res.json(favoriteProfiles);

    } catch (error) {
        // Mantemos o log para qualquer outro erro inesperado
        console.error("ERRO DETALHADO AO LISTAR FAVORITOS:", error);
        return res.status(500).json({ error: "Erro ao listar favoritos." });
    }
}


module.exports = { addFavorite, removeFavorite, listFavorites };