const { createClient } = require('redis');

const redis = createClient({
  url: 'redis://localhost:6379'
});
const subscriber = redis.duplicate();

async function initRedis() {
  await redis.connect();
  await subscriber.connect()
}

async function getCircuitState(service) {
  try {
    const data = await redis.get(`cb:${service}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error in getCircuitState:', error);
    return null;
  }
}

async function setCircuitState(service, state) {
  await redis.set(
    `cb:${service}`,
    JSON.stringify(state),
    { EX: 10 } // 10sec
  );
}

async function publishCircuitEvent(service, state, source) {
  await redis.publish('circuit-events', JSON.stringify({ service, state, source }))
}

module.exports = { redis, getCircuitState, setCircuitState, initRedis, subscriber, publishCircuitEvent };