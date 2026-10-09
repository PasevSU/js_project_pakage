"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeLiquidAPI = exports.makeBitcoinAPI = void 0;
var axios_1 = __importDefault(require("axios"));
var makeBitcoinAPI = function (_a) {
    var hostname = _a.hostname, network = _a.network, protocol = _a.protocol, config = _a.config;
    if (!protocol) {
        (hostname === null || hostname === void 0 ? void 0 : hostname.includes('localhost')) ? protocol = 'http' : protocol = 'https';
    }
    if (network && ['testnet', 'testnet4', 'signet'].includes(network)) {
        network = "/".concat(network);
    }
    else {
        network = '';
    }
    var api = axios_1.default.create(__assign({ baseURL: "".concat(protocol, "://").concat(hostname).concat(network, "/api/") }, config));
    return {
        api: api,
    };
};
exports.makeBitcoinAPI = makeBitcoinAPI;
var makeLiquidAPI = function (_a) {
    var hostname = _a.hostname, network = _a.network, protocol = _a.protocol, config = _a.config;
    if (!protocol) {
        (hostname === null || hostname === void 0 ? void 0 : hostname.includes('localhost')) ? protocol = 'http' : protocol = 'https';
    }
    if (network && ['testnet', 'liquidtestnet'].includes(network)) {
        network = "/liquidtestnet";
    }
    else {
        network = '/liquid';
    }
    var api = axios_1.default.create(__assign({ baseURL: "".concat(protocol, "://").concat(hostname).concat(network, "/api/") }, config));
    return {
        api: api,
    };
};
exports.makeLiquidAPI = makeLiquidAPI;
exports.default = {
    makeBitcoinAPI: exports.makeBitcoinAPI,
    makeLiquidAPI: exports.makeLiquidAPI,
};
