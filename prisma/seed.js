const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker/locale/pt_BR');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function updateProviderRating(tx, providerId) {
    const reviews = await tx.review.findMany({
        where: { providerId: providerId, status: 'ACTIVE' },
    });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
        : 0;
    await tx.user.update({
        where: { id: providerId },
        data: { totalReviews, averageRating: parseFloat(averageRating.toFixed(2)) },
    });
}

async function main() {
    const { generate: generateCpf } = await import('gerador-validador-cpf');
    const { generate: generateCNPJ } = await import('gerador-validador-cnpj');

    console.log(`🧹 Limpando o banco de dados...`);
    await prisma.providerPayoutInfo.deleteMany();
    await prisma.withdrawal.deleteMany();
    // Ordem de exclusão
    await prisma.reviewPhoto.deleteMany();
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.proposal.deleteMany();
    await prisma.orderChangeRequest.deleteMany();
    await prisma.order.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.portfolioImage.deleteMany();
    await prisma.providerProfession.deleteMany();
    await prisma.profession.deleteMany();
    await prisma.superCategory.deleteMany();
    await prisma.user.deleteMany({ where: { type: { not: 'admin' } } });

    console.log(`🌱 Iniciando o processo de seeding...`);

    // --- 1. CRIAÇÃO DE CATEGORIAS E PROFISSÕES (COM A UNIFICAÇÃO) ---
    const categoriesData = [
        {
            name: 'Beleza e Bem-estar', // <-- CATEGORIA UNIFICADA
            professions: [
                'Aplicador(a) de Cílios', 'Barbeiro', 'Body Piercer', 'Bronzeador(a)', 'Cabeleireiro(a)', 'Consultor(a) de Imagem', 'Consultor(a) de Moda', 'Costureiro(a)', 'Depilador(a)', 'Designer de Sobrancelhas', 'Designer de Unhas', 'Esteticista', 'Estilista', 'Instrutor(a) de Yoga', 'Manicure e Pedicure', 'Maquiador(a)', 'Massagista', 'Nutricionista', 'Personal Stylist', 'Personal Trainer', 'Tatuador(a)'
            ]
        },
        {
            name: 'Casa e Reparos',
            professions: ['Eletricista', 'Encanador', 'Marceneiro', 'Pintor', 'Montador de Móveis', 'Chaveiro', 'Jardineiro', 'Pedreiro', 'Gesseiro', 'Telhadista', 'Vidraceiro', 'Reparador de Eletrodomésticos', 'Instalador de Ar Condicionado', 'Impermeabilizador', 'Dedetizador', 'Serralheiro', 'Calheiro', 'Paisagista', 'Zelador']
        },
        {
            name: 'Serviços Domésticos',
            professions: ['Diarista', 'Cozinheiro(a)', 'Cuidador(a) de Idosos', 'Babá', 'Dog Walker', 'Passadeira', 'Faxineiro(a)', 'Caseiro(a)', 'Lavadeira', 'Organizador(a) Profissional', 'Panfleteiro(a)', 'Motorista Particular', 'Governante', 'Pet Sitter', 'Treinador(a) de Animais']
        },
        {
            name: 'Tecnologia',
            professions: ['Técnico de Informática', 'Técnico de Celular', 'Instalador de Antenas', 'Editor de Vídeo', 'Designer Gráfico', 'Desenvolvedor Web', 'Instalador de Câmeras de Segurança', 'Consultor de TI', 'Programador', 'Fotógrafo de Produtos', 'Social Media', 'Gestor de Tráfego Pago', 'Técnico em Redes', 'Suporte Técnico Remoto', 'Designer de UI/UX']
        },
        {
            name: 'Eventos',
            professions: ['Fotógrafo(a)', 'DJ', 'Segurança', 'Garçom/Garçonete', 'Decorador(a)', 'Cerimonialista', 'Barman/Bartender', 'Animador(a) de Festa', 'Locutor(a)', 'Sonoplasta', 'Montador de Estruturas', 'Cozinheiro(a) para Eventos', 'Iluminador', 'Recepcionista de Evento', 'Aluguel de Móveis/Eventos']
        },
        {
            name: 'Aulas e Educação',
            professions: ['Professor(a) Particular', 'Aula de Reforço Escolar', 'Professor(a) de Inglês', 'Professor(a) de Música', 'Aula de Violão', 'Aula de Dança', 'Preparador(a) para ENEM/Concursos', 'Recreador(a) Infantil', 'Aula de Culinária', 'Instrutor(a) de Autoescola', 'Coach de Carreira']
        },
        {
            name: 'Transporte e Entregas',
            professions: ['Motoboy', 'Motorista de Aplicativo', 'Freteiro', 'Transportador de Mudanças', 'Entregador(a) de Encomendas', 'Carreteiro', 'Transportador Escolar', 'Serviço de Guincho']
        },
        {
            name: 'Serviços Especializados',
            professions: ['Mecânico', 'Contador(a)', 'Advogado(a)', 'Consultor(a) Financeiro', 'Psicólogo(a)', 'Coach Pessoal', 'Arquiteto(a)', 'Engenheiro(a)', 'Designer de Interiores', 'Tradutor(a)', 'Revisor(a) de Textos', 'Redator(a) Freelancer']
        },
    ];

    const createdProfessions = [];
    for (const cat of categoriesData) {
        const superCategory = await prisma.superCategory.create({ data: { name: cat.name } });
        for (const prof of cat.professions) {
            createdProfessions.push(await prisma.profession.create({ data: { name: prof, superCategoryId: superCategory.id } }));
        }
    }
    console.log(`- ${createdProfessions.length} profissões criadas em ${categoriesData.length} categorias.`);

    // --- O restante do script permanece o mesmo ---

    const NUM_CLIENTS = 100;
    const NUM_PROVIDERS = 100;
    const NUM_ORDERS = 1000;

    const passwordHash = await bcrypt.hash('senha123', 8);
    const createdClients = [];
    for (let i = 0; i < NUM_CLIENTS; i++) {
        createdClients.push(await prisma.user.create({ data: { name: faker.person.fullName(), email: faker.internet.email().toLowerCase(), password_hash: passwordHash, type: 'client', avatar_url: faker.image.avatar() } }));
    }
    console.log(`- ${createdClients.length} clientes criados.`);

    const createdProviders = [];
    for (let i = 0; i < NUM_PROVIDERS; i++) {
        // Para prestadores, é obrigatório ter CPF ou CNPJ
        const providerData = {
            name: faker.person.fullName(),
            email: `provider${i}@jobah.com`,
            password_hash: passwordHash,
            type: 'provider',
            bio: faker.lorem.sentence(),
            city: 'Salvador',
            state: 'BA',
            verificationStatus: 'VERIFIED',
            avatar_url: faker.image.avatar(),
        };

        if (Math.random() > 0.5) { // 50% serão pessoas físicas
            providerData.cpf = generateCpf();
        } else { // 50% serão pessoas jurídicas
            providerData.cnpj = generateCNPJ();
        }

        createdProviders.push(await prisma.user.create({ data: providerData }));
    }
    console.log(`- ${createdProviders.length} prestadores criados.`);

    for (const provider of createdProviders) {
        const numServices = faker.number.int({ min: 1, max: 4 });
        const shuffledProfessions = faker.helpers.shuffle(createdProfessions);
        for (let i = 0; i < numServices; i++) {
            if (shuffledProfessions[i]) {
                const existing = await prisma.providerProfession.findFirst({ where: { providerId: provider.id, professionId: shuffledProfessions[i].id } });
                if (!existing) {
                    await prisma.providerProfession.create({ data: { providerId: provider.id, professionId: shuffledProfessions[i].id, description: faker.lorem.paragraph(), base_price: faker.number.int({ min: 5, max: 30 }) * 10 } });
                }
            }
        }
    }
    console.log(`- Prestadores associados a profissões.`);


    console.log('- Adicionando imagens de portfólio aos prestadores...');
    const professionToImageKeyword = {
        'Eletricista': 'electrician,wiring', 'Pintor': 'painting,wall,art', 'Marceneiro': 'carpentry,woodwork',
        'Jardineiro': 'garden,gardening', 'Fotógrafo(a)': 'camera,photography,event', 'Cozinheiro(a)': 'cooking,food,kitchen',
        'Manicure e Pedicure': 'manicure,nails', 'Cabeleireiro(a)': 'haircut,hairstyle', 'Maquiador(a)': 'makeup,beauty',
        'Costureiro(a)': 'sewing,fashion', 'Desenvolvedor Web': 'code,web,developer', 'Designer Gráfico': 'design,art',
    };

    for (const provider of createdProviders) {
        const providerServices = await prisma.providerProfession.findMany({
            where: { providerId: provider.id },
            include: { profession: true }
        });

        if (providerServices.length > 0) {
            const professionName = providerServices[0].profession.name;
            const keywords = professionToImageKeyword[professionName] || 'work,service'; // Palavra-chave padrão

            const numImages = faker.number.int({ min: 3, max: 7 });
            for (let i = 0; i < numImages; i++) {
                await prisma.portfolioImage.create({
                    data: {
                        providerId: provider.id,
                        imageUrl: faker.image.urlLoremFlickr({ category: keywords, width: 640, height: 480 }),
                        caption: faker.lorem.sentence(),
                    }
                });
            }
        }
    }
    console.log('- Imagens de portfólio criadas.');


    console.log(`- Organizando serviços para simulação...`);
    const allProviderServices = await prisma.providerProfession.findMany();
    const servicesByProvider = allProviderServices.reduce((acc, service) => {
        if (!acc[service.providerId]) {
            acc[service.providerId] = [];
        }
        acc[service.providerId].push(service);
        return acc;
    }, {});

    for (let i = 0; i < NUM_ORDERS; i++) {
        const client = getRandomItem(createdClients);
        const provider = getRandomItem(createdProviders);

        const providerServices = servicesByProvider[provider.id];
        if (!providerServices || providerServices.length === 0) continue;

        const serviceToOrder = getRandomItem(providerServices);

        const order = await prisma.order.create({
            data: {
                clientId: client.id,
                providerId: provider.id,
                status: 'COMPLETED',
                price: serviceToOrder.base_price,
                orderItems: { create: { providerProfessionId: serviceToOrder.id, quantity: 1, unitPrice: serviceToOrder.base_price } }
            }
        });

        await prisma.review.create({
            data: {
                orderId: order.id,
                reviewerId: client.id,
                providerId: provider.id,
                rating: faker.number.int({ min: 3, max: 5 }),
                comment: faker.lorem.sentence(),
            }
        });
    }

    for (const provider of createdProviders) {
        await updateProviderRating(prisma, provider.id);
    }
    console.log(`- ${NUM_ORDERS} pedidos e avaliações criados. Métricas dos prestadores atualizadas.`);

    console.log(`✅ Seeding concluído com sucesso!`);
}

main()
    .catch((e) => {
        console.error("Erro durante o seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });