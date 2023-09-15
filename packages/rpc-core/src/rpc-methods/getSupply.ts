import { Base58EncodedAddress } from '@solana/addresses';

import { LamportsUnsafeBeyond2Pow53Minus1 } from '../lamports';
import { Commitment, RpcResponse } from './common';

type GetSupplyConfig = Readonly<{
    commitment?: Commitment;
    excludeNonCirculatingAccountsList?: boolean;
}>;

type GetSupplyApiResponseBase = RpcResponse<{
    /** Total supply in lamports */
    total: LamportsUnsafeBeyond2Pow53Minus1;
    /** Circulating supply in lamports */
    circulating: LamportsUnsafeBeyond2Pow53Minus1;
    /** Non-circulating supply in lamports */
    nonCirculating: LamportsUnsafeBeyond2Pow53Minus1;
}>;

type GetSupplyApiResponseWithNonCirculatingAccounts = GetSupplyApiResponseBase &
    Readonly<{
        value: Readonly<{
            /** an array of account addresses of non-circulating accounts */
            nonCirculatingAccounts: [Base58EncodedAddress];
        }>;
    }>;

type GetSupplyApiResponseWithoutNonCirculatingAccounts = GetSupplyApiResponseBase &
    Readonly<{
        value: Readonly<{
            nonCirculatingAccounts: [];
        }>;
    }>;

export interface GetSupplyApi {
    /**
     * Returns information about the current supply.
     */
    getSupply(
        config: GetSupplyConfig &
            Readonly<{
                excludeNonCirculatingAccountsList: true;
            }>
    ): GetSupplyApiResponseWithoutNonCirculatingAccounts;
    getSupply(config?: GetSupplyConfig): GetSupplyApiResponseWithNonCirculatingAccounts;
}
