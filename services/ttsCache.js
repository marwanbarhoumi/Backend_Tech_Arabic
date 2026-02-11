const cache = new Map();

function getCached(text) {
  return cache.get(text);
}

function setCache(text, buffer) {
  cache.set(text, buffer);
}

module.exports = { getCached, setCache };
