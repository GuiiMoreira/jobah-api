const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const uploadConfig = require('../config/upload');
const prisma = new PrismaClient();

// Adicionar imagens ao portfólio
async function addPortfolioImages(req, res) {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    try {
        const imagePromises = req.files.map(file => {
            const imageUrl = `${process.env.APP_URL || 'http://localhost:3333'}/files/${file.filename}`;
            return prisma.portfolioImage.create({
                data: {
                    imageUrl,
                    providerId: req.userId,
                },
            });
        });

        const createdImages = await Promise.all(imagePromises);
        return res.status(201).json(createdImages);

    } catch (error) {
        return res.status(500).json({ error: "Erro ao adicionar imagens ao portfólio." });
    }
}

// Remover uma imagem do portfólio
async function removePortfolioImage(req, res) {
    const { imageId } = req.params;
    const { userId } = req;

    try {
        const image = await prisma.portfolioImage.findUnique({ where: { id: imageId } });

        if (!image || image.providerId !== userId) {
            return res.status(404).json({ error: "Imagem não encontrada ou você não tem permissão para removê-la." });
        }

        // Deleta o arquivo do disco
        const imageFileName = image.imageUrl.split('/files/')[1];
        const imagePath = path.join(uploadConfig.directory, imageFileName);
        if (fs.existsSync(imagePath)) {
            await fs.promises.unlink(imagePath);
        }

        // Deleta o registro do banco
        await prisma.portfolioImage.delete({ where: { id: imageId } });

        return res.status(204).send();

    } catch (error) {
        return res.status(500).json({ error: "Erro ao remover imagem do portfólio." });
    }
}

module.exports = { addPortfolioImages, removePortfolioImage };