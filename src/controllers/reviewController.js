const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const prisma = new PrismaClient();
const { createNotification } = require('../services/notificationService');

const createReviewSchema = z.object({
    orderId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
});

// Cliente cria uma nova avaliação
async function createReview(req, res) {
    try {
        const { orderId, rating, comment } = createReviewSchema.parse(req.body);
        const { userId: reviewerId, userName } = req; // reviewerId é o ID do cliente

        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        // 1. Validações de permissão e status
        if (!order || order.clientId !== reviewerId) {
            return res.status(403).json({ error: "Você não tem permissão para avaliar este pedido." });
        }
        if (order.status !== 'COMPLETED') {
            return res.status(400).json({ error: "Este pedido ainda não foi concluído e não pode ser avaliado." });
        }

        const existingReview = await prisma.review.findUnique({ where: { orderId } });
        if (existingReview) {
            return res.status(409).json({ error: "Este pedido já foi avaliado." });
        }

        const providerId = order.providerId;

        // 2. Transação para garantir consistência dos dados
        const newReview = await prisma.$transaction(async (tx) => {
            // Primeiro, busca os dados atuais do prestador
            const provider = await tx.user.findUnique({
                where: { id: providerId },
                select: { averageRating: true, totalReviews: true }
            });

            const oldAverage = provider.averageRating;
            const oldTotal = provider.totalReviews;

            // Calcula a nova média
            const newTotal = oldTotal + 1;
            const newAverage = ((oldAverage * oldTotal) + rating) / newTotal;

            // Cria a nova avaliação
            const review = await tx.review.create({
                data: {
                    orderId,
                    rating,
                    comment,
                    reviewerId, // ID do cliente
                    providerId, // ID do prestador
                }
            });

            // Atualiza o perfil do prestador com a nova média e total de avaliações
            await tx.user.update({
                where: { id: providerId },
                data: {
                    totalReviews: newTotal,
                    averageRating: newAverage,
                }
            });

            return review;
        });

        // 3. Notifica o prestador sobre a nova avaliação
        await createNotification(providerId, 'NEW_REVIEW', `${userName} deixou uma avaliação de ${rating} estrelas para você.`, orderId);

        return res.status(201).json(newReview);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error("Erro ao criar avaliação:", error);
        return res.status(500).json({ error: "Erro interno ao criar avaliação." });
    }
}

// Lista todas as avaliações de um prestador (público)
async function listReviewsForProvider(req, res) {
    const { providerId } = req.params;
    console.log(providerId)
    try {
        const reviews = await prisma.review.findMany({
            where: { providerId: providerId, status: 'ACTIVE' }, // Adicionado o filtro de status 'ACTIVE'
            orderBy: { createdAt: 'desc' },

            // CORREÇÃO: Trocamos 'include' por 'select'
            select: {
                // Campos do próprio modelo 'Review'
                id: true,
                rating: true,
                comment: true,
                createdAt: true,

                // Relação com o 'User' que fez a avaliação
                reviewer: {
                    select: {
                        name: true,
                        avatar_url: true
                    }
                },

                // Relação com as fotos da avaliação
                photos: {
                    select: {
                        id: true,
                        imageUrl: true
                    }
                }
            }
        });
        return res.json(reviews);
    } catch (error) {
        console.error("Erro ao buscar avaliações do prestador:", error);
        return res.status(500).json({ error: "Erro ao buscar avaliações." });
    }
}

async function deleteReview(req, res) {
    const { reviewId } = req.params;
    const { userId } = req;

    try {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });

        if (!review || review.reviewerId !== userId) {
            return res.status(404).json({ error: "Avaliação não encontrada ou você não tem permissão para removê-la." });
        }

        // Usamos uma transação para atualizar o status E recalcular a nota do provider
        await prisma.$transaction(async (tx) => {
            // 1. "Deleta" a avaliação mudando seu status
            await tx.review.update({
                where: { id: reviewId },
                data: { status: 'DELETED_BY_USER' },
            });

            // 2. Recalcula a nota média do prestador, agora considerando apenas as avaliações ATIVAS
            const reviews = await tx.review.findMany({
                where: {
                    providerId: review.providerId,
                    status: 'ACTIVE', // <-- Ponto chave!
                },
            });

            const totalReviews = reviews.length;
            const averageRating = totalReviews > 0
                ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
                : 0;

            await tx.user.update({
                where: { id: review.providerId },
                data: { totalReviews, averageRating },
            });
        });

        return res.status(204).send();

    } catch (error) {
        console.error("Erro ao deletar avaliação:", error);
        return res.status(500).json({ error: "Erro ao deletar avaliação." });
    }
}



module.exports = { createReview, listReviewsForProvider, deleteReview };