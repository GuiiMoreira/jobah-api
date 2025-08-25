const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API JOBAH',
            version: '1.0.0',
            description: 'Documentação completa da API do aplicativo JOBAH.',
        },
        servers: [
            {
                url: 'http://localhost:3333/api/v1', // Adicionamos o prefixo da API aqui
                description: 'Servidor de Desenvolvimento'
            },
        ],
        // AQUI VAI A MÁGICA: Definimos todos os nossos "objetos" reutilizáveis
        components: {
            schemas: {
                // Schema para o corpo do cadastro de usuário
                UserSignup: {
                    type: 'object',
                    required: ['name', 'email', 'password', 'type'],
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', format: 'password' },
                        type: { type: 'string', enum: ['client', 'provider'] }
                    },
                    example: {
                        name: "Ana Silva",
                        email: "ana.client@jobah.com",
                        password: "senha123",
                        type: "client"
                    }
                },
                // Schema para o corpo do login
                UserLogin: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', format: 'password' }
                    },
                    example: {
                        email: "ana.client@jobah.com",
                        password: "senha123"
                    }
                },
                // Schema para a resposta de sucesso do login
                LoginResponse: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                name: { type: 'string' },
                                email: { type: 'string', format: 'email' }
                            }
                        },
                        token: { type: 'string' }
                    }
                },
                // Schema genérico para respostas de erro
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            example: 'Descrição do erro ocorrido.',
                        },
                    },
                },
            },
        },
    },
    // Caminho para os arquivos que contêm as anotações da API
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;