const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// PRESTADOR: Vê o resumo da sua carteira
async function getWalletDashboard(req, res) {
    const { userId: providerId } = req;
    try {
        const provider = await prisma.user.findUnique({
            where: { id: providerId },
            select: { availableBalance: true }
        });

        const pendingOrders = await prisma.order.aggregate({
            _sum: { price: true },
            where: {
                providerId: providerId,
                status: { in: ['SCHEDULED', 'COMPLETION_REQUESTED'] }
            }
        });

        console.log({
            availableBalance: provider.availableBalance || 0,
            pendingBalance: pendingOrders._sum.price || 0,
        })

        res.json({
            availableBalance: provider.availableBalance || 0,
            pendingBalance: pendingOrders._sum.price || 0,
        });
    } catch (error) { /* ... tratamento de erro ... */ }
}

// PRESTADOR: Solicita um saque (fake)
async function requestWithdrawal(req, res) {
    const { userId: providerId } = req;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valor de saque inválido." });
    }

    try {
        await prisma.$transaction(async (tx) => {
            const provider = await tx.user.findUnique({ where: { id: providerId } });
            if (!provider || (provider.availableBalance || 0) < amount) {
                throw new Error("Saldo insuficiente.");
            }

            // Debita o saldo do prestador
            await tx.user.update({
                where: { id: providerId },
                data: { availableBalance: { decrement: amount } }
            });

            // Cria um registro do saque "concluído"
            await tx.withdrawal.create({
                data: { providerId, amount, status: 'COMPLETED' }
            });
        });
        return res.json({ message: "Saque realizado com sucesso." });
    } catch (error) {
        if (error.message === "Saldo insuficiente.") {
            return res.status(400).json({ error: error.message });
        }
        /* ... tratamento de erro ... */
    }
}

module.exports = { getWalletDashboard, requestWithdrawal };