const { PrismaClient } = require('@prisma/client');
const { cpf, cnpj } = require('cpf-cnpj-validator'); // Biblioteca para validar o formato
const z = require('zod');

const prisma = new PrismaClient();

// 1. Verifica se o e-mail é válido e se já está em uso
async function checkEmail(req, res) {
    const { email } = req.body;

    // Validação de formato
    const emailSchema = z.string().email("Formato de e-mail inválido.");
    const validationResult = emailSchema.safeParse(email);
    if (!validationResult.success) {
        return res.status(400).json({ valid: false, message: validationResult.error.issues[0].message });
    }

    // Verificação de existência
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        return res.status(200).json({ valid: false, message: "Este e-mail já está em uso." });
    }

    return res.status(200).json({ valid: true, message: "E-mail disponível." });
}

// 2. Verifica se o CPF é válido e se já está em uso
async function checkCpf(req, res) {
    const { document } = req.body;
    // Validação de formato
    if (!cpf.isValid(document)) {
        return res.status(400).json({ valid: false, message: "O formato do CPF é inválido." });
    }

    // Verificação de existência
    const user = await prisma.user.findUnique({ where: { cpf: document } });
    if (user) {
        return res.status(200).json({ valid: false, message: "Este CPF já está em uso." });
    }

    return res.status(200).json({ valid: true, message: "CPF disponível." });
}

// 3. Verifica se o CNPJ é válido e se já está em uso
async function checkCnpj(req, res) {
    const { document } = req.body;


    // Validação de formato
    if (!cnpj.isValid(document)) {
        return res.status(400).json({ valid: false, message: "O formato do CNPJ é inválido." });
    }

    // Verificação de existência
    const user = await prisma.user.findUnique({ where: { cnpj: document } });
    if (user) {
        return res.status(200).json({ valid: false, message: "Este CNPJ já está em uso." });
    }

    return res.status(200).json({ valid: true, message: "CNPJ disponível." });
}

module.exports = {
    checkEmail,
    checkCpf,
    checkCnpj,
};