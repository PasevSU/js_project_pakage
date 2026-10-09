import { MempoolConfig, MempoolReturn } from './interfaces/index';
declare const mempool: {
    ({ hostname, network, protocol, config }?: MempoolConfig): MempoolReturn;
    default: /*elided*/ any;
};
export = mempool;
