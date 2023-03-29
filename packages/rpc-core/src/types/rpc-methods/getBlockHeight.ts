import { U64UnsafeBeyond2Pow53Minus1, Commitment, Slot } from './common';

type GetBlockHeightApiResponse = U64UnsafeBeyond2Pow53Minus1;

export interface GetBlockHeightApi {
    /**
     * Returns the current block height of the node
     */
    getBlockHeight(
        config?: Readonly<{
            // Defaults to `finalized`
            commitment?: Commitment;
            // The minimum slot that the request can be evaluated at
            minContextSlot?: Slot;
        }>
    ): GetBlockHeightApiResponse;
}
