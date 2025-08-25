const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Inicia uma nova conversa ou retorna uma existente
async function initiateConversation(req, res) {
    const { recipientId } = req.body;
    const initiatorId = req.userId;

    if (initiatorId === recipientId) {
        return res.status(400).json({ error: "Você não pode iniciar uma conversa consigo mesmo." });
    }

    try {
        // Verifica se uma conversa entre esses dois usuários já existe
        let conversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { id: initiatorId } } },
                    { participants: { some: { id: recipientId } } },
                ]
            }
        });

        // Se não existir, cria uma nova
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participants: {
                        connect: [{ id: initiatorId }, { id: recipientId }]
                    }
                }
            });
        }

        return res.json(conversation);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao iniciar conversa." });
    }
}

// Lista todas as conversas do usuário logado
async function listConversations(req, res) {
    try {
        const conversations = await prisma.conversation.findMany({
            where: { participants: { some: { id: req.userId } } },
            include: {
                participants: { select: { id: true, name: true, avatar_url: true } },
                messages: { orderBy: { created_at: 'desc' }, take: 1 } // Pega a última mensagem
            }
        });
        return res.json(conversations);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao listar conversas." });
    }
}

// Lista as mensagens de uma conversa específica
async function getMessages(req, res) {
    const { id } = req.params; // ID da conversa
    try {
        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            include: { sender: { select: { id: true, name: true, avatar_url: true } } },
            orderBy: { created_at: 'asc' }
        });
        return res.json(messages);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao buscar mensagens." });
    }
}

module.exports = { initiateConversation, listConversations, getMessages };