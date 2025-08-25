const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
// Supondo que a função createNotification venha de um serviço
const { createNotification } = require('../services/notificationService');
const prisma = new PrismaClient();

const createOrderSchema = z.object({
    providerId: z.string().uuid(),
    note: z.string().optional(),
    proposedDate: z.string().datetime().optional(),
    orderType: z.string().optional(),
    isInstantBooking: z.boolean().optional().default(false),
    items: z.array(z.object({
        providerProfessionId: z.string().uuid(),
        quantity: z.number().int().min(1).optional().default(1),
    })).min(1, "O pedido deve ter pelo menos um item."),
});

async function createOrder(req, res) {

    try {
        const { providerId, note, proposedDate, isInstantBooking, orderType, items } = createOrderSchema.parse(req.body);
        const { userId: clientId, userName } = req;

        if (clientId === providerId) {
            return res.status(400).json({ error: "Você não pode contratar a si mesmo." });
        }

        // --- FLUXO 1: RESERVA INSTANTÂNEA ---
        if (isInstantBooking) {
            // Validação específica para Reserva Instantânea
            if (items.length > 1) {
                return res.status(400).json({ error: "A Reserva Instantânea só é permitida para um serviço por vez." });
            }
            const item = items[0];

            const providerProfession = await prisma.providerProfession.findUnique({
                where: { id: item.providerProfessionId }
            });

            if (!providerProfession || !providerProfession.allowInstantBooking || !providerProfession.base_price) {
                return res.status(403).json({ error: "Este serviço não está disponível para Reserva Instantânea." });
            }

            // Transação para criar o pedido e o item, e notificar
            const newOrder = await prisma.$transaction(async (tx) => {
                const order = await tx.order.create({
                    data: {
                        clientId,
                        providerId,
                        note,
                        proposedDate: proposedDate ? new Date(proposedDate) : null,
                        status: 'SCHEDULED', // Já cria como agendado!
                        price: providerProfession.base_price * item.quantity,
                    }
                });

                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        providerProfessionId: item.providerProfessionId,
                        quantity: item.quantity,
                        unitPrice: providerProfession.base_price,
                    }
                });

                await createNotification(providerId, 'INSTANT_BOOKING', `${userName} acabou de agendar um serviço com você!`, order.id, tx);

                return order;
            });

            return res.status(201).json(newOrder);
        }

        // --- FLUXO 2 E 3: AGENDAMENTO DIRETO OU PEDIDO DE ORÇAMENTO ---
        else {
            if (!orderType) {
                return res.status(400).json({ error: "Para este tipo de pedido, 'orderType' é obrigatório." });
            }

            const newOrder = await prisma.$transaction(async (tx) => {
                let orderPrice = null;

                // Se for um agendamento direto, calcula o preço total com base nos preços base
                if (orderType === 'DIRECT_BOOKING') {
                    const itemIds = items.map(i => i.providerProfessionId);
                    const professions = await tx.providerProfession.findMany({ where: { id: { in: itemIds } } });

                    // Mapeia para um acesso rápido
                    const professionMap = new Map(professions.map(p => [p.id, p]));

                    for (const item of items) {
                        const prof = professionMap.get(item.providerProfessionId);
                        if (!prof || !prof.base_price) {
                            // Lança um erro que será pego pelo catch principal, revertendo a transação.
                            throw new Error(`O serviço ${prof?.id || item.providerProfessionId} não tem um preço base e não pode ser agendado diretamente.`);
                        }
                        orderPrice = (orderPrice || 0) + (prof.base_price * item.quantity);
                    }
                }

                // Cria o Pedido principal
                const order = await tx.order.create({
                    data: {
                        clientId,
                        providerId,
                        note,
                        proposedDate: proposedDate ? new Date(proposedDate) : null,
                        status: orderType === 'DIRECT_BOOKING' ? 'PENDING_APPROVAL' : 'PENDING_QUOTE',
                        price: orderPrice
                    }
                });

                // Prepara e cria os Itens do Pedido
                const orderItemsData = items.map(item => ({
                    orderId: order.id,
                    providerProfessionId: item.providerProfessionId,
                    quantity: item.quantity,
                }));
                await tx.orderItem.createMany({ data: orderItemsData });

                // Envia a notificação apropriada
                const notificationMessage = orderType === 'DIRECT_BOOKING'
                    ? `${userName} enviou uma solicitação de agendamento.`
                    : `${userName} solicitou um orçamento.`;
                await createNotification(providerId, 'NEW_ORDER', notificationMessage, order.id, tx);

                return order;
            });

            return res.status(201).json(newOrder);
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error("Erro ao criar pedido:", error);
        // Retorna a mensagem de erro específica se a transação falhou por nossa causa
        if (error.message.includes("não tem um preço base")) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Erro interno ao processar a solicitação." });
    }
}

