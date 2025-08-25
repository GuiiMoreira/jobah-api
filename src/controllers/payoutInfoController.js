const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { z } = require('zod');

// PRESTADOR: Busca suas informações de pagamento salvas
async function getPayoutInfo(req, res) {
    const { userId } = req;
    try {
        const info = await prisma.providerPayoutInfo.findUnique({ where: { userId } });
        if (!info) return res.status(404).json({ error: "Nenhuma informação de pagamento encontrada." });
        return res.json(info);
    } catch (error) { /* ... tratamento de erro ... */ }
}

// PRESTADOR: Cria ou atualiza suas informações de pagamento
async function upsertPayoutInfo(req, res) {
    const { userId } = req;
    const { payoutType, pixKey, bankName, agencyNumber, accountNumber } = req.body; // Valide com Zod

    try {
        let dataToSave = {
            userId,
            payoutType,
        };
        if (payoutType === 'PIX') {
            dataToSave.pixKey = pixKey;
            dataToSave.bankName = null;
            dataToSave.agencyNumber = null;
            dataToSave.accountNumber = null;
        } else if (payoutType === 'BANK_ACCOUNT') {
            dataToSave.pixKey = null;
            dataToSave.bankName = bankName;
            dataToSave.agencyNumber = agencyNumber;
            dataToSave.accountNumber = accountNumber;
        } else {
            return res.status(400).json({ error: "Tipo de pagamento inválido." });
        }

        const info = await prisma.providerPayoutInfo.upsert({
            where: { userId },
            update: dataToSave,
            create: dataToSave,
        });

        return res.status(200).json(info);

    } catch (error) {
        console.error("Erro ao salvar informações de pagamento:", error);
        return res.status(500).json({ error: "Erro interno ao salvar informações." });
    }
}


module.exports = { getPayoutInfo, upsertPayoutInfo };