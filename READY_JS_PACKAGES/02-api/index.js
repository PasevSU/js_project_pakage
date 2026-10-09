'use strict';

module.exports = {
  createAPI: async (...args) => {
    const { createAPI } = await import('./api.mjs');
    return createAPI(...args);
  },
  loadHttpClient: () => import('./http.mjs'),
  tsaEngine: require('./tsa-engine.js')
};
