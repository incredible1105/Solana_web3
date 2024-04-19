import { Address } from '@solana/addresses';
import { ReadonlyUint8Array } from '@solana/codecs-core';
import { SignatureBytes } from '@solana/keys';
import {
    CompilableTransactionMessage,
    getCompiledTransactionMessageEncoder,
    IDurableNonceTransactionMessage,
    isTransactionMessageWithBlockhashLifetime,
    ITransactionMessageWithBlockhashLifetime,
    newCompileTransactionMessage,
} from '@solana/transaction-messages';

import {
    TransactionWithBlockhashLifetime,
    TransactionWithDurableNonceLifetime,
    TransactionWithLifetime,
} from './lifetime';
import { OrderedMap, Transaction, TransactionMessageBytes } from './transaction';

export function compileTransaction(
    transactionMessage: CompilableTransactionMessage & ITransactionMessageWithBlockhashLifetime,
): Readonly<Transaction & TransactionWithBlockhashLifetime>;

export function compileTransaction(
    transactionMessage: CompilableTransactionMessage & IDurableNonceTransactionMessage,
): Readonly<Transaction & TransactionWithDurableNonceLifetime>;

export function compileTransaction(
    transactionMessage: CompilableTransactionMessage,
): Readonly<Transaction & TransactionWithLifetime>;

export function compileTransaction(
    transactionMessage: CompilableTransactionMessage,
): Readonly<Transaction & TransactionWithLifetime> {
    const compiledMessage = newCompileTransactionMessage(transactionMessage);
    const messageBytes = getCompiledTransactionMessageEncoder().encode(
        compiledMessage,
    ) as ReadonlyUint8Array as TransactionMessageBytes;

    const transactionSigners = compiledMessage.staticAccounts.slice(0, compiledMessage.header.numSignerAccounts);
    const signatures: OrderedMap<Address, SignatureBytes | null> = {};
    for (const signerAddress of transactionSigners) {
        signatures[signerAddress] = null;
    }

    let lifetimeConstraint: TransactionWithLifetime['lifetimeConstraint'];
    if (isTransactionMessageWithBlockhashLifetime(transactionMessage)) {
        lifetimeConstraint = {
            blockhash: transactionMessage.lifetimeConstraint.blockhash,
            lastValidBlockHeight: transactionMessage.lifetimeConstraint.lastValidBlockHeight,
        };
    } else {
        lifetimeConstraint = {
            nonce: transactionMessage.lifetimeConstraint.nonce,
            nonceAccountAddress: transactionMessage.instructions[0].accounts[0].address,
        };
    }

    const transaction: Transaction & TransactionWithLifetime = {
        lifetimeConstraint,
        messageBytes: messageBytes as TransactionMessageBytes,
        signatures: Object.freeze(signatures),
    };

    return Object.freeze(transaction);
}
