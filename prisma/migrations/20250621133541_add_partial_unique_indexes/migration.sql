CREATE UNIQUE INDEX "unique_cpf_not_null" ON "users" (cpf) WHERE cpf IS NOT NULL;

CREATE UNIQUE INDEX "unique_cnpj_not_null" ON "users" (cnpj) WHERE cnpj IS NOT NULL;