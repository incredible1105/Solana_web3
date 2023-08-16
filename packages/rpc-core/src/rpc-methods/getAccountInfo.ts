import { Base58EncodedAddress } from '@solana/addresses';

import {
    AccountInfoBase,
    AccountInfoWithBase58Bytes,
    AccountInfoWithBase58EncodedData,
    AccountInfoWithBase64EncodedData,
    AccountInfoWithBase64EncodedZStdCompressedData,
    AccountInfoWithJsonData,
    Commitment,
    DataSlice,
    RpcResponse,
    Slot,
} from './common';

type GetAccountInfoApiResponseBase = RpcResponse<AccountInfoBase | null>;

type NestInRpcResponseOrNull<T> = Readonly<{
    value: T | null;
}>;

type GetAccountInfoApiCommonConfig = Readonly<{
    // Defaults to `finalized`
    commitment?: Commitment;
    // The minimum slot that the request can be evaluated at
    minContextSlot?: Slot;
}>;

type GetAccountInfoApiSliceableCommonConfig = Readonly<{
    // Limit the returned account data using the provided "offset: <usize>" and "length: <usize>" fields.
    dataSlice?: DataSlice;
}>;

export interface GetAccountInfoApi {
    /**
     * Returns all information associated with the account of provided public key
     */
    getAccountInfo(
        address: Base58EncodedAddress,
        config: GetAccountInfoApiCommonConfig &
            GetAccountInfoApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64';
            }>
    ): GetAccountInfoApiResponseBase & NestInRpcResponseOrNull<AccountInfoWithBase64EncodedData>;
    getAccountInfo(
        address: Base58EncodedAddress,
        config: GetAccountInfoApiCommonConfig &
            GetAccountInfoApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base64+zstd';
            }>
    ): GetAccountInfoApiResponseBase & NestInRpcResponseOrNull<AccountInfoWithBase64EncodedZStdCompressedData>;
    getAccountInfo(
        address: Base58EncodedAddress,
        config: GetAccountInfoApiCommonConfig &
            Readonly<{
                encoding: 'jsonParsed';
            }>
    ): GetAccountInfoApiResponseBase & NestInRpcResponseOrNull<AccountInfoWithJsonData>;
    getAccountInfo(
        address: Base58EncodedAddress,
        config: GetAccountInfoApiCommonConfig &
            GetAccountInfoApiSliceableCommonConfig &
            Readonly<{
                encoding: 'base58';
            }>
    ): GetAccountInfoApiResponseBase & NestInRpcResponseOrNull<AccountInfoWithBase58EncodedData>;
    getAccountInfo(
        address: Base58EncodedAddress,
        config?: GetAccountInfoApiCommonConfig
    ): GetAccountInfoApiResponseBase & NestInRpcResponseOrNull<AccountInfoWithBase58Bytes>;
}
