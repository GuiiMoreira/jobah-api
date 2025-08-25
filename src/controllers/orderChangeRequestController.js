const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { createNotification } = require('../services/notificationService');
const prisma = new PrismaClient();

const createChangeRequestSchema = z.object({
    type: z.enum(['PRICE_ADJUSTMENT', 'SCHEDULE_CHANGE', 'SCOPE_CHANGE']),
    details: z.string().min(10, "Os detalhes são obrigatórios e devem ter no mínimo 10 caracteres."),
    proposedPrice: z.coerce.number().positive().optional(),
    proposedDate: z.string().datetime().optional(),
});

// 1. Criar uma solicitação de mudança para um pedido
async function createChangeRequest(req, res) {
    const { orderId } = req.params;
    const { userId: requestedById, userName } = req;

    try {
        const data = createChangeRequestSchema.parse(req.body);
        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order || (order.clientId !== requestedById && order.providerId !== requestedById)) {
            return res.status(404).json({ error: "Pedido não encontrado ou você não tem permissão para acessá-lo." });
        }

        const changeRequest = await prisma.orderChangeRequest.create({
            data: {
                orderId,
                requestedById,
                ...data,
            }
        });

        // Notifica a outra parte
        const notificationTargetId = order.clientId === requestedById ? order.providerId : order.clientId;
        await createNotification(notificationTargetId, 'CHANGE_REQUEST', `${userName} solicitou uma mudança no pedido.`, orderId);

        return res.status(201).json(changeRequest);
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ error: "Erro ao criar solicitação de mudança." });
    }
}

// 2. Listar todas as solicitações de mudança de um pedido
async function listChangeRequestsForOrder(req, res) {
    const { orderId } = req.params;
    const { userId } = req;

    try {
        // ... (lógica de verificação se o usuário pertence ao pedido)
        const requests = await prisma.orderChangeRequest.findMany({
            where: { orderId },
            include: { requestedBy: { select: { id: true, name: true, avatar_url: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(requests);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao listar solicitações." });
    }
}

// 3. Aceitar ou Rejeitar uma solicitação de mudança
async function resolveChangeRequest(req, res) {
    const { requestId } = req.params;
    const { action } = req.body; // 'ACCEPT' ou 'REJECT'
    const { userId, userName } = req;

    if (!['ACCEPT', 'REJECT'].includes(action)) {
        return res.status(400).json({ error: "Ação inválida. Use 'ACCEPT' ou 'REJECT'." });
    }

    try {
        const request = await prisma.orderChangeRequest.findUnique({
            where: { id: requestId },
            include: { order: true }
        });

        if (!request || request.status !== 'PENDING' || request.order.clientId !== userId && request.order.providerId !== userId) {
            return res.status(404).json({ error: "Solicitação não encontrada ou já resolvida." });
        }
        if (request.requestedById === userId) {
            return res.status(403).json({ error: "Você não pode aprovar ou rejeitar sua própria solicitação." });
        }

        if (action === 'ACCEPT') {
            await prisma.$transaction(async (tx) => {
                // Atualiza o pedido original com os novos dados
                await tx.order.update({
                    where: { id: request.orderId },
                    data: {
                        price: request.proposedPrice !== null ? request.proposedPrice : undefined,
                        proposedDate: request.proposedDate !== null ? request.proposedDate : undefined,
                    }
                });
                // Atualiza a solicitação
                await tx.orderChangeRequest.update({
                    where: { id: requestId },
                    data: { status: 'ACCEPTED', resolvedAt: new Date() },
                });
            });
            await createNotification(request.requestedById, 'CHANGE_ACCEPTED', `${userName} aceitou sua proposta de mudança.`, request.orderId);
            return res.json({ message: "Solicitação de mudança aceita com sucesso." });
        } else { // REJECT
            await prisma.orderChangeRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED', resolvedAt: new Date() },
            });
            await createNotification(request.requestedById, 'CHANGE_REJECTED', `${userName} rejeitou sua proposta de mudança.`, request.orderId);
            return res.json({ message: "Solicitação de mudança rejeitada." });
        }
    } catch (error) {
        return res.status(500).json({ error: "Erro ao resolver solicitação." });
    }
}

module.exports = { createChangeRequest, listChangeRequestsForOrder, resolveChangeRequest };