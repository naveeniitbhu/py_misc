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

app.get('/payments/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const payment = await pg('payments').where({ id }).first();
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch {
    res.status(500).json({ message: 'DB error' });
  }
});

app.post('/payments', async (req, res) => {
  const { order_id, amount } = req.body;

  if (!order_id || !amount) {
    return res.status(400).json({ message: 'order_id and amount required' });
  }

  try {
    const [payment] = await pg('payments')
      .insert({ order_id, amount })
      .returning('*');

    res.status(201).json(payment);
  } catch {
    res.status(500).json({ message: 'DB error' });
  }
});

app.listen(3002, () => console.log('Payment service on 3002'));
