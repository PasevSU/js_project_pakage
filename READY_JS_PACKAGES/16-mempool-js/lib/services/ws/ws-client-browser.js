"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsStopTrackingMempoolBlock = exports.wsTrackMempoolBlock = exports.wsStopTrackingRbf = exports.wsTrackRbf = exports.wsStopTrackingRbfSummary = exports.wsTrackRbfSummary = exports.wsStopTrackingTransaction = exports.wsTrackTransaction = exports.wsStopTrackingAddresses = exports.wsTrackAddresses = exports.wsStopTrackingAddress = exports.wsTrackAddress = exports.wsStopData = exports.wsWantData = exports.wsInit = void 0;
var TIMEOUT_DURATION = 5000;
var MAX_RETRY_COUNT = 3;
var wsActionWrapper = function (ws, action) {
    var retryCount = 0;
    var sendData = function () {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(action));
        }
        else if (retryCount < MAX_RETRY_COUNT) {
            retryCount++;
            console.log("WebSocket connection is not open. Retrying...");
            setTimeout(sendData, TIMEOUT_DURATION);
        }
        else {
            console.log("WebSocket connection is not open. Max retry count reached.");
        }
    };
    sendData();
};
var wsInit = function (endpoint) {
    var ws = new WebSocket(endpoint);
    ws.addEventListener("open", function open() {
        ws.send(JSON.stringify({ action: "init" }));
    });
    return ws;
};
exports.wsInit = wsInit;
var wsWantData = function (ws, options) {
    wsActionWrapper(ws, { action: "want", data: options });
};
exports.wsWantData = wsWantData;
var wsStopData = function (ws) {
    wsActionWrapper(ws, { action: "want", data: [] });
};
exports.wsStopData = wsStopData;
var wsTrackAddress = function (ws, address) {
    wsActionWrapper(ws, { 'track-address': address });
};
exports.wsTrackAddress = wsTrackAddress;
var wsStopTrackingAddress = function (ws) {
    wsActionWrapper(ws, { 'track-address': 'stop' });
};
exports.wsStopTrackingAddress = wsStopTrackingAddress;
var wsTrackAddresses = function (ws, addresses) {
    wsActionWrapper(ws, { 'track-addresses': addresses });
};
exports.wsTrackAddresses = wsTrackAddresses;
var wsStopTrackingAddresses = function (ws) {
    wsActionWrapper(ws, { 'track-addresses': [] });
};
exports.wsStopTrackingAddresses = wsStopTrackingAddresses;
var wsTrackTransaction = function (ws, txid) {
    wsActionWrapper(ws, { 'track-tx': txid });
};
exports.wsTrackTransaction = wsTrackTransaction;
var wsStopTrackingTransaction = function (ws) {
    wsActionWrapper(ws, { 'track-tx': 'stop' });
};
exports.wsStopTrackingTransaction = wsStopTrackingTransaction;
var wsTrackRbfSummary = function (ws) {
    wsActionWrapper(ws, { 'track-rbf-summary': true });
};
exports.wsTrackRbfSummary = wsTrackRbfSummary;
var wsStopTrackingRbfSummary = function (ws) {
    wsActionWrapper(ws, { 'track-rbf-summary': false });
};
exports.wsStopTrackingRbfSummary = wsStopTrackingRbfSummary;
var wsTrackRbf = function (ws, fullRbf) {
    if (!fullRbf) {
        wsActionWrapper(ws, { 'track-rbf': 'all' });
    }
    else {
        wsActionWrapper(ws, { 'track-rbf': 'fullRbf' });
    }
};
exports.wsTrackRbf = wsTrackRbf;
var wsStopTrackingRbf = function (ws) {
    wsActionWrapper(ws, { 'track-rbf': 'stop' });
};
exports.wsStopTrackingRbf = wsStopTrackingRbf;
var wsTrackMempoolBlock = function (ws, index) {
    wsActionWrapper(ws, { 'track-mempool-block': index });
};
exports.wsTrackMempoolBlock = wsTrackMempoolBlock;
var wsStopTrackingMempoolBlock = function (ws) {
    wsActionWrapper(ws, { 'track-mempool-block': -1 });
};
exports.wsStopTrackingMempoolBlock = wsStopTrackingMempoolBlock;
