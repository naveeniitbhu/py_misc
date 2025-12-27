const { getCircuitState, setCircuitState } = require('./redisClient');
const { publishCircuitEvent } = require('./redisClient');

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

function checkDbConnection() {
  pg.raw('select 1')
    .then(() => { console.log('INFO: Connected main database successfully') })
    .catch(err => {
      console.log('connection error'); process.exit(1)
    })

  pg_config.raw('select 1')
    .then(() => { console.log('INFO: Connected config database successfully') })
    .catch(err => {
      console.log('connection error'); process.exit(1)
    })
}
async function isServiceUp(serviceName) {
  const row = await pg_config('service_status')
    .where({ service_name: serviceName })
    .first();

  return row?.is_up === true;
}

function checkRedisDbSync(service, refreshInterval) {
  setInterval(async () => {
    try {
      const state = await getCircuitState(service);
      if (!state || !state.is_up) {
        console.log('🔁 Auto-refreshing circuit from DB');

        const dbState = await isServiceUp(service);
        
        await setCircuitState(service, {
          is_up: dbState
        });
        publishCircuitEvent(service, dbState ? 'CLOSED' : 'OPEN', 'db')
      }
    } catch (err) {
      console.log('⚠️ Auto-refresh failed, keeping circuit OPEN');
    }
  }, refreshInterval);
}

module.exports = { pg, pg_config, checkDbConnection, isServiceUp, checkRedisDbSync };