const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const prisma = new PrismaClient();

const suggestionSchema = z.object({
    name: z.string().min(3, "O nome da categoria deve ter no mínimo 3 caracteres."),
});

async function createSuggestion(req, res) {
    // Apenas providers podem sugerir
    if (req.userType !== 'provider') {
        return res.status(403).json({ error: "Apenas prestadores podem sugerir novas categorias." });
    }

    try {
        const { name } = suggestionSchema.parse(req.body);

        // Verificar se já não existe uma categoria ou sugestão com esse nome
        const existingCategory = await prisma.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
        const existingSuggestion = await prisma.categorySuggestion.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });

        if (existingCategory || existingSuggestion) {
            return res.status(409).json({ error: "Uma categoria ou sugestão com este nome já existe." });
        }

        const suggestion = await prisma.categorySuggestion.create({
            data: {
                name,
                requestedById: req.userId, // ID do provider logado
            },
        });

        return res.status(202).json({ message: "Sugestão enviada para análise!", suggestion }); // 202 Accepted

    } catch (error) {
        // ... (tratamento de erro zod e genérico)
        return res.status(500).json({ error: "Erro ao criar sugestão." });
    }
}

module.exports = { createSuggestion };