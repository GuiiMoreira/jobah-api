const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { z } = require('zod');
const fs = require('fs');
const path = require('path');
const uploadConfig = require('../config/upload');
const bcrypt = require('bcryptjs');

// 1. Zod Schema para troca de senha (sem alterações)
const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres."),
});

// 2. Zod Schema para atualização de perfil (ATUALIZADO)
const updateProfileSchema = z.object({
    name: z.string().min(3).optional(),
    bio: z.string().optional().nullable(),
    email: z.string().email("Formato de e-mail inválido.").optional(),

    // Novos campos de endereço estruturado
    street: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),

    // Novos campos de marketing e perfil
    websiteUrl: z.string().url("URL do site inválida.").optional().nullable(),
    instagramUrl: z.string().url("URL do Instagram inválida.").optional().nullable(),
    linkedinUrl: z.string().url("URL do LinkedIn inválida.").optional().nullable(),
    operatingHours: z.string().optional().nullable(),
    yearsOfExperience: z.coerce.number().int().positive().optional().nullable(),
});

// 3. getProfile (ATUALIZADO com novos campos)
async function getProfile(req, res) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                name: true,
                email: true,
                type: true,
                avatar_url: true,
                bio: true,
                created_at: true,
                verificationStatus: true,
                // Novos campos
                street: true,
                city: true,
                state: true,
                postalCode: true,
                websiteUrl: true,
                instagramUrl: true,
                linkedinUrl: true,
                operatingHours: true,
                yearsOfExperience: true,
                // Relações
                professions: {
                    select: {
                        id: true,
                        description: true,
                        base_price: true,
                        profession: {
                            select: { name: true, icon_url: true },
                        },
                    },
                },
            },
        });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar perfil.' });
    }
}

// 4. updateProfile (ATUALIZADO com select de novos campos)
async function updateProfile(req, res) {
    try {
        const data = updateProfileSchema.parse(req.body);

        if (data.email) {
            const user = await prisma.user.findUnique({ where: { id: req.userId } });
            if (data.email.toLowerCase() !== user.email) {
                const emailExists = await prisma.user.findUnique({
                    where: { email: data.email.toLowerCase() }
                });
                if (emailExists) {
                    return res.status(409).json({ error: "Este e-mail já está em uso por outra conta." });
                }
            }
        }

        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: "Nenhum dado fornecido para atualização." });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data,
            select: { // Retorna o perfil completo com os dados atualizados
                id: true, name: true, email: true, type: true, avatar_url: true, bio: true,
                street: true, city: true, state: true, postalCode: true, websiteUrl: true,
                instagramUrl: true, linkedinUrl: true, operatingHours: true, yearsOfExperience: true,
            },
        });

        return res.json(updatedUser);
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
}

// Deletar o perfil do próprio usuário logado
async function deleteProfile(req, res) {
    try {
        await prisma.user.delete({
            where: { id: req.userId },
        });

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao deletar perfil.' });
    }
}

async function getPublicProfile(req, res) {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                type: true,
                avatar_url: true,
                bio: true,
                created_at: true,
                averageRating: true,
                totalReviews: true,
                city: true,
                state: true,
                websiteUrl: true,
                instagramUrl: true,
                linkedinUrl: true,
                operatingHours: true,
                yearsOfExperience: true,
                verificationStatus: true,

                // 1. ADICIONADO: Contagem de pedidos concluídos
                _count: {
                    select: {
                        orders_as_provider: {
                            where: { status: 'COMPLETED' }
                        }
                    }
                },

                // Relações que já existiam
                portfolioImages: {
                    select: { id: true, imageUrl: true, caption: true },
                    orderBy: { createdAt: 'asc' }
                },
                professions: {
                    select: {
                        id: true,
                        description: true,
                        base_price: true,
                        profession: { select: { name: true, icon_url: true } }
                    }
                },
                reviews_received: {
                    where: {
                        status: 'ACTIVE',
                        // reviewer: {
                        //     accountStatus: 'ACTIVE'
                        // }
                    },
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        reviewer: { select: { id: true, name: true, avatar_url: true } },
                        photos: { select: { id: true, imageUrl: true } },
                        order: {
                            select: {
                                id: true,
                                orderItems: {
                                    select: {
                                        providerProfession: {
                                            select: {
                                                profession: { select: { name: true } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // 2. ADICIONADO: Lógica para formatar a resposta final

        // Formata as avaliações para incluir a lista de serviços
        const formattedReviews = user.reviews_received.map(review => {
            const { order, ...restOfReview } = review;
            const serviceNames = order.orderItems.map(
                item => item.providerProfession.profession.name
            );
            return {
                ...restOfReview,
                order: {
                    id: order.id,
                    services: serviceNames
                }
            };
        });

        // Extrai a contagem de trabalhos e prepara o objeto final
        const completedJobsCount = user._count.orders_as_provider;
        const { _count, ...restOfUser } = user;

        const formattedUser = {
            ...restOfUser,
            reviews_received: formattedReviews,
            completedJobs: completedJobsCount, // Adiciona o novo campo limpo
        };

        return res.json(formattedUser);

    } catch (error) {
        console.error('Erro ao buscar perfil público:', error);
        return res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
    }
}

async function updateAvatar(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
        });

        // Deleta o avatar antigo, se existir
        if (user.avatar_url) {
            const avatarFileName = user.avatar_url.split('/files/')[1];
            const oldAvatarPath = path.join(uploadConfig.directory, avatarFileName);
            if (fs.existsSync(oldAvatarPath)) {
                await fs.promises.unlink(oldAvatarPath);
            }
        }

        // Constrói a URL completa do novo avatar
        const avatarUrl = `<span class="math-inline">\{process\.env\.APP\_URL \|\| 'http\://localhost\:3333'\}/files/</span>{req.file.filename}`;

        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: { avatar_url: avatarUrl },
            select: { id: true, name: true, avatar_url: true } // Retorna só os dados necessários
        });

        return res.json(updatedUser);

    } catch (error) {
        return res.status(500).json({ error: "Erro ao atualizar avatar." });
    }
}

async function deactivateAccount(req, res) {
    const { userId } = req;
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { accountStatus: 'DEACTIVATED' },
        });
        // Futuramente, aqui você pode invalidar os tokens JWT do usuário
        return res.status(200).json({ message: "Sua conta foi desativada com sucesso." });
    } catch (error) {
        console.error("Erro ao desativar conta:", error);
        return res.status(500).json({ error: "Não foi possível desativar sua conta no momento." });
    }
}