function formatOrders(orders) {
    return orders.map(order => {
        // Formata os itens primeiro
        const formattedItems = order.orderItems.map(item => ({
            ...item,
            // Converte unitPrice para número, mantendo nulo se for o caso
            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
            // Opcional: Formata também o base_price para garantir consistência
            providerProfession: {
                ...item.providerProfession,
                base_price: item.providerProfession.base_price ? Number(item.providerProfession.base_price) : null,
            }
        }));

        // Retorna o pedido completo com os preços formatados
        return {
            ...order,
            // Converte o preço principal para número
            price: order.price ? Number(order.price) : null,
            // Substitui os itens antigos pelos formatados
            orderItems: formattedItems
        };
    });
}


// --- FUNÇÃO listOrders ATUALIZADA ---
async function listOrders(req, res) {
    const { userId, userType } = req;

    const includeClause = {
        client: { select: { id: true, name: true, avatar_url: true } },
        provider: { select: { id: true, name: true, avatar_url: true } },
        orderItems: {
            include: {
                providerProfession: {
                    include: {
                        profession: { select: { name: true } }
                    }
                }
            }
        },
        review: true
    };

    try {
        if (userType === 'client') {
            const rawOrders = await prisma.order.findMany({
                where: { clientId: userId },
                include: includeClause,
                orderBy: { createdAt: 'desc' },
            });
            // Formata os pedidos antes de enviar
            const formattedOrders = formatOrders(rawOrders);
            return res.json({ givenOrders: formattedOrders });
        }

        if (userType === 'provider') {
            const [rawReceivedOrders, rawGivenOrders] = await Promise.all([
                prisma.order.findMany({
                    where: { providerId: userId },
                    include: includeClause,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.order.findMany({
                    where: { clientId: userId },
                    include: includeClause,
                    orderBy: { createdAt: 'desc' },
                })
            ]);

            // Formata ambos os arrays de pedidos
            const receivedOrders = formatOrders(rawReceivedOrders);
            const givenOrders = formatOrders(rawGivenOrders);

            return res.json({ receivedOrders, givenOrders });
        }

    } catch (error) {
        console.error("Erro ao listar pedidos:", error);
        return res.status(500).json({ error: "Erro ao listar pedidos." });
    }
}

async function updateOrderStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    const { userId, userType, userName } = req;

    try {
        const order = await prisma.order.findUnique({
            where: { id: id },
            include: {
                orderItems: { include: { providerProfession: { include: { profession: true } } } },
                client: true,
                provider: true
            }
        });

        if (!order) {
            return res.status(404).json({ error: "Pedido não encontrado." });
        }

        // --- 1. DETERMINA O PAPEL DO USUÁRIO NESTE PEDIDO (A GRANDE MUDANÇA) ---
        let userRoleInOrder = null;
        if (order.clientId === userId) {
            userRoleInOrder = 'client';
        } else if (order.providerId === userId) {
            userRoleInOrder = 'provider';
        }

        // Se o usuário não é nem cliente nem prestador, ele não tem permissão.
        if (!userRoleInOrder) {
            return res.status(403).json({ error: "Você não faz parte deste pedido." });
        }

        let orderTitle = `o pedido para ${order.provider.name}`; // (lógica de título mantida)

        // --- 2. OS BLOCOS DE PERMISSÃO AGORA USAM 'userRoleInOrder' ---

        // CASO ESPECIAL: CONFIRMAÇÃO DE CONCLUSÃO (pelo cliente do pedido)
        if (userRoleInOrder === 'client' && order.status === 'COMPLETION_REQUESTED' && status === 'COMPLETED') {
            await prisma.$transaction(async (tx) => {
                await tx.order.update({ where: { id: id }, data: { status: 'COMPLETED' } });
                if (order.price) {
                    await tx.user.update({
                        where: { id: order.providerId },
                        data: { availableBalance: { increment: order.price } }
                    });
                }
            });
            await createNotification(order.providerId, 'PAYMENT_RELEASED', `${userName} confirmou a conclusão. R$${order.price} foram liberados em seu saldo.`, id);
            const finalOrder = await prisma.order.findUnique({ where: { id: id } });
            return res.json(finalOrder);
        }

        // LÓGICA GERAL PARA AS OUTRAS MUDANÇAS DE STATUS
        let canUpdate = false;
        let notificationTargetId = null;
        let notificationMessage = '';

        // Lógica de permissão do PRESTADOR (do pedido)
        if (userRoleInOrder === 'provider') {
            if (order.status === 'PENDING_APPROVAL' && status === 'AWAITING_PAYMENT') {
                canUpdate = true;
                notificationTargetId = order.clientId;
                notificationMessage = `${userName} aceitou sua solicitação. Efetue o pagamento.`;
            } else if (order.status === 'SCHEDULED' && status === 'COMPLETION_REQUESTED') {
                canUpdate = true;
                notificationTargetId = order.clientId;
                notificationMessage = `${userName} marcou o serviço como concluído.`;
            } else if (['PENDING_APPROVAL', 'PENDING_QUOTE'].includes(order.status) && status === 'REJECTED') {
                canUpdate = true;
                notificationTargetId = order.clientId;
                notificationMessage = `Sua solicitação foi rejeitada por ${userName}.`;
            } else if (['AWAITING_PAYMENT', 'SCHEDULED'].includes(order.status) && status === 'CANCELLED') {
                canUpdate = true;
                notificationTargetId = order.clientId;
                notificationMessage = `O prestador ${userName} precisou cancelar o serviço.`;
            }
        }

        // Lógica de permissão do CLIENTE (do pedido)
        if (userRoleInOrder === 'client') {
            if (order.status === 'SCHEDULED' && status === 'PROVIDER_NO_SHOW') {
                canUpdate = true;
                notificationTargetId = order.providerId;
                notificationMessage = `O cliente ${userName} reportou sua ausência.`;
            } else if (['PENDING_APPROVAL', 'AWAITING_PAYMENT', 'SCHEDULED'].includes(order.status) && status === 'CANCELLED') {
                canUpdate = true;
                notificationTargetId = order.providerId;
                notificationMessage = `${userName} cancelou o serviço.`;
            }
        }

        if (!canUpdate) {
            return res.status(403).json({ error: `Você não tem permissão para alterar o status de '${order.status}' para '${status}'.` });
        }

        const updatedOrder = await prisma.order.update({ where: { id }, data: { status } });
        if (notificationTargetId && notificationMessage) {
            await createNotification(notificationTargetId, 'ORDER_UPDATE', notificationMessage, updatedOrder.id);
        }

        return res.json(updatedOrder);

    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return res.status(500).json({ error: "Erro ao atualizar status do pedido." });
    }
}

async function confirmPaymentMock(req, res) {
    const { orderId } = req.params;
    const { userId: clientId, userName } = req;

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        // 1. Validação de Segurança e Lógica
        if (!order) {
            return res.status(404).json({ error: "Pedido não encontrado." });
        }
        if (order.clientId !== clientId) {
            return res.status(403).json({ error: "Você não tem permissão para pagar por este pedido." });
        }
        if (order.status !== 'AWAITING_PAYMENT') {
            return res.status(400).json({ error: `Este pedido não está aguardando pagamento. Status atual: ${order.status}` });
        }

        // 2. Ação: Atualiza o status para "Agendado"
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: 'SCHEDULED' },
        });

        // 3. Notificação: Avisa ao prestador que o pagamento foi recebido
        await createNotification(
            order.providerId,
            'PAYMENT_CONFIRMED',
            `${userName} efetuou o pagamento. O serviço está agendado!`,
            orderId
        );

        return res.json(updatedOrder);

    } catch (error) {
        console.error("Erro ao confirmar pagamento (mock):", error);
        return res.status(500).json({ error: "Erro interno ao processar o pagamento." });
    }
}

module.exports = { createOrder, listOrders, updateOrderStatus, confirmPaymentMock };