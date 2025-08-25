const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listNotifications(req, res) {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(notifications);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao buscar notificações." });
    }
}

async function markAsRead(req, res) {
    try {
        // Marca todas as notificações do usuário como lidas
        await prisma.notification.updateMany({
            where: { userId: req.userId, isRead: false },
            data: { isRead: true },
        });
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: "Erro ao marcar notificações como lidas." });
    }
}

async function deleteNotification(req, res) {
    const { userId } = req;
    const { notificationId } = req.params;

    try {
        const notification = await prisma.notification.findFirst({
            where: { id: notificationId, userId: userId }
        });

        // Garante que o usuário só pode excluir suas próprias notificações
        if (!notification) {
            return res.status(404).json({ error: "Notificação não encontrada ou você não tem permissão para excluí-la." });
        }

        await prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'DELETED' },
        });

        return res.status(200).json({ message: "Notificação excluída com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir notificação:", error);
        return res.status(500).json({ error: "Erro ao processar a solicitação." });
    }
}

module.exports = { listNotifications, markAsRead, deleteNotification };