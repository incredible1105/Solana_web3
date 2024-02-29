import {
    SOLANA_ERROR__TRANSACTION_ERROR_DUPLICATE_INSTRUCTION,
    SOLANA_ERROR__TRANSACTION_ERROR_INSUFFICIENT_FUNDS_FOR_RENT,
    SOLANA_ERROR__TRANSACTION_ERROR_PROGRAM_EXECUTION_TEMPORARILY_RESTRICTED,
    SOLANA_ERROR__TRANSACTION_ERROR_UNKNOWN,
} from './codes';
import { SolanaError } from './error';
import { getSolanaErrorFromRpcError } from './rpc-enum-errors';

/**
 * How to add an error when an entry is added to the RPC `TransactionError` enum:
 *
 *   1. Follow the instructions in `./codes.ts` to add a corresponding Solana error code
 *   2. Add the `TransactionError` enum name in the same order as it appears in `./codes.ts`
 *   3. Add the new error name/code mapping to `./__tests__/transaction-error-test.ts`
 */
const ORDERED_ERROR_NAMES = [
    // Keep synced with RPC source: https://github.com/anza-xyz/agave/blob/master/sdk/src/transaction/error.rs
    // If this list ever gets too large, consider implementing a compression strategy like this:
    // https://gist.github.com/steveluscher/aaa7cbbb5433b1197983908a40860c47
    'AccountInUse',
    'AccountLoadedTwice',
    'AccountNotFound',
    'ProgramAccountNotFound',
    'InsufficientFundsForFee',
    'InvalidAccountForFee',
    'AlreadyProcessed',
    'BlockhashNotFound',
    // `InstructionError` intentionally omitted
    'CallChainTooDeep',
    'MissingSignatureForFee',
    'InvalidAccountIndex',
    'SignatureFailure',
    'InvalidProgramForExecution',
    'SanitizeFailure',
    'ClusterMaintenance',
    'AccountBorrowOutstanding',
    'WouldExceedMaxBlockCostLimit',
    'UnsupportedVersion',
    'InvalidWritableAccount',
    'WouldExceedMaxAccountCostLimit',
    'WouldExceedAccountDataBlockLimit',
    'TooManyAccountLocks',
    'AddressLookupTableNotFound',
    'InvalidAddressLookupTableOwner',
    'InvalidAddressLookupTableData',
    'InvalidAddressLookupTableIndex',
    'InvalidRentPayingAccount',
    'WouldExceedMaxVoteCostLimit',
    'WouldExceedAccountDataTotalLimit',
    'DuplicateInstruction',
    'InsufficientFundsForRent',
    'MaxLoadedAccountsDataSizeExceeded',
    'InvalidLoadedAccountsDataSizeLimit',
    'ResanitizationNeeded',
    'ProgramExecutionTemporarilyRestricted',
    'UnbalancedTransaction',
];

export function getSolanaErrorFromTransactionError(transactionError: string | { [key: string]: unknown }): SolanaError {
    return getSolanaErrorFromRpcError(
        {
            errorCodeBaseOffset: 7050001,
            getErrorContext(errorCode, rpcErrorName, rpcErrorContext) {
                if (errorCode === SOLANA_ERROR__TRANSACTION_ERROR_UNKNOWN) {
                    return {
                        errorName: rpcErrorName,
                        ...(rpcErrorContext !== undefined ? { transactionErrorContext: rpcErrorContext } : null),
                    };
                } else if (errorCode === SOLANA_ERROR__TRANSACTION_ERROR_DUPLICATE_INSTRUCTION) {
                    return {
                        index: rpcErrorContext as number,
                    };
                } else if (
                    errorCode === SOLANA_ERROR__TRANSACTION_ERROR_INSUFFICIENT_FUNDS_FOR_RENT ||
                    errorCode === SOLANA_ERROR__TRANSACTION_ERROR_PROGRAM_EXECUTION_TEMPORARILY_RESTRICTED
                ) {
                    return {
                        accountIndex: (rpcErrorContext as { account_index: number }).account_index,
                    };
                }
            },
            orderedErrorNames: ORDERED_ERROR_NAMES,
            rpcEnumError: transactionError,
        },
        getSolanaErrorFromTransactionError,
    );
}
