const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { sendPasswordResetEmail } = require('../services/emailService');

const prisma = new PrismaClient();

// 1. Schema de validação ATUALIZADO para o cadastro
const signupSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    type: z.enum(['client', 'provider']),
    phoneNumber: z.string().optional(),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    fullAddress: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.type === 'provider' && !data.cpf && !data.gcnpj) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Para prestadores de serviço, o CPF ou CNPJ é obrigatório.",
            path: ["cpf"],
        });
    }
});


async function signup(req, res) {
    try {
        const {
            name, email, password, type,
            phoneNumber, cpf, cnpj, fullAddress,
            street, city, state, postalCode
        } = signupSchema.parse(req.body);

        const emailInUse = await prisma.user.findUnique({ where: { email } });
        if (emailInUse) {
            return res.status(409).json({ error: 'Este e-mail já está em uso.' });
        }

        if (cpf) {
            const cpfInUse = await prisma.user.findUnique({ where: { cpf } });
            if (cpfInUse) {
                return res.status(409).json({ error: 'Este CPF já está em uso.' });
            }
        }
        if (cnpj) {
            const cnpjInUse = await prisma.user.findUnique({ where: { cnpj } });
            if (cnpjInUse) {
                return res.status(409).json({ error: 'Este CNPJ já está em uso.' });
            }
        }

        const password_hash = await bcrypt.hash(password, 8);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password_hash,
                type,
                phoneNumber,
                cpf,
                cnpj,
                fullAddress,
                street,
                city,
                state,
                postalCode,
            },
        });

        const token = jwt.sign(
            { id: user.id, type: user.type, name: user.name },
            process.env.JWT_SECRET || 'SEGREDO_SUPER_SECRETO_MUDAR_EM_PROD',
            { expiresIn: '1d' }
        );

        const { password_hash: _, ...userWithoutPassword } = user;

        return res.status(201).json({ user: userWithoutPassword, token });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error("Signup Error:", error);
        return res.status(500).json({ error: 'Ocorreu um erro interno.' });
    }
}

// O controller de login não precisa de nenhuma alteração
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

async function login(req, res) {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        if (user.accountStatus !== 'ACTIVE') {
            return res.status(403).json({
                error: "Esta conta foi desativada ou suspensa. Entre em contato com o suporte."
            });
        }

        const token = jwt.sign(
            { id: user.id, type: user.type, name: user.name },
            process.env.JWT_SECRET || 'SEGREDO_SUPER_SECRETO_MUDAR_EM_PROD',
            { expiresIn: '1d' }
        );

        const { password_hash, ...userWithoutPassword } = user;

        return res.json({ user: userWithoutPassword, token });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        return res.status(500).json({ error: 'Ocorreu um erro interno.' });
    }
}

async function forgotPassword(req, res) {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });

        // IMPORTANTE: Sempre retorne sucesso, mesmo se o e-mail não existir.
        // Isso previne que alguém use esta rota para descobrir quais e-mails estão cadastrados.
        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

            await prisma.user.update({
                where: { email },
                data: { passwordResetToken, passwordResetExpires },
            });

            try {
                // Envia o token NÃO HASHADO para o usuário por e-mail
                await sendPasswordResetEmail(email, resetToken);
            } catch (error) {
                // Limpa os campos se o e-mail falhar
                await prisma.user.update({ where: { email }, data: { passwordResetToken: null, passwordResetExpires: null } });
                return res.status(500).json({ error: "Não foi possível enviar o e-mail de redefinição." });
            }
        }

        return res.status(200).json({ message: "Se um e-mail cadastrado for encontrado, um link de redefinição será enviado." });

    } catch (error) {
        return res.status(500).json({ error: 'Ocorreu um erro interno.' });
    }
}


async function resetPassword(req, res) {
    const { token, password } = req.body;
    try {
        // 1. Recria o token hashado para buscar no banco
        const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');

        // 2. Busca o usuário pelo token e verifica se não expirou
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken,
                passwordResetExpires: { gte: new Date() }, // gte = Greater Than or Equal
            }
        });

        if (!user) {
            return res.status(400).json({ error: "Token inválido ou expirado." });
        }

        // 3. Atualiza a senha e limpa os campos de redefinição
        const newPasswordHash = await bcrypt.hash(password, 8);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash: newPasswordHash,
                passwordResetToken: null,
                passwordResetExpires: null,
            },
        });

        return res.status(200).json({ message: "Senha redefinida com sucesso." });
    } catch (error) {
        return res.status(500).json({ error: 'Ocorreu um erro interno.' });
    }
}

module.exports = { signup, login, forgotPassword, resetPassword };