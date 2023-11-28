import { Signature } from '@solana/keys';
import type { SendTransactionApi } from '@solana/rpc-core';
import type { Rpc } from '@solana/rpc-transport';
import { Commitment } from '@solana/rpc-types';
import {
    Base64EncodedWireTransaction,
    BaseTransaction,
    getBase64EncodedWireTransaction,
    IDurableNonceTransaction,
    IFullySignedTransaction,
    ITransactionWithBlockhashLifetime,
    ITransactionWithFeePayer,
} from '@solana/transactions';

import { sendAndConfirmDurableNonceTransaction, sendAndConfirmTransaction } from '../send-transaction';

jest.mock('@solana/transactions');

const FOREVER_PROMISE = new Promise(() => {
    /* never resolve */
});

describe('sendAndConfirmTransaction', () => {
    const MOCK_TRANSACTION = {} as unknown as BaseTransaction &
        ITransactionWithFeePayer &
        IFullySignedTransaction &
        ITransactionWithBlockhashLifetime;
    let confirmRecentTransaction: jest.Mock;
    let createPendingRequest: jest.Mock;
    let rpc: Rpc<SendTransactionApi>;
    let sendTransaction: jest.Mock;
    beforeEach(() => {
        jest.useFakeTimers();
        confirmRecentTransaction = jest.fn().mockReturnValue(FOREVER_PROMISE);
        sendTransaction = jest.fn().mockReturnValue(FOREVER_PROMISE);
        createPendingRequest = jest.fn().mockReturnValue({ send: sendTransaction });
        rpc = {
            sendTransaction: createPendingRequest,
        };
        jest.mocked(getBase64EncodedWireTransaction).mockReturnValue(
            'MOCK_WIRE_TRANSACTION' as Base64EncodedWireTransaction
        );
    });
    it('encodes the transaction into wire format before sending', () => {
        sendAndConfirmTransaction({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            confirmRecentTransaction,
            rpc,
            transaction: MOCK_TRANSACTION,
        });
        expect(getBase64EncodedWireTransaction).toHaveBeenCalledWith(MOCK_TRANSACTION);
        expect(createPendingRequest).toHaveBeenCalledWith('MOCK_WIRE_TRANSACTION', expect.anything());
    });
    it('calls `sendTransaction` with the expected inputs', () => {
        const sendTransactionConfig = {
            maxRetries: 42n,
            minContextSlot: 123n,
            preflightCommitment: 'confirmed' as Commitment,
            skipPreflight: false,
        } as Parameters<SendTransactionApi['sendTransaction']>[1];
        sendAndConfirmTransaction({
            ...sendTransactionConfig,
            abortSignal: new AbortController().signal,
            commitment: 'finalized' as Commitment,
            confirmRecentTransaction,
            rpc,
            transaction: MOCK_TRANSACTION,
        });
        expect(getBase64EncodedWireTransaction).toHaveBeenCalledWith(MOCK_TRANSACTION);
        expect(createPendingRequest).toHaveBeenCalledWith('MOCK_WIRE_TRANSACTION', {
            ...sendTransactionConfig,
            encoding: 'base64',
        });
    });
    it('calls `confirmRecentTransaction` with the expected inputs', async () => {
        expect.assertions(1);
        const sendTransactionConfig = {
            maxRetries: 42n,
            minContextSlot: 123n,
            preflightCommitment: 'confirmed' as Commitment,
            skipPreflight: false,
        } as Parameters<SendTransactionApi['sendTransaction']>[1];
        sendTransaction.mockResolvedValue('abc' as Signature);
        const abortSignal = new AbortController().signal;
        sendAndConfirmTransaction({
            ...sendTransactionConfig,
            abortSignal,
            commitment: 'finalized' as Commitment,
            confirmRecentTransaction,
            rpc,
            transaction: MOCK_TRANSACTION,
        });
        await jest.runAllTimersAsync();
        expect(confirmRecentTransaction).toHaveBeenCalledWith({
            abortSignal,
            commitment: 'finalized',
            transaction: MOCK_TRANSACTION,
        });
    });
    it.each`
        commitment     | expectedPreflightCommitment
        ${'processed'} | ${'processed'}
        ${'confirmed'} | ${'confirmed'}
    `(
        'when missing a `preflightCommitment` and the commitment is $commitment, applies a downgraded `preflightCommitment`',
        ({ commitment, expectedPreflightCommitment }) => {
            sendAndConfirmTransaction({
                abortSignal: new AbortController().signal,
                commitment,
                confirmRecentTransaction,
                rpc,
                transaction: MOCK_TRANSACTION,
            });
            expect(createPendingRequest).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    preflightCommitment: expectedPreflightCommitment,
                })
            );
        }
    );
    it.each`
        commitment     | preflightCommitment | expectedPreflightCommitment
        ${'processed'} | ${'processed'}      | ${'processed'}
        ${'processed'} | ${'confirmed'}      | ${'confirmed'}
        ${'processed'} | ${'finalized'}      | ${'finalized'}
        ${'confirmed'} | ${'processed'}      | ${'processed'}
        ${'confirmed'} | ${'confirmed'}      | ${'confirmed'}
        ${'confirmed'} | ${'finalized'}      | ${'finalized'}
        ${'finalized'} | ${'processed'}      | ${'processed'}
        ${'finalized'} | ${'confirmed'}      | ${'confirmed'}
        ${'finalized'} | ${'finalized'}      | ${'finalized'}
    `(
        'honours the explicit `preflightCommitment` no matter that the commitment is $commitment',
        ({ commitment, preflightCommitment, expectedPreflightCommitment }) => {
            sendAndConfirmTransaction({
                abortSignal: new AbortController().signal,
                commitment,
                confirmRecentTransaction,
                preflightCommitment,
                rpc,
                transaction: MOCK_TRANSACTION,
            });
            expect(createPendingRequest).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    preflightCommitment: expectedPreflightCommitment,
                })
            );
        }
    );
    it('when missing a `preflightCommitment` and the commitment is the same as the server default for `preflightCommitment`, does not apply a `preflightCommitment`', () => {
        expect.assertions(1);
        sendAndConfirmTransaction({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            confirmRecentTransaction,
            rpc,
            transaction: MOCK_TRANSACTION,
        });
        expect(createPendingRequest.mock.lastCall![1]).not.toHaveProperty('preflightCommitment');
    });
    it('returns the signature of the transaction', async () => {
        expect.assertions(1);
        sendTransaction.mockResolvedValue('abc');
        confirmRecentTransaction.mockResolvedValue(undefined);
        await expect(
            sendAndConfirmTransaction({
                abortSignal: new AbortController().signal,
                commitment: 'finalized',
                confirmRecentTransaction,
                rpc,
                transaction: MOCK_TRANSACTION,
            })
        ).resolves.toBe('abc');
    });
});

