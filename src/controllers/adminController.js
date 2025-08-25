const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Listar todas as sugestões (ou filtrar por status)
async function listSuggestions(req, res) {
    const { status } = req.query; // ex: /api/v1/admin/suggestions?status=PENDING
    try {
        const suggestions = await prisma.categorySuggestion.findMany({
            where: {
                status: status ? status.toUpperCase() : undefined,
            },
            include: {
                requestedBy: { select: { id: true, name: true } },
            }
        });
        return res.json(suggestions);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao listar sugestões." });
    }
}

// Processar uma sugestão (Aprovar ou Rejeitar)
async function manageSuggestion(req, res) {
    const { id } = req.params; // ID da sugestão
    const { action } = req.body; // 'APPROVE' ou 'REJECT'

    if (!['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({ error: "Ação inválida. Use 'APPROVE' ou 'REJECT'." });
    }

    const suggestion = await prisma.categorySuggestion.findUnique({ where: { id } });
    if (!suggestion || suggestion.status !== 'PENDING') {
        return res.status(404).json({ error: "Sugestão não encontrada ou já processada." });
    }

    try {
        if (action === 'APPROVE') {
            // Usamos uma transação para garantir que ambas as operações funcionem
            await prisma.$transaction(async (tx) => {
                // 1. Cria a nova categoria
                await tx.category.create({
                    data: { name: suggestion.name },
                });
                // 2. Atualiza o status da sugestão
                await tx.categorySuggestion.update({
                    where: { id },
                    data: {
                        status: 'APPROVED',
                        reviewedById: req.userId, // ID do admin logado
                    },
                });
            });
            return res.json({ message: `Categoria '${suggestion.name}' criada com sucesso.` });
        } else { // REJECT
            await prisma.categorySuggestion.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    reviewedById: req.userId,
                },
            });
            return res.json({ message: `Sugestão '${suggestion.name}' rejeitada.` });
        }
    } catch (error) {
        // Se a categoria já existir (corrida de condição), o prisma vai dar erro de 'unique constraint'
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "Uma categoria com este nome já existe." });
        }
        return res.status(500).json({ error: "Erro ao processar a sugestão." });
    }
}

module.exports = { listSuggestions, manageSuggestion };