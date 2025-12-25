const express = require('express');
const { isServiceUp } = require('./checkServiceStatus')
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

app.get('/orders/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const order = await pg('orders').where({ id }).first();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch {
    res.status(500).json({ message: 'DB error' });
  }
});

app.post('/orders', async (req, res) => {
  const { user_id, amount } = req.body;

  const userServiceUp = await isServiceUp('user-service');

  if (!userServiceUp) {
    console.log('INFO: User service is down')
    return res.status(503).json({
      message: 'User service is DOWN (circuit open)',
    });
  }

  const userRes = await fetch(`http://localhost:3000/users/${user_id}`);

  if (!userRes.ok) {
    return res.status(502).json({ message: 'User lookup failed' });
  }

  if (!user_id || !amount) {
    return res.status(400).json({ message: 'user_id and amount required' });
  }

  try {
    const [order] = await pg('orders')
      .insert({ user_id, amount })
      .returning('*');

    res.status(201).json(order);
  } catch {
    res.status(500).json({ message: 'DB error' });
  }
});

app.listen(3001, () => console.log('Order service on 3001'));
