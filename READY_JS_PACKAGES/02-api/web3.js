const Web3 = require('web3');

const ETHEREUM_NODE = 'https://api.myetherapi.com/rop';

// We need to use WebsocketProvider as event subscription only happens over websocket
const web3 = new Web3(new Web3.providers.HttpProvider(ETHEREUM_NODE));

export {web3 as default};