async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { id: req.userId } });

        const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: "A senha atual está incorreta." });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 8);

        await prisma.user.update({
            where: { id: req.userId },
            data: { password_hash: newPasswordHash },
        });

        return res.status(204).send();

    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
        return res.status(500).json({ error: "Erro ao alterar a senha." });
    }
}

async function getGivenReviews(req, res) {
    const { userId } = req;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const whereClause = { reviewerId: userId, status: 'ACTIVE' };

    try {
        const reviews = await prisma.review.findMany({
            where: whereClause,
            include: {
                provider: { select: { id: true, name: true, avatar_url: true } },
                reviewer: { select: { id: true, name: true, avatar_url: true } },
                photos: { select: { id: true, imageUrl: true } },
                // --- INCLUSÃO DO PEDIDO ---
                // Inclui os detalhes do pedido e dos serviços prestados
                order: {
                    select: {
                        id: true,
                        createdAt: true,
                        orderItems: {
                            select: {
                                providerProfession: {
                                    select: {
                                        profession: { select: { name: true } }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: skip,
        });

        // --- FORMATAÇÃO DOS DADOS ---
        // Transforma a estrutura aninhada de serviços em uma lista simples de nomes
        const formattedReviews = reviews.map(review => {
            const { order, ...restOfReview } = review;
            const serviceNames = order.orderItems.map(
                item => item.providerProfession.profession.name
            );
            return {
                ...restOfReview,
                order: {
                    id: order.id,
                    createdAt: order.createdAt,
                    services: serviceNames // Array de nomes dos serviços
                }
            };
        });

        const total = await prisma.review.count({ where: whereClause });

        return res.json({
            data: formattedReviews,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });

    } catch (error) {
        console.error("Erro ao buscar avaliações realizadas:", error);
        return res.status(500).json({ error: "Erro ao buscar avaliações." });
    }
}

// Busca as avaliações que o usuário logado RECEBEU (RECEIVED)
async function getReceivedReviews(req, res) {
    const { userId } = req;
    const { page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const whereClause = { providerId: userId, status: 'ACTIVE' };

    try {
        const reviews = await prisma.review.findMany({
            where: whereClause,
            include: {
                reviewer: { select: { id: true, name: true, avatar_url: true } },
                photos: { select: { id: true, imageUrl: true } },
                // --- INCLUSÃO DO PEDIDO ---
                order: {
                    select: {
                        id: true,
                        createdAt: true,
                        orderItems: {
                            select: {
                                providerProfession: {
                                    select: {
                                        profession: { select: { name: true } }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: skip,
        });

        // --- FORMATAÇÃO DOS DADOS ---
        const formattedReviews = reviews.map(review => {
            const { order, ...restOfReview } = review;
            const serviceNames = order.orderItems.map(
                item => item.providerProfession.profession.name
            );

            console.log(order);
            return {
                ...restOfReview,
                order: {
                    id: order.id,
                    createdAt: order.createdAt,
                    services: serviceNames
                }
            };
        });

        const total = await prisma.review.count({ where: whereClause });

        return res.json({
            data: formattedReviews,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });

    } catch (error) {
        console.error("Erro ao buscar avaliações recebidas:", error);
        return res.status(500).json({ error: "Erro ao buscar avaliações." });
    }
}

// Exporta todas as funções
module.exports = {
    getProfile,
    updateProfile,
    deleteProfile,
    getPublicProfile,
    updateAvatar,
    changePassword,
    getGivenReviews,
    getReceivedReviews,
    deactivateAccount
};