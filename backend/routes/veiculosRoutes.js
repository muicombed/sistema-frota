const express = require('express');
const router = express.Router();
const veiculosController = require('../controllers/veiculosController');

// Rota para cadastrar um novo veículo
router.post('/', veiculosController.cadastrarVeiculo);

// Rota para listar todos os veículos
router.get('/', veiculosController.listarVeiculos);

module.exports = router;
