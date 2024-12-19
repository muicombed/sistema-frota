const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const checklistController = require('../controllers/checklistsController');

const router = express.Router();

// Verifica se a pasta 'uploads' existe, se não, cria ela
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do multer para upload de imagens e vídeos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Definir o caminho correto para a pasta uploads
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Gerar nome único para o arquivo
    },
});
const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Limite de tamanho do arquivo (50 MB)
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpg|jpeg|png|gif|mp4|mov|avi|mkv/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido. Apenas imagens e vídeos são aceitos.'));
        }
    }
});

// Rota para criar um checklist
router.post('/', upload.array('arquivos'), (req, res) => {
    const { id_veiculo, observacoes, mecanico } = req.body;
    const arquivos = req.files;

    if (!id_veiculo || !observacoes || !mecanico) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    db.query(
        'INSERT INTO checklists (id_veiculo, data, observacoes, mecanico) VALUES (?, NOW(), ?, ?)',
        [id_veiculo, observacoes, mecanico],
        (err, results) => {
            if (err) return res.status(500).send(err);

            const checklistId = results.insertId;
            const arquivoQueries = arquivos.map((file) => [checklistId, `/uploads/${file.filename}`]);

            db.query(
                'INSERT INTO arquivos_checklist (id_checklist, caminho_arquivo) VALUES ?',
                [arquivoQueries],
                (fileErr) => {
                    if (fileErr) return res.status(500).send(fileErr);
                    res.status(201).json({ message: 'Checklist criado com sucesso!' });
                }
            );
        }
    );
});

// Rota para listar checklists por veículo
router.get('/by-veiculo/:id_veiculo', (req, res) => {
    const { id_veiculo } = req.params;

    db.query(
        'SELECT id_checklist, data, mecanico FROM checklists WHERE id_veiculo = ? ORDER BY data DESC',
        [id_veiculo],
        (err, results) => {
            if (err) {
                return res.status(500).send('Erro ao buscar checklists');
            }
            res.status(200).json(results);
        }
    );
});

// Rota para detalhes de um checklist específico
router.get('/detalhes/:id_checklist', (req, res) => {
    const { id_checklist } = req.params;

    db.query(
        `SELECT c.id_checklist, v.tipo, v.identificacao, c.data, c.observacoes, 
                c.mecanico, a.caminho_arquivo FROM checklists c 
         JOIN veiculos v ON c.id_veiculo = v.id 
         LEFT JOIN arquivos_checklist a ON c.id_checklist = a.id_checklist
         WHERE c.id_checklist = ?`,
        [id_checklist],
        (err, results) => {
            if (err) {
                console.error('Erro no banco:', err);
                return res.status(500).send(err);
            }

            console.log('Resultados:', results);  // Verifique os resultados no log

            const arquivos = results.map(result => result.caminho_arquivo);
            const checklist = results.length > 0 ? results[0] : null;

            if (checklist) {
                checklist.arquivos = arquivos;
                res.status(200).json(checklist);
            } else {
                res.status(404).json({ message: 'Checklist não encontrado' });
            }
        }
    );
});

// Rota para excluir checklist e arquivos
router.delete('/:id_checklist', (req, res) => {
    const { id_checklist } = req.params;
    console.log(`Deletando checklist com ID: ${id_checklist}`); // Verificando o ID do checklist

    // Função para excluir um arquivo
    const excluirArquivo = (arquivoPath) => {
        return new Promise((resolve, reject) => {
            console.log(`Tentando excluir o arquivo: ${arquivoPath}`); // Log para verificar o caminho
            if (fs.existsSync(arquivoPath)) {
                fs.unlink(arquivoPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`Erro ao excluir arquivo: ${unlinkErr}`);
                        reject('Erro ao deletar arquivo');
                    } else {
                        console.log(`Arquivo excluído com sucesso: ${arquivoPath}`);
                        resolve();
                    }
                });
            } else {
                console.log(`Arquivo não encontrado: ${arquivoPath}`);
                resolve(); // Arquivo não encontrado, resolve como sucesso
            }
        });
    };

    // Buscar arquivos associados ao checklist
    db.query(
        'SELECT caminho_arquivo FROM arquivos_checklist WHERE id_checklist = ?',
        [id_checklist],
        async (err, results) => {
            if (err) {
                console.error('Erro ao buscar arquivos:', err);  // Log de erro
                return res.status(500).send({ error: 'Erro ao buscar arquivos' });
            }

            if (results.length === 0) {
                console.log('Nenhum arquivo encontrado para este checklist');
            }

            try {
                // Excluir todos os arquivos de forma assíncrona
                for (const file of results) {
                    const arquivoPath = path.join(__dirname, '../', file.caminho_arquivo);
                    await excluirArquivo(arquivoPath); // Espera cada arquivo ser excluído
                }

                // Excluir registros na tabela imagens_checklist
                db.query(
                    'DELETE FROM imagens_checklist WHERE id_checklist = ?',
                    [id_checklist],
                    (delImageErr) => {
                        if (delImageErr) {
                            console.error('Erro ao deletar imagens do banco:', delImageErr);  // Log de erro
                            return res.status(500).send({ error: 'Erro ao deletar imagens do banco' });
                        }
                        console.log('Imagens deletadas do banco:', delImageErr);  // Log de sucesso

                        // Excluir registros da tabela arquivos_checklist
                        db.query(
                            'DELETE FROM arquivos_checklist WHERE id_checklist = ?',
                            [id_checklist],
                            (delFileErr) => {
                                if (delFileErr) {
                                    console.error('Erro ao deletar arquivos do banco:', delFileErr);  // Log de erro
                                    return res.status(500).send({ error: 'Erro ao deletar arquivos do banco' });
                                }
                                console.log('Arquivos deletados do banco:', delFileErr);  // Log de sucesso

                                // Excluir o checklist do banco
                                db.query(
                                    'DELETE FROM checklists WHERE id_checklist = ?',
                                    [id_checklist],
                                    (delErr, delResults) => {
                                        if (delErr) {
                                            console.error('Erro ao deletar checklist do banco:', delErr);  // Log de erro
                                            return res.status(500).send({ error: 'Erro ao deletar checklist do banco' });
                                        }
                                        console.log('Checklist deletado com sucesso:', delResults);  // Log de sucesso
                                        res.status(200).json({ message: 'Checklist e arquivos excluídos com sucesso!' });
                                    }
                                );
                            }
                        );
                    }
                );
            } catch (deleteError) {
                console.error('Erro ao excluir arquivos:', deleteError);  // Log de erro
                res.status(500).send({ error: deleteError });
            }
        }
    );
});

module.exports = router;
