const express = require('express')
const bodyParser = require('body-parser')
const Database = require('better-sqlite3')
const cors = require('cors')
const app = express()
const port = 3000

// Настройка CORS для разрешения запросов с http://localhost:3001
app.use(
	cors({
		origin: 'https://diplom-production-810a.up.railway.app', // Разрешаем фронтенд на порту 3001
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Разрешенные методы
		allowedHeaders: ['Content-Type', 'Authorization'], // Разрешенные заголовки
		credentials: true, // Если нужны куки или авторизация
	})
)

app.use(bodyParser.json())

// Инициализация базы данных с better-sqlite3
const db = new Database('./database.db', { verbose: console.log })

// Создание таблиц
try {
	db.exec(`
    CREATE TABLE IF NOT EXISTS enterprises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      description TEXT,
      slug TEXT NOT NULL
    )
  `)
	db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    slug TEXT NOT NULL,
    enterprise_id INTEGER,
    manufacturer TEXT, 
    shelf_life TEXT,   
    proteins TEXT,   
    fats TEXT,       
    carbs TEXT,      
    weight TEXT,     
    storage TEXT,   
    energy TEXT,     
    description TEXT,  
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
  )
`)
	db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image_url TEXT NOT NULL,
      short_description TEXT,
      full_text TEXT,
      slug TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
	db.exec(`
    CREATE TABLE IF NOT EXISTS sliders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      ref_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      CHECK (type IN ('enterprise', 'product', 'news'))
    )
  `)
} catch (err) {
	console.error('Error creating tables:', err)
	process.exit(1)
}

function handleError(res, err) {
	console.error('Error details:', err, 'Stack:', err.stack)
	res.status(500).json({ error: err.message })
}

// Функция для выполнения операций в транзакции
function withTransaction(callback) {
	const transaction = db.transaction(() => {
		try {
			const result = callback()
			return result
		} catch (err) {
			throw err
		}
	})
	return transaction
}

// GET /enterprises
app.get('/enterprises', (req, res) => {
	try {
		const stmt = db.prepare('SELECT * FROM enterprises')
		const rows = stmt.all()
		res.json(rows)
	} catch (err) {
		handleError(res, err)
	}
})

// GET /enterprises/:id
app.get('/enterprises/:id', (req, res) => {
	try {
		const stmt = db.prepare('SELECT * FROM enterprises WHERE id = ?')
		const row = stmt.get(req.params.id)
		if (!row) return res.status(404).json({ error: 'Enterprise not found' })
		res.json(row)
	} catch (err) {
		handleError(res, err)
	}
})

// POST /enterprises
app.post('/enterprises', (req, res) => {
	const { name, image_url, description, slug } = req.body
	console.log('POST /enterprises received:', {
		name,
		image_url,
		description,
		slug,
	})
	if (!name || !image_url || !slug) {
		return res.status(400).json({
			error: 'Missing required fields: name, image_url, and slug are required',
		})
	}
	try {
		const transaction = withTransaction(() => {
			const stmt = db.prepare(
				'INSERT INTO enterprises (name, image_url, description, slug) VALUES (?, ?, ?, ?)'
			)
			const info = stmt.run(name, image_url, description || '', slug)
			return { id: info.lastInsertRowid }
		})
		const result = transaction()
		res.status(201).json(result)
	} catch (err) {
		handleError(res, err)
	}
})

// PUT /enterprises/:id
app.put('/enterprises/:id', (req, res) => {
	const { name, image_url, description, slug } = req.body
	try {
		const transaction = withTransaction(() => {
			const stmt = db.prepare(
				'UPDATE enterprises SET name = ?, image_url = ?, description = ?, slug = ? WHERE id = ?'
			)
			const info = stmt.run(name, image_url, description, slug, req.params.id)
			return { updated: info.changes }
		})
		const result = transaction()
		res.json(result)
	} catch (err) {
		handleError(res, err)
	}
})

// DELETE /enterprises/:id
app.delete('/enterprises/:id', (req, res) => {
	try {
		const transaction = withTransaction(() => {
			const stmt = db.prepare('DELETE FROM enterprises WHERE id = ?')
			const info = stmt.run(req.params.id)
			return { deleted: info.changes }
		})
		const result = transaction()
		res.json(result)
	} catch (err) {
		handleError(res, err)
	}
})

// GET /products
app.get('/products', (req, res) => {
	try {
		const stmt = db.prepare('SELECT * FROM products')
		const rows = stmt.all()
		res.json(rows)
	} catch (err) {
		handleError(res, err)
	}
})

// POST /products
app.post('/products', (req, res) => {
	const {
		name,
		image_url,
		slug,
		enterprise_id,
		manufacturer,
		shelf_life,
		proteins,
		fats,
		carbs,
		weight,
		storage,
		energy,
		description,
	} = req.body

	// Обязательные поля: name, image_url, slug
	if (!name || !image_url || !slug) {
		return res
			.status(400)
			.json({ error: 'Missing required fields: name, image_url, slug' })
	}

	try {
		const transaction = withTransaction(() => {
			const stmt = db.prepare(`
        INSERT INTO products
          (name, image_url, slug, enterprise_id, manufacturer, shelf_life,
           proteins, fats, carbs, weight, storage, energy, description)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

			const info = stmt.run(
				name,
				image_url,
				slug,
				enterprise_id || null,
				manufacturer || null,
				shelf_life || null,
				proteins || null,
				fats || null,
				carbs || null,
				weight || null,
				storage || null,
				energy || null,
				description || null
			)

			return { id: info.lastInsertRowid }
		})

		const result = transaction()
		res.status(201).json(result)
	} catch (err) {
		handleError(res, err)
	}
})

