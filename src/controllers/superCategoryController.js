const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const prisma = new PrismaClient();

const superCategorySchema = z.object({
    name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
});

// Admin cria uma nova Super Categoria
async function createSuperCategory(req, res) {
    try {
        const { name } = superCategorySchema.parse(req.body);
        const superCategory = await prisma.superCategory.create({ data: { name } });
        return res.status(201).json(superCategory);
    } catch (error) {
        if (error.code === 'P2002') return res.status(409).json({ error: "Uma super categoria com este nome já existe." });
        return res.status(500).json({ error: 'Erro ao criar super categoria.' });
    }
}

// Lista todas as Super Categorias (pode ser pública ou de admin)
async function getAllSuperCategories(req, res) {
    try {
        const superCategories = await prisma.superCategory.findMany({ orderBy: { name: 'asc' } });
        return res.json(superCategories);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar super categorias.' });
    }
}

async function listAllWithProfessions(req, res) {
    try {
        const groupedProfessions = await prisma.superCategory.findMany({
            include: {
                professions: {
                    select: { id: true, name: true, icon_url: true },
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });
        return res.json(groupedProfessions);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
}

async function getSuperCategoryById(req, res) {
    const { id } = req.params;
    try {
        const superCategory = await prisma.superCategory.findUnique({
            where: { id },
            include: {
                professions: {
                    select: { id: true, name: true, icon_url: true },
                    orderBy: { name: 'asc' },
                }
            }
        });

        if (!superCategory) {
            return res.status(404).json({ error: "Super Categoria não encontrada." });
        }

        return res.json(superCategory);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar super categoria.' });
    }
}


module.exports = { createSuperCategory, getAllSuperCategories, listAllWithProfessions, getSuperCategoryById };