const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const prisma = new PrismaClient();

const categorySchema = z.object({
    name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
    icon_url: z.string().url().optional(),
});

// Criar uma nova categoria (ação restrita)
async function createCategory(req, res) {

    try {
        const { name, icon_url } = categorySchema.parse(req.body);
        const category = await prisma.category.create({
            data: { name, icon_url },
        });
        return res.status(201).json(category);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        return res.status(500).json({ error: 'Erro ao criar categoria.' });
    }
}

// Listar todas as categorias (público)
async function getAllCategories(req, res) {
    try {
        const categories = await prisma.category.findMany();
        return res.json(categories);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar categorias.' });
    }
}

// Buscar uma única categoria pelo ID
async function getCategoryById(req, res) {
    const { id } = req.params;
    try {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) {
            return res.status(404).json({ error: "Categoria não encontrada." });
        }
        return res.json(category);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao buscar categoria." });
    }
}

// Atualizar uma categoria
async function updateCategory(req, res) {
    if (req.userType !== 'provider') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { id } = req.params;
    try {
        const data = categorySchema.parse(req.body);
        const updatedCategory = await prisma.category.update({
            where: { id },
            data,
        });
        return res.json(updatedCategory);
    } catch (error) {
        // PrismaClientKnownRequestError com código P2025 é "Record to update not found."
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }
        return res.status(500).json({ error: 'Erro ao atualizar categoria.' });
    }
}

// Deletar uma categoria
async function deleteCategory(req, res) {
    if (req.userType !== 'provider') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { id } = req.params;
    try {
        // VERIFICAÇÃO CRÍTICA: Não deletar se houver serviços associados
        const serviceCount = await prisma.service.count({ where: { categoryId: id } });
        if (serviceCount > 0) {
            return res.status(400).json({ error: "Não é possível deletar. Esta categoria possui serviços associados." });
        }

        await prisma.category.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }
        return res.status(500).json({ error: 'Erro ao deletar categoria.' });
    }
}


module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };