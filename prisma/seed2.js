const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Estrutura de dados aninhada para nossas categorias e profissões
const categoriesData = [
    {
        name: 'Casa e Reparos',
        professions: [
            'Eletricista',
            'Encanador',
            'Marceneiro',
            'Pintor',
            'Montador de Móveis',
            'Chaveiro',
            'Jardineiro',
            'Pedreiro',
            'Gesseiro',
            'Telhadista',
            'Vidraceiro',
            'Reparador de Eletrodomésticos',
            'Instalador de Ar Condicionado',
            'Impermeabilizador',
            'Dedetizador',
            'Serralheiro',
            'Calheiro',
            'Paisagista',
            'Zelador'
        ],
    },
    {
        name: 'Cuidados Pessoais',
        professions: [
            'Manicure e Pedicure',
            'Cabeleireiro(a)',
            'Maquiador(a)',
            'Esteticista',
            'Barbeiro',
            'Depilador(a)',
            'Massagista',
            'Personal Trainer',
            'Instrutor(a) de Yoga',
            'Nutricionista',
            'Dermatologista Estético (não-médico)',
            'Bronzeador(a)',
            'Tatuador(a)',
            'Body Piercer'
        ],
    },
    {
        name: 'Serviços Domésticos',
        professions: [
            'Diarista',
            'Cozinheiro(a)',
            'Cuidador(a) de Idosos',
            'Babá',
            'Dog Walker',
            'Passadeira',
            'Faxineiro(a)',
            'Caseiro(a)',
            'Lavadeira',
            'Organizador(a) Profissional',
            'Panfleteiro(a)',
            'Motorista Particular',
            'Governante',
            'Pet Sitter',
            'Treinador(a) de Animais'
        ],
    },
    {
        name: 'Tecnologia',
        professions: [
            'Técnico de Informática',
            'Técnico de Celular',
            'Instalador de Antenas',
            'Editor de Vídeo',
            'Designer Gráfico',
            'Desenvolvedor Web',
            'Instalador de Câmeras de Segurança',
            'Consultor de TI',
            'Programador',
            'Fotógrafo de Produtos',
            'Social Media',
            'Gestor de Tráfego Pago',
            'Técnico em Redes',
            'Suporte Técnico Remoto',
            'Designer de UI/UX'
        ],
    },
    {
        name: 'Eventos',
        professions: [
            'Fotógrafo(a)',
            'DJ',
            'Segurança',
            'Garçom/Garçonete',
            'Decorador(a)',
            'Cerimonialista',
            'Barman/Bartender',
            'Animador(a) de Festa',
            'Locutor(a)',
            'Sonoplasta',
            'Montador de Estruturas',
            'Cozinheiro(a) para Eventos',
            'Iluminador',
            'Recepcionista de Evento',
            'Aluguel de Móveis/Eventos'
        ],
    },
    {
        name: 'Aulas e Educação',
        professions: [
            'Professor(a) Particular',
            'Aula de Reforço Escolar',
            'Professor(a) de Inglês',
            'Professor(a) de Música',
            'Aula de Violão',
            'Aula de Dança',
            'Preparador(a) para ENEM/Concursos',
            'Recreador(a) Infantil',
            'Aula de Culinária',
            'Instrutor(a) de Autoescola',
            'Coach de Carreira'
        ],
    },
    {
        name: 'Beleza e Moda',
        professions: [
            'Consultor(a) de Imagem',
            'Personal Stylist',
            'Costureiro(a)',
            'Designer de Sobrancelhas',
            'Estilista',
            'Consultor(a) de Moda',
            'Designer de Unhas',
            'Aplicador(a) de Cílios'
        ],
    },
    {
        name: 'Transporte e Entregas',
        professions: [
            'Motoboy',
            'Motorista de Aplicativo',
            'Freteiro',
            'Transportador de Mudanças',
            'Entregador(a) de Encomendas',
            'Carreteiro',
            'Transportador Escolar',
            'Serviço de Guincho'
        ],
    },
    {
        name: 'Consultoria e Serviços Profissionais',
        professions: [
            'Contador(a)',
            'Advogado(a)',
            'Consultor(a) Financeiro',
            'Psicólogo(a)',
            'Coach Pessoal',
            'Arquiteto(a)',
            'Engenheiro(a)',
            'Designer de Interiores',
            'Tradutor(a)',
            'Revisor(a) de Textos',
            'Redator(a) Freelancer'
        ],
    }
];


async function main() {
    console.log(`Iniciando o processo de seeding...`);

    // 1. Garante que o usuário Admin existe
    const adminEmail = 'admin@jobah.com.br';
    const adminPassword = 'admin_super_seguro_123';
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            name: 'Administrador JOBAH',
            email: adminEmail,
            password_hash: await bcrypt.hash(adminPassword, 8),
            type: 'admin',
        },
    });
    console.log(`- Usuário Admin garantido.`);

    // 2. Itera sobre a estrutura de dados para criar tudo
    for (const cat of categoriesData) {
        // Cria a SuperCategoria (ou a obtém, se já existir)
        const superCategory = await prisma.superCategory.upsert({
            where: { name: cat.name },
            update: {},
            create: { name: cat.name },
        });
        console.log(`-- SuperCategoria '${superCategory.name}' garantida.`);

        // Itera sobre as profissões dentro da SuperCategoria
        for (const prof of cat.professions) {
            // Cria a Profissão, já vinculando ao superCategoryId correto
            await prisma.profession.upsert({
                where: { name: prof },
                update: {},
                create: {
                    name: prof,
                    superCategoryId: superCategory.id, // <-- Vínculo importante!
                },
            });
        }
        console.log(`--- Profissões para '${superCategory.name}' foram criadas.`);
    }
    console.log(`Seeding de categorias e profissões concluído.`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });