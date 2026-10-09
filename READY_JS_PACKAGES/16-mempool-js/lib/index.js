"use strict";
var index_1 = require("./services/api/index");
var addresses_1 = require("./app/bitcoin/addresses");
var blocks_1 = require("./app/bitcoin/blocks");
var difficulty_1 = require("./app/bitcoin/difficulty");
var fees_1 = require("./app/bitcoin/fees");
var lightning_1 = require("./app/bitcoin/lightning");
var mempool_1 = require("./app/bitcoin/mempool");
var transactions_1 = require("./app/bitcoin/transactions");
var websocket_1 = require("./app/bitcoin/websocket");
var assets_1 = require("./app/liquid/assets");
var addresses_2 = require("./app/liquid/addresses");
var blocks_2 = require("./app/liquid/blocks");
var fees_2 = require("./app/liquid/fees");
var mempool_2 = require("./app/liquid/mempool");
var transactions_2 = require("./app/liquid/transactions");
var websocket_2 = require("./app/liquid/websocket");
var hostnameEndpointDefault = 'mempool.space';
var networkEndpointDefault = 'main';
var mempool = function (_a) {
    var _b = _a === void 0 ? {
        hostname: hostnameEndpointDefault,
        network: networkEndpointDefault,
    } : _a, hostname = _b.hostname, network = _b.network, protocol = _b.protocol, config = _b.config;
    if (!hostname)
        hostname = hostnameEndpointDefault;
    if (!network)
        network = networkEndpointDefault;
    var apiBitcoin = (0, index_1.makeBitcoinAPI)({
        hostname: hostname,
        network: network,
        protocol: protocol,
        config: config,
    }).api;
    var apiLiquid = (0, index_1.makeLiquidAPI)({
        hostname: hostname,
        network: network,
        protocol: protocol,
        config: config,
    }).api;
    return {
        bitcoin: {
            addresses: (0, addresses_1.useAddresses)(apiBitcoin),
            blocks: (0, blocks_1.useBlocks)(apiBitcoin),
            difficulty: (0, difficulty_1.useDifficulty)(apiBitcoin),
            fees: (0, fees_1.useFees)(apiBitcoin),
            lightning: (0, lightning_1.useLightning)(apiBitcoin),
            mempool: (0, mempool_1.useMempool)(apiBitcoin),
            transactions: (0, transactions_1.useTransactions)(apiBitcoin),
            websocket: (0, websocket_1.useWebsocket)(hostname, network, protocol),
        },
        liquid: {
            addresses: (0, addresses_2.useAddresses)(apiLiquid),
            assets: (0, assets_1.useAssets)(apiLiquid),
            blocks: (0, blocks_2.useBlocks)(apiLiquid),
            fees: (0, fees_2.useFees)(apiLiquid),
            mempool: (0, mempool_2.useMempool)(apiLiquid),
            transactions: (0, transactions_2.useTransactions)(apiLiquid),
            websocket: (0, websocket_2.useWebsocket)(hostname, network, protocol),
        },
    };
};
mempool.default = mempool;
module.exports = mempool;
