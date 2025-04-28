import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const router = express.Router();

const getDb = async () => {
    return open({
        filename: './database.db',
        driver: sqlite3.Database,
    });
};

const initializeDb = async () => {
    const db = await getDb();
    await db.exec(`
    CREATE TABLE IF NOT EXISTS slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT
    )
  `);
};
initializeDb();

// Получение всех слайдов
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const slides = await db.all('SELECT * FROM slides');
        res.json(slides);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавление слайда
router.post('/', async (req, res) => {
    try {
        const db = await getDb();
        const { title, imageUrl, type, description = '' } = req.body;
        await db.run(
            'INSERT INTO slides (title, imageUrl, type, description) VALUES (?, ?, ?, ?)',
            [title, imageUrl, type, description]
        );
        res.status(201).json({ message: 'Слайд добавлен' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление слайда
router.delete('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const { id } = req.params;
        await db.run('DELETE FROM slides WHERE id = ?', id);
        res.json({ message: 'Слайд удалён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновить слайд
router.put('/api/slides/:id', async (req, res) => {
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


export default router;
