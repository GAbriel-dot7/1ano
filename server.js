
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const uploadDir = './uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors());
app.use(express.json());

// Configuração de armazenamento de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Evita sobrescrita usando timestamp
    const uniqueName = Date.now() + '_' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Função para ler o data.json
function readData() {
  try {
    return JSON.parse(fs.readFileSync('./data.json', 'utf8'));
  } catch (e) {
    return {};
  }
}

// Função para salvar o data.json
function saveData(data) {
  fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
}

// Rotas

// Middleware para validar Authorization header
function checkAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  const token = auth.split(' ')[1];
  const expected = process.env.UPLOAD_PASS || 'robiju';
  if (token !== expected) {
    return res.status(401).json({ error: 'Senha inválida' });
  }
  next();
}

app.post('/upload', checkAuth, upload.single('media'), (req, res) => {
  const media = req.file;
  const caption = req.body.caption;
  const date = req.body.date; // opcional
  // Salvar informações da mídia no arquivo JSON
  const data = readData();
  data[media.filename] = {
    caption: caption,
    url: `/uploads/${media.filename}`,
    date: date || new Date().toISOString().slice(0,10) // ISO date (yyyy-mm-dd) se não enviado
  };
  saveData(data);
  res.status(200).json({ message: 'Upload realizado com sucesso' });
});

// Servir a lista de mídias para o frontend
app.get('/gallery', checkAuth, (req, res) => {
  const data = readData();
  const mediaList = Object.keys(data).map(key => ({
    name: key,
    caption: data[key].caption,
    url: data[key].url,
    date: data[key].date || null
  }));
  res.status(200).json(mediaList);
});

// Rota para apagar mídia
app.delete('/media/:name', checkAuth, (req, res) => {
  const name = req.params.name;
  const data = readData();
  if (!data[name]) {
    return res.status(404).json({ error: 'Mídia não encontrada' });
  }
  // Apagar arquivo
  const filePath = path.join(uploadDir, name);
  fs.unlink(filePath, err => {
    // Remove do JSON mesmo se o arquivo já não existir
    delete data[name];
    saveData(data);
    if (err && err.code !== 'ENOENT') {
      return res.status(500).json({ error: 'Erro ao apagar arquivo' });
    }
    res.status(200).json({ message: 'Mídia apagada' });
  });
});

// Servir os arquivos de mídia
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Servir arquivos estáticos do frontend (index.html, styles, script)
app.use(express.static(path.join(__dirname)));

// Garantir que a raiz sirva o index.html explicitamente
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar o servidor (porta via env para plataformas como Render)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port}`);
});
