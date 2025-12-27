const express = require('express');
const { getCircuitState, subscriber, initRedis } = require('./redisClient');
const { pg, checkDbConnection, checkRedisDbSync } = require('./database');

const app = express();
const localCircuit = {};

app.use(express.json());

async function start() {
  await initRedis();

  checkDbConnection()

  subscriber.subscribe('circuit-events', (msg) => {
    const event = JSON.parse(msg);
    localCircuit[event.service] = { is_up: event.state === 'CLOSED' }
    console.log(
      `⚡ Circuit update: ${event.service} → ${event.state}`
    );
  })

  checkRedisDbSync('order-service', 9000)

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

    const state =
      localCircuit['user-service'] ||
      await getCircuitState('user-service');


    if (state?.is_up === false) {
      return res.status(503).json({
        message: 'Circuit OPEN for user-service'
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
}

start()