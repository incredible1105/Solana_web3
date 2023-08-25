import { Base58EncodedAddress } from '@solana/addresses';

import {
    AccountInfoBase,
    AccountInfoWithBase58Bytes,
    AccountInfoWithBase58EncodedData,
    AccountInfoWithBase64EncodedData,
    AccountInfoWithBase64EncodedZStdCompressedData,
    AccountInfoWithPubkey,
    Commitment,
    DataSlice,
    RpcResponse,
    Slot,
    TokenAccount,
    U64UnsafeBeyond2Pow53Minus1,
} from './common';

type TokenAccountInfoWithJsonData = Readonly<{
    data: Readonly<{
        /** Name of the program that owns this account. */
        program: {
            info: TokenAccount;
            type: 'account';
        };
        parsed: unknown;
        space: U64UnsafeBeyond2Pow53Minus1;
    }>;
}>;

type MintFilter = Readonly<{
    /** Pubkey of the specific token Mint to limit accounts to */
    mint: Base58EncodedAddress;
}>;

type ProgramIdFilter = Readonly<{
    /** Pubkey of the Token program that owns the accounts */
    programId: Base58EncodedAddress;
}>;

type AccountsFilter = MintFilter | ProgramIdFilter;

type GetTokenAccountsByOwnerApiCommonConfig = Readonly<{
    /** @defaultValue "finalized" */
    commitment?: Commitment;
    /** The minimum slot that the request can be evaluated at */
    minContextSlot?: Slot;
}>;

type GetTokenAccountsByOwnerApiSliceableCommonConfig = Readonly<{
    /** Limit the returned account data */
    dataSlice?: DataSlice;
}>;
export interface GetTokenAccountsByOwnerApi {
    /**
     * Returns all SPL Token accounts by token owner.
     */
    getTokenAccountsByOwner(
        program: Base58EncodedAddress,
        filter: AccountsFilter,
        config: GetTokenAccountsByOwnerApiCommonConfig &
            GetTokenAccountsByOwnerApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64';
            }>
    ): RpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedData>[]>;

    getTokenAccountsByOwner(
        program: Base58EncodedAddress,
        filter: AccountsFilter,
        config: GetTokenAccountsByOwnerApiCommonConfig &
            GetTokenAccountsByOwnerApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
            }>
    ): RpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedZStdCompressedData>[]>;

    getTokenAccountsByOwner(
        program: Base58EncodedAddress,
        filter: AccountsFilter,
        config: GetTokenAccountsByOwnerApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
            }>
    ): RpcResponse<AccountInfoWithPubkey<AccountInfoBase & TokenAccountInfoWithJsonData>[]>;

    getTokenAccountsByOwner(
        program: Base58EncodedAddress,
        filter: AccountsFilter,
        config: GetTokenAccountsByOwnerApiCommonConfig &
            GetTokenAccountsByOwnerApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base58';
            }>
    ): RpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase58EncodedData>[]>;

    getTokenAccountsByOwner(
        program: Base58EncodedAddress,
        filter: AccountsFilter,
        config?: GetTokenAccountsByOwnerApiCommonConfig & GetTokenAccountsByOwnerApiSliceableCommonConfig
    ): RpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase58Bytes>[]>;
}
