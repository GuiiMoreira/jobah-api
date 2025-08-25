const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Cria e salva uma notificação no banco de dados.
 * Aceita um cliente Prisma opcional para poder ser usada dentro de transações.
 * @param {string} userId - O ID do usuário que receberá a notificação.
 * @param {string} type - O tipo da notificação.
 * @param {string} message - O texto da notificação.
 * @param {string|null} orderId - (Opcional) O ID do pedido relacionado.
 * @param {object} prismaClient - (Opcional) O cliente Prisma a ser usado (padrão: global).
 */
async function createNotification(userId, type, message, orderId = null, prismaClient = prisma) {
    try {
        // Usa o cliente Prisma que foi passado como parâmetro (pode ser o 'tx' da transação)
        await prismaClient.notification.create({
            data: {
                userId,
                type,
                message,
                orderId,
            },
        });
    } catch (error) {
        // Lança o erro para que a transação possa ser revertida (rollback)
        console.error("Falha ao criar notificação:", error);
        throw error;
    }
}

module.exports = {
    createNotification,
};