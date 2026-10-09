import { AxiosInstance } from 'axios';
import { MempoolConfig } from '../../interfaces';
export declare const makeBitcoinAPI: ({ hostname, network, protocol, config, }: MempoolConfig) => {
    api: AxiosInstance;
};
export declare const makeLiquidAPI: ({ hostname, network, protocol, config, }: MempoolConfig) => {
    api: AxiosInstance;
};
declare const _default: {
    makeBitcoinAPI: ({ hostname, network, protocol, config, }: MempoolConfig) => {
        api: AxiosInstance;
    };
    makeLiquidAPI: ({ hostname, network, protocol, config, }: MempoolConfig) => {
        api: AxiosInstance;
    };
};
export default _default;
