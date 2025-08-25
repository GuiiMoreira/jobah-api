const { Router } = require('express');
const providerSearchController = require('../controllers/providerSearchController');

const providerSearchRoutes = Router();

providerSearchRoutes.get('/', providerSearchController.searchProviders);

module.exports = providerSearchRoutes;