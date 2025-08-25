const { Router } = require('express');
const validationController = require('../controllers/validationController');

const validationRoutes = Router();

validationRoutes.post('/check-email', validationController.checkEmail);
validationRoutes.post('/check-cpf', validationController.checkCpf);
validationRoutes.post('/check-cnpj', validationController.checkCnpj);

module.exports = validationRoutes;