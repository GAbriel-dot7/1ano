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
app.post('/upload', upload.single('media'), (req, res) => {
  const media = req.file;
  const caption = req.body.caption;
  const password = req.body.password;

  // Validação da senha
  if (password !== 'robiju') {
    return res.status(401).json({ error: 'Senha inválida' });
  }

  // Salvar informações da mídia no arquivo JSON
  const data = readData();
  data[media.filename] = {
    caption: caption,
    url: `/uploads/${media.filename}`,
    date: new Date().toISOString()
  };
  saveData(data);

  res.status(200).json({ message: 'Upload realizado com sucesso' });
});

// Servir a lista de mídias para o frontend
app.get('/gallery', (req, res) => {
  const data = readData();
  const mediaList = Object.keys(data).map(key => ({
    name: key,
    caption: data[key].caption,
    url: data[key].url,
    date: data[key].date
  }));
  res.status(200).json(mediaList);
});

// Servir os arquivos de mídia
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Iniciar o servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port}`);
});
