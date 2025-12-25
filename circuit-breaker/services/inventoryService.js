const express = require('express');
const app = express();

app.use(express.json());

const pg = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5400,
    user: 'postgres',
    database: 'circuitBreaker',
    password: 'postgres',
    ssl: false,
  },
});

pg.raw('select 1')
  .then(() => console.log('DB connected'))
  .catch(() => process.exit(1));

app.get('/inventory/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const item = await pg('inventory').where({ id }).first();
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch {
    res.status(500).json({ message: 'DB error' });
  }
});

app.post('/inventory', async (req, res) => {
  const { product_name, quantity } = req.body;

  if (!product_name || quantity == null) {
    return res.status(400).json({ message: 'product_name and quantity required' });
  }

  try {
    const [item] = await pg('inventory')
      .insert({ product_name, quantity })
      .returning('*');

    res.status(201).json(item);
  } catch {
    res.status(500).json({ message: 'DB error' });
  }
});

app.listen(3003, () => console.log('Inventory service on 3003'));
