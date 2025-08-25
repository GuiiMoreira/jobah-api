const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const prisma = new PrismaClient();

// Schema de validação para a atualização do serviço
const updateServiceSchema = z.object({
    description: z.string().optional(),
    base_price: z.number().positive().optional(),
});

// PRESTADOR: Atualiza um dos seus próprios serviços (ProviderProfession)
async function updateMyService(req, res) {
    const { userId: providerId } = req;
    const { serviceId } = req.params; // ID da tabela ProviderProfession

    try {
        const dataToUpdate = updateServiceSchema.parse(req.body);

        // 1. Verifica se o serviço a ser atualizado realmente pertence ao prestador logado
        const service = await prisma.providerProfession.findFirst({
            where: {
                id: serviceId,
                providerId: providerId
            }
        });

        if (!service) {
            return res.status(404).json({ error: "Serviço não encontrado ou você não tem permissão para editá-lo." });
        }

        // 2. Atualiza o serviço
        const updatedService = await prisma.providerProfession.update({
            where: { id: serviceId },
            data: dataToUpdate,
        });

        return res.json(updatedService);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error("Erro ao atualizar serviço:", error);
        return res.status(500).json({ error: "Erro interno ao atualizar o serviço." });
    }
}

module.exports = { updateMyService };