import { Base58EncodedAddress } from '@solana/addresses';

import { Commitment, RpcResponse } from '../rpc-methods/common';
import { TransactionError } from '../transaction-error';
import { TransactionSignature } from '../transaction-signature';

type LogsNotificationsApiNotification = RpcResponse<
    Readonly<{
        // Error if transaction failed, null if transaction succeeded
        err: TransactionError | null;
        // Array of log messages the transaction instructions output during execution,
        // null if simulation failed before the transaction was able to execute
        // (for example due to an invalid blockhash or signature verification failure)
        logs: readonly string[] | null;
        // The transaction signature base58 encoded
        signature: TransactionSignature;
    }>
>;

// Currently, the mentions field only supports one Pubkey string per method call.
// Listing additional addresses will result in an error.
type LogsNotificationsApiFilter = 'all' | 'allWithVotes' | { mentions: [Base58EncodedAddress] };

type LogsNotificationsApiConfig = Readonly<{
    commitment?: Commitment;
}>;

export interface LogsNotificationsApi {
    /**
     * Subscribe to a transaction logs to receive notification when a given transaction is committed.
     * On `logsNotification` - the subscription is automatically cancelled.
     * The logs must be a txid, the first logs of a transaction.
     */
    logsNotifications(
        filter: LogsNotificationsApiFilter,
        config?: LogsNotificationsApiConfig
    ): LogsNotificationsApiNotification;
}
