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


async function isServiceUp(serviceName) {
  const row = await pg_config('service_status')
    .where({ service_name: serviceName })
    .first();

  return row?.is_up === true;
}

module.exports = { isServiceUp };