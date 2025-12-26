const { createClient } = require('redis');

const redis = createClient({
  url: 'redis://localhost:6379'
});

redis.connect()
  .then(() => console.log('Redis connected'))
  .catch(console.error);


async function getCircuitState(service) {
  const data = await redis.get(`cb:${service}`);
  return data ? JSON.parse(data) : null;
}

async function setCircuitState(service, state) {
  await redis.set(
    `cb:${service}`,
    JSON.stringify(state),
    { EX: 10 } // 10sec
  );
}

module.exports = { redis, getCircuitState, setCircuitState };