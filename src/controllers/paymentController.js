const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createFakePixCharge } = require('../services/paymentService'); // Um novo serviço que criaremos

// CLIENTE: Gera uma cobrança PIX para um pedido existente
async function generatePixForOrder(req, res) {
    const { orderId } = req.params;
    const { userId } = req;

    try {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                clientId: userId,
                status: 'AWAITING_PAYMENT'
            }
        });

        if (!order) {
            return res.status(404).json({ error: "Pedido não encontrado ou não está aguardando pagamento." });
        }

        if (!order.price) {
            return res.status(400).json({ error: "Pedido sem preço definido. Não é possível gerar a cobrança PIX." });
        }

        // Chama nosso serviço que se comunica com o PSP
        const pixData = await createFakePixCharge(order.id, order.price);

        if (!pixData) {
            return res.status(500).json({ error: "Não foi possível gerar a cobrança PIX no momento." });
        }

        // Retorna os dados para o frontend renderizar
        return res.json({
            qrCodeImage: pixData.qrCodeImage, // Imagem em base64
            qrCodeText: pixData.qrCodeText,   // Código "Copia e Cola"
            expiresAt: pixData.expiresAt      // Data de expiração
        });

    } catch (error) {
        console.error("Erro ao gerar PIX para o pedido:", error);
        return res.status(500).json({ error: "Erro interno ao gerar a cobrança PIX." });
    }
}

module.exports = { generatePixForOrder };