const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function initializeSocket(io) {
    io.on('connection', (socket) => {
        console.log(`🔌 Novo usuário conectado: ${socket.id}`);

        // Evento para o usuário entrar em uma sala de conversa
        socket.on('join_conversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`Usuário ${socket.id} entrou na sala ${conversationId}`);
        });

        // Evento para quando uma mensagem é enviada
        socket.on('send_message', async (data) => {
            const { conversationId, senderId, content } = data;

            try {
                // 1. Salvar a mensagem no banco de dados
                const message = await prisma.message.create({
                    data: {
                        conversationId,
                        senderId,
                        content,
                    },
                    include: {
                        sender: { select: { name: true, avatar_url: true } }
                    }
                });

                // 2. Enviar a mensagem para todos na mesma sala (conversa)
                io.to(conversationId).emit('receive_message', message);

            } catch (error) {
                console.error("Erro ao enviar mensagem:", error);
                // Opcional: emitir um evento de erro de volta para o remetente
                socket.emit('send_message_error', { error: 'Não foi possível enviar a mensagem.' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Usuário desconectado: ${socket.id}`);
        });
    });
}

module.exports = initializeSocket;