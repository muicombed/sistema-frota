const db = require('../config/database');

// Função para cadastrar um novo checklist
const cadastrarChecklist = (req, res) => {
    const { id_veiculo, observacoes } = req.body;
    const imagens = req.files;

    db.query(
        'INSERT INTO checklists (id_veiculo, data, observacoes) VALUES (?, NOW(), ?)',
        [id_veiculo, observacoes],
        (err, results) => {
            if (err) return res.status(500).send(err);

            const checklistId = results.insertId;
            const imagemQueries = imagens.map((img) => [checklistId, `/uploads/${img.filename}`]);

            db.query(
                'INSERT INTO imagens_checklist (id_checklist, caminho_imagem) VALUES ?',
                [imagemQueries],
                (imgErr) => {
                    if (imgErr) return res.status(500).send(imgErr);
                    res.status(201).json({ message: 'Checklist criado com sucesso!' });
                }
            );
        }
    );
};

// Função para listar todos os checklists
const listarChecklists = (req, res) => {
    db.query(
        'SELECT c.id_checklist, v.tipo, v.identificacao, c.data, c.observacoes FROM checklists c JOIN veiculos v ON c.id_veiculo = v.id',
        (err, results) => {
            if (err) return res.status(500).send(err);
            res.status(200).json(results);
        }
    );
};

module.exports = {
    cadastrarChecklist,
    listarChecklists,
};
