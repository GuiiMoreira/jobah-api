const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { createNotification } = require('../services/notificationService');
const prisma = new PrismaClient();

// Schema de validação para a criação de uma proposta
const createProposalSchema = z.object({
    price: z.coerce.number().positive("O preço deve ser um valor positivo."),
    details: z.string().optional(),
});

/**
 * Ação do PRESTADOR: Cria e envia um orçamento para um pedido.
 */
async function createProposal(req, res) {
    const { orderId } = req.params;
    const { userId: providerId, userName } = req;

    try {
        const { price, details } = createProposalSchema.parse(req.body);

        // 1. Verifica se o prestador pode enviar uma proposta para este pedido
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                providerId: providerId,
                status: 'PENDING_QUOTE' // Só pode enviar proposta se o pedido estiver aguardando
            }
        });

        if (!order) {
            return res.status(403).json({ error: "Você não pode criar uma proposta para este pedido ou o pedido não está aguardando orçamento." });
        }

        const newProposal = await prisma.$transaction(async (tx) => {
            // 2. Cria a proposta
            const proposal = await tx.proposal.create({
                data: {
                    orderId,
                    price,
                    details
                }
            });

            // 3. Atualiza o status do pedido para 'QUOTE_SENT'
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'QUOTE_SENT' }
            });

            return proposal;
        });

        // 4. Notifica o cliente que ele recebeu um novo orçamento
        await createNotification(order.clientId, 'PROPOSAL_RECEIVED', `${userName} enviou um orçamento para seu pedido.`, orderId);

        return res.status(201).json(newProposal);

    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
        console.error("Erro ao criar proposta:", error);
        return res.status(500).json({ error: "Erro interno ao criar proposta." });
    }
}

/**
 * Ação do CLIENTE: Aceita uma proposta de orçamento.
 */
async function acceptProposal(req, res) {
    const { proposalId } = req.params;
    const { userId: clientId, userName } = req;

    try {
        const proposal = await prisma.proposal.findUnique({
            where: { id: proposalId },
            include: { order: true }
        });

        // 1. Verifica se o cliente pode aceitar esta proposta
        if (!proposal || proposal.order.clientId !== clientId || proposal.order.status !== 'QUOTE_SENT') {
            return res.status(403).json({ error: "Você não pode aceitar esta proposta no momento." });
        }

        const updatedOrder = await prisma.$transaction(async (tx) => {
            // 2. Atualiza o pedido principal com o preço da proposta e o novo status
            const order = await tx.order.update({
                where: { id: proposal.orderId },
                data: {
                    status: 'AWAITING_PAYMENT',
                    price: proposal.price
                }
            });
            // Opcional: Futuramente, poderíamos deletar/rejeitar outras propostas para este mesmo pedido aqui.

            return order;
        });

        // 3. Notifica o prestador que sua proposta foi aceita
        await createNotification(proposal.order.providerId, 'PROPOSAL_ACCEPTED', `${userName} aceitou sua proposta! Aguardando pagamento.`, proposal.orderId);

        return res.json(updatedOrder);

    } catch (error) {
        console.error("Erro ao aceitar proposta:", error);
        return res.status(500).json({ error: "Erro interno ao aceitar proposta." });
    }
}

async function acceptAndPayMock(req, res) {
    const { proposalId } = req.params;
    const { userId: clientId, userName } = req;

    try {
        const proposal = await prisma.proposal.findUnique({
            where: { id: proposalId },
            include: { order: { include: { provider: true } } }
        });

        if (!proposal || proposal.order.clientId !== clientId || proposal.order.status !== 'QUOTE_SENT') {
            return res.status(403).json({ error: "Você não pode aceitar e pagar esta proposta no momento." });
        }

        const updatedOrder = await prisma.$transaction(async (tx) => {
            // Atualiza o pedido com o preço e pula direto para 'SCHEDULED'
            const order = await tx.order.update({
                where: { id: proposal.orderId },
                data: {
                    price: proposal.price,
                    status: 'SCHEDULED'
                }
            });
            return order;
        });

        // Notifica o prestador sobre a aceitação e pagamento
        await createNotification(proposal.order.providerId, 'PROPOSAL_ACCEPTED_PAID', `${userName} aceitou e pagou sua proposta. O serviço está agendado!`, proposal.orderId);

        return res.json(updatedOrder);

    } catch (error) { /* ... tratamento de erro ... */ }
}

module.exports = { createProposal, acceptProposal, acceptAndPayMock };