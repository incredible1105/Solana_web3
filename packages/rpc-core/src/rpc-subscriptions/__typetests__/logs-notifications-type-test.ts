/* eslint-disable @typescript-eslint/ban-ts-comment */

import { Base58EncodedAddress } from '@solana/addresses';
import { PendingRpcSubscription, RpcSubscriptions } from '@solana/rpc-transport/dist/types/json-rpc-types';

import { RpcResponse } from '../../rpc-methods/common';
import { TransactionError } from '../../transaction-error';
import { TransactionSignature } from '../../transaction-signature';
import { LogsNotificationsApi } from '../logs-notifications';

async () => {
    const rpcSubscriptions = null as unknown as RpcSubscriptions<LogsNotificationsApi>;

    type TNotification = RpcResponse<
        Readonly<{
            err: TransactionError | null;
            logs: readonly string[] | null;
            signature: TransactionSignature;
        }>
    >;
    rpcSubscriptions.logsNotifications('all') satisfies PendingRpcSubscription<TNotification>;
    rpcSubscriptions
        .logsNotifications('all')
        .subscribe({ abortSignal: new AbortController().signal }) satisfies Promise<AsyncIterable<TNotification>>;
    rpcSubscriptions.logsNotifications('all', {
        commitment: 'confirmed',
    }) satisfies PendingRpcSubscription<TNotification>;
    rpcSubscriptions
        .logsNotifications('all', { commitment: 'confirmed' })
        .subscribe({ abortSignal: new AbortController().signal }) satisfies Promise<AsyncIterable<TNotification>>;

    rpcSubscriptions.logsNotifications('allWithVotes') satisfies PendingRpcSubscription<TNotification>;
    rpcSubscriptions
        .logsNotifications('allWithVotes')
        .subscribe({ abortSignal: new AbortController().signal }) satisfies Promise<AsyncIterable<TNotification>>;
    rpcSubscriptions.logsNotifications('allWithVotes', {
        commitment: 'confirmed',
    }) satisfies PendingRpcSubscription<TNotification>;
    rpcSubscriptions
        .logsNotifications('allWithVotes', { commitment: 'confirmed' })
        .subscribe({ abortSignal: new AbortController().signal }) satisfies Promise<AsyncIterable<TNotification>>;

    rpcSubscriptions.logsNotifications({
        mentions: ['11111111111111111111111111111111' as Base58EncodedAddress],
    }) satisfies PendingRpcSubscription<TNotification>;
    rpcSubscriptions
        .logsNotifications({ mentions: ['11111111111111111111111111111111' as Base58EncodedAddress] })
        .subscribe({ abortSignal: new AbortController().signal }) satisfies Promise<AsyncIterable<TNotification>>;
    rpcSubscriptions.logsNotifications(
        { mentions: ['11111111111111111111111111111111' as Base58EncodedAddress] },
        { commitment: 'confirmed' }
    ) satisfies PendingRpcSubscription<TNotification>;
    rpcSubscriptions
        .logsNotifications(
            { mentions: ['11111111111111111111111111111111' as Base58EncodedAddress] },
            { commitment: 'confirmed' }
        )
        .subscribe({ abortSignal: new AbortController().signal }) satisfies Promise<AsyncIterable<TNotification>>;
};
