const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer'); // Importar o multer

const app = express();
const PORT = 3000;

const path = require('path');
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Certifique-se de que 'index.html' está no diretório 'public'
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

    // Lógica para salvar os dados do checklist no banco (não mostrada aqui)

    // Responder com sucesso e os detalhes dos arquivos
    res.json({
        message: 'Checklist cadastrado com sucesso!',
        arquivos: arquivos.map(arquivo => ({
            filename: arquivo.filename,
            path: `/uploads/${arquivo.filename}`,
        })),
    });
});

app.use('/api/veiculos', veiculosRoutes);
app.use('/api/checklists', checklistRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
