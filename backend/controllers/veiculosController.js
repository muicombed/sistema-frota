const db = require('../config/database');

// Função para cadastrar um novo veículo
const cadastrarVeiculo = (req, res) => {
    const { tipo, identificacao, placa } = req.body;

    if (!tipo || !identificacao || !placa) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    db.query(
        'INSERT INTO veiculos (tipo, identificacao, placa) VALUES (?, ?, ?)',
        [tipo, identificacao, placa],
        (err, results) => {
            if (err) return res.status(500).send(err);
            res.status(201).json({ message: 'Veículo cadastrado com sucesso!', id: results.insertId });
        }
    );
};

// Função para listar todos os veículos
const listarVeiculos = (req, res) => {
    db.query('SELECT * FROM veiculos', (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).json(results);
    });
};

module.exports = {
    cadastrarVeiculo,
    listarVeiculos,
};
