const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer'); // Importar o multer
const mysql = require('mysql2'); // Importar o mysql2

const app = express();
const PORT = process.env.PORT || 3000; // Porta dinâmica para Railway

// Configuração do banco de dados
const db = mysql.createConnection({
    host: process.env.autorack.proxy.rlwy.net,       // Host do banco de dados
    user: process.env.root,       // Usuário do banco de dados
    password: process.env.ChPVoyOTVgbHOTskMLbqmPXjVafPRZQt, // Senha do banco de dados
    database: process.env.railway, // Nome do banco de dados
    port: process.env.16432        // Porta do banco de dados
});

// Conectar ao banco de dados
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados com sucesso!');
    }
});

// Servir arquivos estáticos da pasta 'frontend'
app.use(express.static(path.join(__dirname, '../frontend')));

// Para todas as outras rotas, envie o arquivo 'index.html'
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Configurar o multer para salvar os arquivos na pasta 'uploads' com nome único
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Pasta onde os arquivos serão armazenados
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome único baseado na data
    }
});

// Criar o middleware do multer para lidar com múltiplos arquivos
const upload = multer({ storage: storage });

// Usar o CORS e o Express para JSON
app.use(cors());
app.use(express.json());

// Servir a pasta 'uploads' como estática para que as imagens e vídeos sejam acessíveis
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
const veiculosRoutes = require('./routes/veiculosRoutes');
const checklistRoutes = require('./routes/checklistRoutes');

// Atualizar a rota para aceitar o upload de arquivos ao cadastrar checklist
app.post('/api/checklists', upload.array('arquivos'), (req, res) => {
    // Os arquivos enviados estão disponíveis em req.files
    const arquivos = req.files;  // Array de arquivos
    console.log(arquivos);  // Verifique no console os arquivos recebidos

    // Verifique se os arquivos foram enviados corretamente
    if (!arquivos || arquivos.length === 0) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado!' });
    }

    // Suponha que você tenha outros campos como 'id_veiculo', 'observacoes', 'mecanico'
    const { id_veiculo, observacoes, mecanico } = req.body;

    // Exemplo de lógica para salvar os dados no banco de dados
    const query = 'INSERT INTO checklists (id_veiculo, observacoes, mecanico) VALUES (?, ?, ?)';
    db.query(query, [id_veiculo, observacoes, mecanico], (err, results) => {
        if (err) {
            console.error('Erro ao salvar checklist:', err);
            return res.status(500).json({ message: 'Erro ao salvar checklist!' });
        }

        // Responder com sucesso e os detalhes dos arquivos
        res.json({
            message: 'Checklist cadastrado com sucesso!',
            arquivos: arquivos.map(arquivo => ({
                filename: arquivo.filename,
                path: `/uploads/${arquivo.filename}`,
            })),
        });
    });
});

app.use('/api/veiculos', veiculosRoutes);
app.use('/api/checklists', checklistRoutes);

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
