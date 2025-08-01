import express from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('API rodando com Node.js + TypeScript 🚀');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