describe('sendAndConfirmDurableNonceTransaction', () => {
    const MOCK_DURABLE_NONCE_TRANSACTION = {} as unknown as BaseTransaction &
        ITransactionWithFeePayer &
        IFullySignedTransaction &
        IDurableNonceTransaction;
    let confirmDurableNonceTransaction: jest.Mock;
    let createPendingRequest: jest.Mock;
    let rpc: Rpc<SendTransactionApi>;
    let sendTransaction: jest.Mock;
    beforeEach(() => {
        jest.useFakeTimers();
        confirmDurableNonceTransaction = jest.fn().mockReturnValue(FOREVER_PROMISE);
        sendTransaction = jest.fn().mockReturnValue(FOREVER_PROMISE);
        createPendingRequest = jest.fn().mockReturnValue({ send: sendTransaction });
        rpc = {
            sendTransaction: createPendingRequest,
        };
        jest.mocked(getBase64EncodedWireTransaction).mockReturnValue(
            'MOCK_WIRE_TRANSACTION' as Base64EncodedWireTransaction
        );
    });
    it('encodes the transaction into wire format before sending', () => {
        sendAndConfirmDurableNonceTransaction({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            confirmDurableNonceTransaction,
            rpc,
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
        expect(getBase64EncodedWireTransaction).toHaveBeenCalledWith(MOCK_DURABLE_NONCE_TRANSACTION);
        expect(createPendingRequest).toHaveBeenCalledWith('MOCK_WIRE_TRANSACTION', expect.anything());
    });
    it('calls `sendTransaction` with the expected inputs', () => {
        const sendTransactionConfig = {
            maxRetries: 42n,
            minContextSlot: 123n,
            preflightCommitment: 'confirmed' as Commitment,
            skipPreflight: false,
        } as Parameters<SendTransactionApi['sendTransaction']>[1];
        sendAndConfirmDurableNonceTransaction({
            ...sendTransactionConfig,
            abortSignal: new AbortController().signal,
            commitment: 'finalized' as Commitment,
            confirmDurableNonceTransaction,
            rpc,
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
        expect(getBase64EncodedWireTransaction).toHaveBeenCalledWith(MOCK_DURABLE_NONCE_TRANSACTION);
        expect(createPendingRequest).toHaveBeenCalledWith('MOCK_WIRE_TRANSACTION', {
            ...sendTransactionConfig,
            encoding: 'base64',
        });
    });
    it('calls `confirmDurableNonceTransaction` with the expected inputs', async () => {
        expect.assertions(1);
        const sendTransactionConfig = {
            maxRetries: 42n,
            minContextSlot: 123n,
            preflightCommitment: 'confirmed' as Commitment,
            skipPreflight: false,
        } as Parameters<SendTransactionApi['sendTransaction']>[1];
        sendTransaction.mockResolvedValue('abc' as Signature);
        const abortSignal = new AbortController().signal;
        sendAndConfirmDurableNonceTransaction({
            ...sendTransactionConfig,
            abortSignal,
            commitment: 'finalized' as Commitment,
            confirmDurableNonceTransaction,
            rpc,
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
        await jest.runAllTimersAsync();
        expect(confirmDurableNonceTransaction).toHaveBeenCalledWith({
            abortSignal,
            commitment: 'finalized',
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
    });
    it.each`
        commitment     | expectedPreflightCommitment
        ${'processed'} | ${'processed'}
        ${'confirmed'} | ${'confirmed'}
    `(
        'when missing a `preflightCommitment` and the commitment is $commitment, applies a downgraded `preflightCommitment`',
        ({ commitment, expectedPreflightCommitment }) => {
            sendAndConfirmDurableNonceTransaction({
                abortSignal: new AbortController().signal,
                commitment,
                confirmDurableNonceTransaction,
                rpc,
                transaction: MOCK_DURABLE_NONCE_TRANSACTION,
            });
            expect(createPendingRequest).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    preflightCommitment: expectedPreflightCommitment,
                })
            );
        }
    );
    it.each`
        commitment     | preflightCommitment | expectedPreflightCommitment
        ${'processed'} | ${'processed'}      | ${'processed'}
        ${'processed'} | ${'confirmed'}      | ${'confirmed'}
        ${'processed'} | ${'finalized'}      | ${'finalized'}
        ${'confirmed'} | ${'processed'}      | ${'processed'}
        ${'confirmed'} | ${'confirmed'}      | ${'confirmed'}
        ${'confirmed'} | ${'finalized'}      | ${'finalized'}
        ${'finalized'} | ${'processed'}      | ${'processed'}
        ${'finalized'} | ${'confirmed'}      | ${'confirmed'}
        ${'finalized'} | ${'finalized'}      | ${'finalized'}
    `(
        'honours the explicit `preflightCommitment` no matter that the commitment is $commitment',
        ({ commitment, preflightCommitment, expectedPreflightCommitment }) => {
            sendAndConfirmDurableNonceTransaction({
                abortSignal: new AbortController().signal,
                commitment,
                confirmDurableNonceTransaction,
                preflightCommitment,
                rpc,
                transaction: MOCK_DURABLE_NONCE_TRANSACTION,
            });
            expect(createPendingRequest).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    preflightCommitment: expectedPreflightCommitment,
                })
            );
        }
    );
    it('when missing a `preflightCommitment` and the commitment is the same as the server default for `preflightCommitment`, does not apply a `preflightCommitment`', () => {
        expect.assertions(1);
        sendAndConfirmDurableNonceTransaction({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            confirmDurableNonceTransaction,
            rpc,
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
        expect(createPendingRequest.mock.lastCall![1]).not.toHaveProperty('preflightCommitment');
    });
    it('returns the signature of the transaction', async () => {
        expect.assertions(1);
        sendTransaction.mockResolvedValue('abc');
        confirmDurableNonceTransaction.mockResolvedValue(undefined);
        await expect(
            sendAndConfirmDurableNonceTransaction({
                abortSignal: new AbortController().signal,
                commitment: 'finalized',
                confirmDurableNonceTransaction,
                rpc,
                transaction: MOCK_DURABLE_NONCE_TRANSACTION,
            })
        ).resolves.toBe('abc');
    });
});