// PUT /products/:id
app.put('/products/:id', (req, res) => {
  const {
    name,
    image_url,
    slug,
    enterprise_id,
    manufacturer,
    shelf_life,
    proteins,
    fats,
    carbs,
    weight,
    storage,
    energy,
    description
  } = req.body;

  try {
    const transaction = withTransaction(() => {
      const stmt = db.prepare(`
        UPDATE products SET
          name         = ?,
          image_url    = ?,
          slug         = ?,
          enterprise_id = ?,
          manufacturer  = ?,
          shelf_life    = ?,
          proteins      = ?,   
          fats          = ?,  
          carbs         = ?,  
          weight        = ?,
          storage       = ?,
          energy        = ?,
          description   = ?
        WHERE id = ?
      `);

      const info = stmt.run(
        name,
        image_url,
        slug,
        enterprise_id || null,
        manufacturer || null,
        shelf_life || null,
        proteins || null,  // TEXT
        fats || null,      // TEXT
        carbs || null,     // TEXT
        weight || null,    // TEXT
        storage || null,
        energy || null,
        description || null,
        req.params.id
      );

      return { updated: info.changes };
    });

    const result = transaction();
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});


// DELETE /products/:id
app.delete('/products/:id', (req, res) => {
	try {
		const transaction = withTransaction(() => {
			const stmt = db.prepare('DELETE FROM products WHERE id = ?')
			const info = stmt.run(req.params.id)
			return { deleted: info.changes }
		})
		const result = transaction()
		res.json(result)
	} catch (err) {
		handleError(res, err)
	}
})

// GET /news
app.get('/news', (req, res) => {
	try {
		const stmt = db.prepare('SELECT * FROM news')
		const rows = stmt.all()
		res.json(rows)
	} catch (err) {
		handleError(res, err)
	}
})

// POST /news
app.post('/news', (req, res) => {
	const { title, image_url, short_description, full_text, slug } = req.body
	try {
		const transaction = withTransaction(() => {
			const stmt = db.prepare(
				'INSERT INTO news (title, image_url, short_description, full_text, slug) VALUES (?, ?, ?, ?, ?)'
			)
			const info = stmt.run(
				title,
				image_url,
				short_description,
				full_text,
				slug
			)
			return { id: info.lastInsertRowid }
		})
		const result = transaction()
		res.status(201).json(result)
	} catch (err) {
		handleError(res, err)
	}
})

// PUT /news/:id
app.put('/news/:id', (req, res) => {
	const { title, image_url, short_description, full_text, slug } = req.body
	try {
		const transaction = withTransaction(() => {
			const stmt = db.prepare(
				'UPDATE news SET title = ?, image_url = ?, short_description = ?, full_text = ?, slug = ? WHERE id = ?'
			)
			const info = stmt.run(
				title,
				image_url,
				short_description,
				full_text,
				slug,
				req.params.id
			)
			return { updated: info.changes }
		})
		const result = transaction()
		res.json(result)
	} catch (err) {
		handleError(res, err)
	}
})

// DELETE /news/:id
app.delete('/news/:id', (req, res) => {
	try {
		const transaction = withTransaction(() => {
			const stmt = db.prepare('DELETE FROM news WHERE id = ?')
			const info = stmt.run(req.params.id)
			return { deleted: info.changes }
		})
		const result = transaction()
		res.json(result)
	} catch (err) {
		handleError(res, err)
	}
})

// GET /sliders
app.get('/sliders', (req, res) => {
	try {
		const stmt = db.prepare('SELECT * FROM sliders')
		const sliders = stmt.all()

		const enrichedSliders = sliders.map(slider => {
			let query, row
			if (slider.type === 'enterprise') {
				query = db.prepare(
					'SELECT id, name AS title, image_url AS imageUrl, description FROM enterprises WHERE id = ?'
				)
				row = query.get(slider.ref_id)
			} else if (slider.type === 'product') {
				query = db.prepare(
					'SELECT id, name AS title, image_url AS imageUrl, description FROM products WHERE id = ?'
				)
				row = query.get(slider.ref_id)
			} else if (slider.type === 'news') {
				query = db.prepare(
					'SELECT id, title, image_url AS imageUrl, short_description AS description FROM news WHERE id = ?'
				)
				row = query.get(slider.ref_id)
			} else {
				return null
			}

			if (row) {
				return {
					id: slider.id,
					type: slider.type,
					ref_id: slider.ref_id,
					position: slider.position,
					title: row.title,
					imageUrl: row.imageUrl,
					description: row.description,
				}
			}
			return null
		})

		const validResults = enrichedSliders.filter(result => result !== null)
		res.json(validResults)
	} catch (err) {
		handleError(res, err)
	}
})

// GET /sliders/:id - Новый эндпоинт для получения конкретного слайда
app.get('/sliders/:id', (req, res) => {
	try {
		const stmt = db.prepare('SELECT * FROM sliders WHERE id = ?')
		const slider = stmt.get(req.params.id)
		if (!slider) {
			return res.status(404).json({ error: 'Slider not found' })
		}

		let query, row
		if (slider.type === 'enterprise') {
			query = db.prepare(
				'SELECT id, name AS title, image_url AS imageUrl, description FROM enterprises WHERE id = ?'
			)
			row = query.get(slider.ref_id)
		} else if (slider.type === 'product') {
			query = db.prepare(
				'SELECT id, name AS title, image_url AS imageUrl, description FROM products WHERE id = ?'
			)
			row = query.get(slider.ref_id)
		} else if (slider.type === 'news') {
			query = db.prepare(
				'SELECT id, title, image_url AS imageUrl, short_description AS description, full_text FROM news WHERE id = ?'
			)
			row = query.get(slider.ref_id)
		} else {
			return res.status(400).json({ error: 'Invalid slider type' })
		}

		if (row) {
			const enrichedSlider = {
				id: slider.id,
				type: slider.type,
				ref_id: slider.ref_id,
				position: slider.position,
				title: row.title,
				imageUrl: row.imageUrl,
				description: row.description,
				full_text: row.full_text || row.description, // Для новостей добавляем full_text
			}
			res.json(enrichedSlider)
		} else {
			res.status(404).json({ error: 'Referenced item not found' })
		}
	} catch (err) {
		handleError(res, err)
	}
})

// POST /sliders
app.post('/sliders', (req, res) => {
	const { type, ref_id, position } = req.body
	try {
		const transaction = withTransaction(() => {
			const stmt = db.prepare(
				'INSERT INTO sliders (type, ref_id, position) VALUES (?, ?, ?)'
			)
			const info = stmt.run(type, ref_id, position)
			return { id: info.lastInsertRowid }
		})
		const result = transaction()
		res.status(201).json(result)
	} catch (err) {
		handleError(res, err)
	}
})

// PUT /sliders/:id
app.put('/sliders/:id', (req, res) => {
	const { type, ref_id, position } = req.body
	try {
		const transaction = withTransaction(() => {
			const stmt = db.prepare(
				'UPDATE sliders SET type = ?, ref_id = ?, position = ? WHERE id = ?'
			)
			const info = stmt.run(type, ref_id, position, req.params.id)
			return { updated: info.changes }
		})
		const result = transaction()
		res.json(result)
	} catch (err) {
		handleError(res, err)
	}
})

// DELETE /sliders/:id
app.delete('/sliders/:id', (req, res) => {
	try {
		const transaction = withTransaction(() => {
			const stmt = db.prepare('DELETE FROM sliders WHERE id = ?')
			const info = stmt.run(req.params.id)
			return { deleted: info.changes }
		})
		const result = transaction()
		res.json(result)
	} catch (err) {
		handleError(res, err)
	}
})

app.post('/login', (req, res) => {
	const { username, password } = req.body
	if (username === 'admin' && password === 'Admin123') {
		// Простая проверка
		res.json({ success: true, token: 'dummy-token-123' })
	} else {
		res.status(401).json({ success: false, message: 'Invalid credentials' })
	}
})

// Защищенные маршруты
app.use((req, res, next) => {
	const token = req.headers.authorization?.split(' ')[1]
	if (!token || token !== 'dummy-token-123') {
		return res.status(403).json({ message: 'Unauthorized' })
	}
	next()
})

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`)
})
