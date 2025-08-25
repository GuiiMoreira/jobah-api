const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const prisma = new PrismaClient();
const { cpf, cnpj } = require('cpf-cnpj-validator');



const addProfessionSchema = z.object({
    professionId: z.string().uuid("ID da profissão inválido."),
    description: z.string().min(1, "A descrição deve ter no mínimo 10 caracteres.").optional().nullable(),
    base_price: z.number().positive("O preço base deve ser um número positivo.").optional().nullable(),
});

const updateProfessionSchema = z.object({
    description: z.string().min(10, "A descrição deve ter no mínimo 10 caracteres.").optional(),
    base_price: z.number().positive("O preço base deve ser um número positivo.").optional(),
});

const verificationSchema = z.object({
    phoneNumber: z.string().min(7, "Número de telefone inválido."),
    fullAddress: z.string().min(10, "Endereço completo inválido."),
    cpf: z.string().refine(cpf.isValid, { message: "CPF inválido." }).optional().nullable(),
    cnpj: z.string().refine(cnpj.isValid, { message: "CNPJ inválido." }).optional().nullable(),
}).refine(data => data.cpf || data.cnpj, {
    message: "É necessário fornecer um CPF ou um CNPJ.",
    path: ["cpf"], // O erro será associado ao campo CPF
});

// Prestador adiciona uma profissão ao seu perfil
async function addProfessionToProfile(req, res) {
    if (req.userType !== 'provider') {
        return res.status(403).json({ error: "Apenas prestadores podem adicionar profissões ao perfil." });
    }

    try {
        const { professionId, description, base_price } = addProfessionSchema.parse(req.body);

        const newProfileProfession = await prisma.providerProfession.create({
            data: {
                providerId: req.userId,
                professionId,
                description,
                base_price,
            }
        });
        return res.status(201).json(newProfileProfession);
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
        if (error.code === 'P2002') return res.status(409).json({ error: "Você já adicionou esta profissão ao seu perfil." });
        return res.status(500).json({ error: "Erro ao adicionar profissão ao perfil." });
    }
}

async function submitVerificationData(req, res) {
    const { userId } = req;
    try {
        const { phoneNumber, fullAddress, cpf, cnpj } = verificationSchema.parse(req.body);

        // --- NOVA LÓGICA DE VERIFICAÇÃO ---
        if (cpf) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    cpf: cpf,
                    id: { not: userId } // Garante que não estamos comparando o usuário com ele mesmo
                }
            });
            if (existingUser) {
                return res.status(409).json({ error: "Este CPF já está em uso por outra conta." });
            }
        }
        if (cnpj) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    cnpj: cnpj,
                    id: { not: userId }
                }
            });
            if (existingUser) {
                return res.status(409).json({ error: "Este CNPJ já está em uso por outra conta." });
            }
        }
        // --- FIM DA NOVA LÓGICA ---

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                phoneNumber,
                fullAddress,
                cpf,
                cnpj,
                verificationStatus: 'PENDING',
            },
        });

        return res.json({ message: "Dados enviados para análise com sucesso!" });

    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
        console.error('Erro ao enviar dados para verificação:', error);
        return res.status(500).json({ error: 'Erro interno ao processar a solicitação.' });
    }
}

async function updateProfileProfession(req, res) {
    const { id } = req.params; // ID da LIGAÇÃO (ProviderProfession)
    const { userId } = req;     // ID do prestador logado

    try {
        const dataToUpdate = updateProfessionSchema.parse(req.body);


        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ error: "Nenhum dado fornecido para atualização." });
        }

        const result = await prisma.providerProfession.updateMany({
            where: {
                id: id,
                providerId: userId, // CONDIÇÃO DE SEGURANÇA!
            },
            data: dataToUpdate,
        });

        if (result.count === 0) {
            return res.status(404).json({ error: "Registro de profissão não encontrado ou você não tem permissão para editá-lo." });
        }

        const updatedRecord = await prisma.providerProfession.findUnique({
            where: { id },
            include: { profession: { select: { name: true } } }
        });

        return res.json(updatedRecord);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        return res.status(500).json({ error: "Erro ao atualizar a profissão no perfil." });
    }
}

async function removeProfessionFromProfile(req, res) {
    const { id } = req.params;
    try {
        await prisma.providerProfession.deleteMany({
            where: {
                id,
                providerId: req.userId
            }
        });
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: "Erro ao remover profissão." });
    }
}

async function itVerificationData(req, res) {
    if (req.userType !== 'provider') {
        return res.status(403).json({ error: "Apenas prestadores podem enviar dados para verificação." });
    }

    try {
        const data = verificationSchema.parse(req.body);

        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: {
                ...data,
                verificationStatus: 'PENDING'
            }
        });

        return res.json({ message: "Dados enviados para análise com sucesso!" });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        return res.status(500).json({ error: "Erro ao enviar dados para verificação." });
    }
}

module.exports = { addProfessionToProfile, removeProfessionFromProfile, submitVerificationData, updateProfileProfession };