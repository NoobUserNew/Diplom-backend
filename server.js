import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const PORT = 5000;

// Подключаем миддлвары
app.use(cors());
app.use(express.json());

let db;

// Открываем базу данных
(async () => {
  db = await open({
    filename: './slides.db',
    driver: sqlite3.Database
  });

  // Создаём таблицу слайдов, если её нет
  await db.run(`
    CREATE TABLE IF NOT EXISTS slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT
    )
  `);
})();

// Получить все слайды
app.get('/api/slides', async (req, res) => {
  try {
    const slides = await db.all('SELECT * FROM slides');
    res.json(slides);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения слайдов' });
  }
});

// Добавить новый слайд
app.post('/api/slides', async (req, res) => {
  try {
    const { title, imageUrl, type, description } = req.body;
    if (!title || !imageUrl || !type) {
      return res.status(400).json({ error: 'Все поля обязательны!' });
    }

    await db.run(
      'INSERT INTO slides (title, imageUrl, type, description) VALUES (?, ?, ?, ?)',
      [title, imageUrl, type, description || '']
    );
    res.json({ message: 'Слайд добавлен' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка добавления слайда' });
  }
});

// Удалить слайд по id
app.delete('/api/slides/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM slides WHERE id = ?', [id]);
    res.json({ message: 'Слайд удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка удаления слайда' });
  }
});

// Обновить слайд по id
app.put('/api/slides/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, imageUrl, type, description } = req.body;

    if (!title || !imageUrl || !type) {
      return res.status(400).json({ error: 'Все поля обязательны!' });
    }

    await db.run(
      `UPDATE slides
       SET title = ?, imageUrl = ?, type = ?, description = ?
       WHERE id = ?`,
      [title, imageUrl, type, description || '', id]
    );

    res.json({ message: 'Слайд обновлен' });
  } catch (err) {
    console.error('Ошибка обновления слайда:', err);
    res.status(500).json({ error: 'Не удалось обновить слайд' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
