import express from 'express';
import cors from 'cors';
import slidesRouter from './routes/slides.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/api/slides', slidesRouter);

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
