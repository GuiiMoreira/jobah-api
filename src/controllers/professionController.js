const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const prisma = new PrismaClient();

const professionSchema = z.object({
    name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
    icon_url: z.string().url("URL do ícone inválida.").optional().nullable(),
});

// Admin cria uma nova profissão
async function createProfession(req, res) {
    try {
        const data = professionSchema.parse(req.body);
        const profession = await prisma.profession.create({ data });
        return res.status(201).json(profession);
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
        if (error.code === 'P2002') return res.status(409).json({ error: "Uma profissão com este nome já existe." });
        return res.status(500).json({ error: 'Erro ao criar profissão.' });
    }
}

// Rota pública para listar todas as profissões
async function getAllProfessions(req, res) {
    try {
        const professions = await prisma.profession.findMany({
            orderBy: { name: 'asc' }
        });
        return res.json(professions);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar profissões.' });
    }
}

// Admin deleta uma profissão
async function deleteProfession(req, res) {
    const { id } = req.params;
    try {
        await prisma.profession.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Profissão não encontrada.' });
        if (error.code === 'P2003') return res.status(400).json({ error: 'Não é possível deletar. Esta profissão está em uso por prestadores.' });
        return res.status(500).json({ error: 'Erro ao deletar profissão.' });
    }
}

module.exports = { createProfession, getAllProfessions, deleteProfession };