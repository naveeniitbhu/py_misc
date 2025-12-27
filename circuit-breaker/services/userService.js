const express = require('express');
const { pg, checkDbConnection, checkRedisDbSync } = require('./database');
const { initRedis } = require('./redisClient');
const app = express();

app.use(express.json());

async function start() {
  await initRedis();

  checkDbConnection();

  checkRedisDbSync('user-service', 9000)


  app.get('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const user = await pg('users')
        .where({ id })
        .first();

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'DB error' });
    }
  });

  app.post('/users', async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'name and email required' });
    }

    try {
      const [user] = await pg('users')
        .insert({ name, email })
        .returning('*');

      res.status(201).json(user);
    } catch (err) {
      if (err.code === '23505') { // pstgres unique violations
        return res.status(409).json({ message: 'Email already exists' });
      }

      res.status(500).json({ message: 'DB error' });
    }
  });


  app.listen(3000, () => {
    console.log('listening')
  })

}


start();