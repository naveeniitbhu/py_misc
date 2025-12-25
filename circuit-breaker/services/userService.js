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

const pg_config = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5401,
    user: 'postgres',
    database: 'circuitBreakerConfig',
    password: 'postgres',
    ssl: false,
  },
});

pg.raw('select 1')
  .then(() => { console.log('Connected db successfully') })
  .catch(err => {
    console.log('connection error'); process.exit(1)
  })

pg_config.raw('select 1')
  .then(() => { console.log('Connected db-config successfully') })
  .catch(err => {
    console.log('connection error'); process.exit(1)
  })


app.get('/', (req, res) => {
  res.send('Hello')
})

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
    console.error(err.message);
    res.status(500).json({ message: 'DB error' });
  }
});

app.post('/users', async (req, res) => {
  console.log(49, req.body)
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
    console.error(err.message);

    if (err.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }

    res.status(500).json({ message: 'DB error' });
  }
});


app.listen(3000, () => {
  console.log('listening')
})

