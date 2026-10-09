"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebsocket = void 0;
var ws_client_browser_1 = require("../../services/ws/ws-client-browser");
var ws_client_node_1 = require("../../services/ws/ws-client-node");
var useWebsocket = function (hostname, network, protocol) {
    if (!protocol) {
        (hostname === null || hostname === void 0 ? void 0 : hostname.includes('localhost')) ? protocol = 'ws' : protocol = 'wss';
    }
    else if (protocol === 'http' || protocol === 'ws') {
        protocol = 'ws';
    }
    else {
        protocol = 'wss';
    }
    if (network && ['testnet', 'liquidtestnet'].includes(network)) {
        network = "/liquidtestnet";
    }
    else {
        network = '/liquid';
    }
    var wsEndpoint = "".concat(protocol, "://").concat(hostname).concat(network, "/api/v1/ws");
    return {
        wsInit: function () { return (0, ws_client_node_1.wsInit)(wsEndpoint); },
        wsInitBrowser: function () { return (0, ws_client_browser_1.wsInit)(wsEndpoint); },
        wsWantData: function (ws, options) { return (0, ws_client_node_1.wsWantData)(ws, options); },
        wsWantDataBrowser: function (ws, options) { return (0, ws_client_browser_1.wsWantData)(ws, options); },
        wsStopData: function (ws) { return (0, ws_client_node_1.wsStopData)(ws); },
        wsStopDataBrowser: function (ws) { return (0, ws_client_browser_1.wsStopData)(ws); },
        wsTrackAddress: function (ws, address) { return (0, ws_client_node_1.wsTrackAddress)(ws, address); },
        wsTrackAddressBrowser: function (ws, address) { return (0, ws_client_browser_1.wsTrackAddress)(ws, address); },
        wsStopTrackingAddress: function (ws) { return (0, ws_client_node_1.wsStopTrackingAddress)(ws); },
        wsStopTrackingAddressBrowser: function (ws) { return (0, ws_client_browser_1.wsStopTrackingAddress)(ws); },
        wsTrackAddresses: function (ws, addresses) { return (0, ws_client_node_1.wsTrackAddresses)(ws, addresses); },
        wsTrackAddressesBrowser: function (ws, addresses) { return (0, ws_client_browser_1.wsTrackAddresses)(ws, addresses); },
        wsStopTrackingAddresses: function (ws) { return (0, ws_client_node_1.wsStopTrackingAddresses)(ws); },
        wsStopTrackingAddressesBrowser: function (ws) { return (0, ws_client_browser_1.wsStopTrackingAddresses)(ws); },
        wsTrackTransaction: function (ws, txid) { return (0, ws_client_node_1.wsTrackTransaction)(ws, txid); },
        wsTrackTransactionBrowser: function (ws, txid) { return (0, ws_client_browser_1.wsTrackTransaction)(ws, txid); },
        wsStopTrackingTransaction: function (ws) { return (0, ws_client_node_1.wsStopTrackingTransaction)(ws); },
        wsStopTrackingTransactionBrowser: function (ws) { return (0, ws_client_browser_1.wsStopTrackingTransaction)(ws); },
        wsTrackMempoolBlock: function (ws, index) { return (0, ws_client_node_1.wsTrackMempoolBlock)(ws, index); },
        wsTrackMempoolBlockBrowser: function (ws, index) { return (0, ws_client_browser_1.wsTrackMempoolBlock)(ws, index); },
        wsStopTrackingMempoolBlock: function (ws) { return (0, ws_client_node_1.wsStopTrackingMempoolBlock)(ws); },
        wsStopTrackingMempoolBlockBrowser: function (ws) { return (0, ws_client_browser_1.wsStopTrackingMempoolBlock)(ws); },
    };
};
exports.useWebsocket = useWebsocket;
