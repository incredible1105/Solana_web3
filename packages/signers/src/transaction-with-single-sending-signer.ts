import { CompilableTransaction } from '@solana/transactions';

import { getSignersFromTransaction, ITransactionWithSigners } from './account-signer-meta';
import { isTransactionModifyingSigner } from './transaction-modifying-signer';
import { isTransactionPartialSigner } from './transaction-partial-signer';
import { isTransactionSendingSigner } from './transaction-sending-signer';

/** Defines a transaction with exactly one {@link TransactionSendingSigner}. */
export type ITransactionWithSingleSendingSigner = ITransactionWithSigners & {
    readonly __transactionWithSingleSendingSigner: unique symbol;
};

/** Checks whether the provided transaction has exactly one {@link TransactionSendingSigner}. */
export function isTransactionWithSingleSendingSigner<TTransaction extends CompilableTransaction>(
    transaction: TTransaction
): transaction is TTransaction & ITransactionWithSingleSendingSigner {
    try {
        assertIsTransactionWithSingleSendingSigner(transaction);
        return true;
    } catch {
        return false;
    }
}

/** Asserts that the provided transaction has exactly one {@link TransactionSendingSigner}. */
export function assertIsTransactionWithSingleSendingSigner<TTransaction extends CompilableTransaction>(
    transaction: TTransaction
): asserts transaction is TTransaction & ITransactionWithSingleSendingSigner {
    const signers = getSignersFromTransaction(transaction);
    const sendingSigners = signers.filter(isTransactionSendingSigner);

    if (sendingSigners.length === 0) {
        // TODO: Coded error.
        const error = new Error('No `TransactionSendingSigner` was identified.');
        error.name = 'MissingTransactionSendingSignerError';
        throw error;
    }

    // When identifying if there are multiple sending signers, we only need to check for
    // sending signers that do not implement other transaction signer interfaces as
    // they will be used as these other signer interfaces in case of a conflict.
    const sendingOnlySigners = sendingSigners.filter(
        signer => !isTransactionPartialSigner(signer) && !isTransactionModifyingSigner(signer)
    );

    if (sendingOnlySigners.length > 1) {
        // TODO: Coded error.
        const error = new Error('More than one `TransactionSendingSigner` was identified.');
        error.name = 'MultipleTransactionSendingSignersError';
        throw error;
    }
}
