import { SolanaRpcSubscriptions, SolanaRpcSubscriptionsUnstable } from '@solana/rpc-core';
import { createJsonSubscriptionRpc, type RpcSubscriptions } from '@solana/rpc-transport';

import { createSolanaRpcSubscriptions, createSolanaRpcSubscriptions_UNSTABLE } from '../rpc';

const config = null as unknown as Omit<Parameters<typeof createJsonSubscriptionRpc>[0], 'api'>;

createSolanaRpcSubscriptions(config) satisfies RpcSubscriptions<SolanaRpcSubscriptions>;
// @ts-expect-error Should not have unstable subscriptions
createSolanaRpcSubscriptions(config) satisfies RpcSubscriptions<
    SolanaRpcSubscriptions & SolanaRpcSubscriptionsUnstable
>;

createSolanaRpcSubscriptions_UNSTABLE(config) satisfies RpcSubscriptions<
    SolanaRpcSubscriptions & SolanaRpcSubscriptionsUnstable
>;
