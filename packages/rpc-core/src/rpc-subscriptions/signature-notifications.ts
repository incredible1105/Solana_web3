import { Commitment, RpcResponse } from '../rpc-methods/common';
import { TransactionError } from '../transaction-error';
import { TransactionSignature } from '../transaction-signature';

type SignatureNotificationsApiNotificationReceived = RpcResponse<Readonly<string>>;

type SignatureNotificationsApiNotificationProcessed = RpcResponse<
    Readonly<{
        // Error if transaction failed, null if transaction succeeded.
        err: TransactionError | null;
    }>
>;

type SignatureNotificationsApiConfigBase = Readonly<{
    commitment?: Commitment;
}>;

export interface SignatureNotificationsApi {
    /**
     * Subscribe to a transaction signature to receive notification when a given transaction is committed.
     * On `signatureNotification` - the subscription is automatically cancelled.
     * The signature must be a txid, the first signature of a transaction.
     */
    signatureNotifications(
        // Transaction Signature, as base-58 encoded string
        signature: TransactionSignature,
        config: SignatureNotificationsApiConfigBase &
            Readonly<{
                // Whether or not to subscribe for notifications when signatures are received
                // by the RPC, in addition to when they are processed.
                enableReceivedNotification: true;
            }>
    ): SignatureNotificationsApiNotificationReceived | SignatureNotificationsApiNotificationProcessed;
    signatureNotifications(
        signature: TransactionSignature,
        config?: SignatureNotificationsApiConfigBase &
            Readonly<{
                enableReceivedNotification?: false;
            }>
    ): SignatureNotificationsApiNotificationProcessed;
}
