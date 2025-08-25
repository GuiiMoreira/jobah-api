# Roteiro de Testes Completo – API JOBAH

## Configuração Inicial

**URL Base:** `http://localhost:3333`

**Dica:** Crie variáveis de ambiente para armazenar os tokens (`admin_token`, `provider_token`, `client_token`) e os IDs (`profession_id`, `provider_id`, etc.).

**Primeiro Passo:** Limpe o banco de dados e execute o seed do admin:

```bash
npx prisma migrate reset
npx prisma db seed
````

---

## Parte 1: Configuração da Plataforma (Como Administrador)

### 1.1. Login do Administrador

**Método e Rota:** `POST /api/v1/auth/login`

**Corpo da Requisição:**

```json
{
  "email": "admin@jobah.com.br",
  "password": "admin_super_seguro_123"
}
```

**Resposta Esperada:**

* Status: `200 OK`
* Corpo: Objeto com `user` e `token`.
* **Ação:** Salvar `token` em `admin_token`.

---

### 1.2. Criação de Profissões

**Método e Rota:** `POST /api/v1/professions`
**Autorização:** Bearer `admin_token`

**Corpo:**

```json
{
  "name": "Eletricista",
  "icon_url": "http://example.com/icon/eletricista.png"
}
```

**Outras sugestões:** "Marceneiro", "Diarista"

**Resposta Esperada:**

* Status: `201 Created`
* Corpo: Objeto com os dados da profissão criada.
* **Ação:** Salvar `id` da profissão "Eletricista" como `profession_id`.

---

### 1.3. Listagem de Profissões

**Método e Rota:** `GET /api/v1/professions`
**Autorização:** Nenhuma

**Resposta Esperada:**

* Status: `200 OK`
* Corpo: Array de objetos com as profissões criadas.

---

## Parte 2: Jornada do Prestador de Serviço (Provider)

### 2.1. Cadastro do Prestador

**Método e Rota:** `POST /api/v1/auth/signup`

**Corpo:**

```json
{
  "name": "João da Silva (Prestador)",
  "email": "joao.provider@jobah.com",
  "password": "password123",
  "type": "provider",
  "location": "Salvador, BA"
}
```

**Resposta Esperada:**

* Status: `201 Created`

---

### 2.2. Login do Prestador

**Método e Rota:** `POST /api/v1/auth/login`

**Corpo:** Mesmos dados do cadastro

**Resposta Esperada:**

* Status: `200 OK`
* **Ação:** Salvar `token` como `provider_token` e `id` como `provider_id`.

---

### 2.3. Adicionar Profissão ao Perfil

**Método e Rota:** `POST /api/v1/profile/professions`
**Autorização:** Bearer `provider_token`

**Corpo:**

```json
{
  "professionId": "COLE_O_PROFESSION_ID_DE_ELETRICISTA_AQUI",
  "description": "Tenho 15 anos de experiência com instalações elétricas residenciais.",
  "base_price": 100.0
}
```

**Resposta Esperada:**

* Status: `201 Created`
* **Ação:** Salvar `id` como `provider_profession_id`.

---

### 2.4. Atualização de Avatar

**Método e Rota:** `PATCH /api/v1/users/me/avatar`
**Autorização:** Bearer `provider_token`

**Corpo:** Multipart Form com campo `avatar` do tipo arquivo (imagem)

**Resposta Esperada:**

* Status: `200 OK`
* Corpo: Objeto de usuário com `avatar_url` atualizado.

---

## Parte 3: Jornada do Cliente

### 3.1. Cadastro e Login do Cliente

**Cadastro:**

* `POST /api/v1/auth/signup`
* `type: "client"`, e-mail: `ana.client@jobah.com`

**Login:**

* `POST /api/v1/auth/login`
* **Ação:** Salvar `token` como `client_token`

---

### 3.2. Busca por Prestadores

**Método e Rota:** `GET /api/v1/providers/search`

**Testes:**

* `/api/v1/providers/search?profession=eletricista`
* `/api/v1/providers/search?profession=eletricista&location=salvador`

**Resposta Esperada:**

* Status: `200 OK`
* O array `data` deve conter o perfil de "João da Silva"

---

### 3.3. Visualizar Perfil Público do Prestador

**Método e Rota:** `GET /api/v1/users/COLE_O_PROVIDER_ID_AQUI/profile`

**Resposta Esperada:**

* Status: `200 OK`
* Corpo: JSON com dados de João, `professions`, `averageRating: 0`

---

## Parte 4: Interação, Contratação e Avaliação

### 4.1. Iniciar Conversa

**Método e Rota:** `POST /api/v1/conversations`
**Autorização:** Bearer `client_token`

**Corpo:**

```json
{
  "recipientId": "COLE_O_PROVIDER_ID_AQUI"
}
```

**Resposta Esperada:**

* Status: `200 OK`
* **Ação:** Salvar `conversation_id`

---

### 4.2. Criar um Pedido

**Método e Rota:** `POST /api/v1/orders`
**Autorização:** Bearer `client_token`

**Corpo:**

```json
{
  "providerProfessionId": "COLE_O_PROVIDER_PROFESSION_ID_AQUI",
  "note": "Preciso de uma visita para fazer um orçamento de troca de fiação."
}
```

**Resposta Esperada:**

* Status: `201 Created`
* **Ação:** Salvar `order_id`

---

### 4.3. Gerenciar Status do Pedido (Prestador)

**Método e Rota:** `PATCH /api/v1/orders/COLE_O_ORDER_ID_AQUI/status`
**Autorização:** Bearer `provider_token`

**Aceitar Pedido:**

```json
{ "status": "ACCEPTED" }
```

**Concluir Pedido:**

```json
{ "status": "COMPLETED" }
```

**Resposta Esperada:**

* Status: `200 OK` para ambos

---

### 4.4. Deixar uma Avaliação

**Método e Rota:** `POST /api/v1/reviews`
**Autorização:** Bearer `client_token`

**Corpo:**

```json
{
  "orderId": "COLE_O_ORDER_ID_AQUI",
  "rating": 5,
  "comment": "Serviço excelente! O João foi muito profissional e resolveu meu problema rapidamente."
}
```

**Resposta Esperada:**

* Status: `201 Created`

---

### 4.5. Verificar Atualização do Perfil Público

**Método e Rota:** `GET /api/v1/users/COLE_O_PROVIDER_ID_AQUI/profile`

**Resposta Esperada:**

* Status: `200 OK`
* Perfil com `averageRating: 5`, `totalReviews: 1`, `reviews` com a avaliação da Ana

---

## Parte 5: Verificação das Notificações

### 5.1. Notificações do Prestador

**Método e Rota:** `GET /api/v1/notifications`
**Autorização:** Bearer `provider_token`

**Resposta Esperada:**

* Status: `200 OK`
* Notificações sobre novo pedido e avaliação recebida

---

### 5.2. Notificações da Cliente

**Método e Rota:** `GET /api/v1/notifications`
**Autorização:** Bearer `client_token`

**Resposta Esperada:**

* Status: `200 OK`
* Notificações sobre pedido aceito e concluído

---
### 6. Verificação prestador

* Faça login como provider para obter um token válido (provider_token).
* Envie a Requisição de Verificação:

**Método e Rota:** `PATCH /api/v1/profile/verification`
**Autorização:** Bearer `provider_token`
**Corpo:**

```json
{
  "phoneNumber": "71999887766",
  "fullAddress": "Rua da Bahia, 100, Rio Vermelho, Salvador-BA, 41940-000",
  "cpf": "123.456.789-00"
}
```
**Resposta Esperada:**

* Status: `200 OK`
* Corpo: { "message": "Dados enviados para análise com sucesso!" }

**Teste de Validação (Falha):**
* Tente enviar um CPF inválido, como "111.111.111-11".
**Resposta Esperada:**:  `Status 400 Bad Request com uma mensagem de erro indicando "CPF inválido".`
Verifique no Banco de Dados: Use uma ferramenta como o DBeaver, Beekeeper ou o psql para inspecionar a tabela users. Você verá os novos dados preenchidos e o campo verificationStatus alterado para PENDING para aquele usuário.


### 7. Verificação dashboard prestador

Para testar de forma eficaz, seu banco de dados precisa de uma variedade de dados:

* Vários prestadores.
* Alguns com verificationStatus: 'VERIFIED'.
* Vários pedidos concluídos para diferentes prestadores, alguns nos últimos 30 dias e outros mais antigos.
* Várias avaliações para que as médias e contagens sejam calculadas.

Após popular seu banco com esses dados, basta fazer a requisição:

**Método e Rota:** `GET /api/v1/dashboard`
**Autorização:** Nenhuma (é um endpoint público).

**Resposta Esperada:**

* Status: `200 OK`
* Corpo: Um objeto JSON com duas chaves:

```json
{
  "recommendedProviders": [
    { "id": "...", "name": "Maria (Nota 4.9)", "avatar_url": "...", "averageRating": 4.9, "totalReviews": 25 },
    // ... outros recomendados
  ],
  "trendingProviders": [
    { "id": "...", "name": "João (5 Pedidos Recentes)", "avatar_url": "...", "averageRating": 4.6 },
    // ... outros em alta
  ]
}
```

## ✅ Fim do Roteiro

Este roteiro cobre todas as funcionalidades essenciais da API. Ao seguir esses passos, você garante que cada parte do sistema está funcionando corretamente.