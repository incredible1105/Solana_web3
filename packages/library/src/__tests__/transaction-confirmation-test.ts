import { Address } from '@solana/addresses';
import { AccountRole, ReadonlySignerAccount, WritableAccount } from '@solana/instructions';
import { Signature, SignatureBytes } from '@solana/keys';
import { Blockhash, IDurableNonceTransaction, Nonce } from '@solana/transactions';

import {
    waitForDurableNonceTransactionConfirmation,
    waitForRecentTransactionConfirmation,
} from '../transaction-confirmation';

const FOREVER_PROMISE = new Promise(() => {
    /* never resolve */
});

describe('waitForDurableNonceTransactionConfirmation', () => {
    const MOCK_DURABLE_NONCE_TRANSACTION = {
        feePayer: '9'.repeat(44) as Address,
        instructions: [
            // Mock AdvanceNonce instruction.
            {
                accounts: [
                    { address: '5'.repeat(44), role: AccountRole.WRITABLE } as WritableAccount,
                    {
                        address:
                            'SysvarRecentB1ockHashes11111111111111111111' as Address<'SysvarRecentB1ockHashes11111111111111111111'>,
                        role: AccountRole.READONLY,
                    },
                    {
                        address: '6'.repeat(44),
                        role: AccountRole.READONLY_SIGNER,
                    } as ReadonlySignerAccount,
                ],
                data: new Uint8Array([4, 0, 0, 0]) as IDurableNonceTransaction['instructions'][0]['data'],
                programAddress: '11111111111111111111111111111111' as Address<'11111111111111111111111111111111'>,
            },
        ],
        lifetimeConstraint: { nonce: 'xyz' as Nonce },
        signatures: {
            ['9'.repeat(44) as Address]: new Uint8Array(new Array(64).fill(0)) as SignatureBytes,
        } as const,
    } as const;
    let getNonceInvalidationPromise: jest.Mock<Promise<void>>;
    let getRecentSignatureConfirmationPromise: jest.Mock<Promise<void>>;
    beforeEach(() => {
        getNonceInvalidationPromise = jest.fn().mockReturnValue(FOREVER_PROMISE);
        getRecentSignatureConfirmationPromise = jest.fn().mockReturnValue(FOREVER_PROMISE);
    });
    it('throws when the signal is already aborted', async () => {
        expect.assertions(1);
        const abortController = new AbortController();
        abortController.abort();
        const commitmentPromise = waitForDurableNonceTransactionConfirmation({
            abortSignal: abortController.signal,
            commitment: 'finalized',
            getNonceInvalidationPromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
        await expect(commitmentPromise).rejects.toThrow('aborted');
    });
    it('calls `getNonceInvalidationPromise` with the necessary input', async () => {
        expect.assertions(1);
        waitForDurableNonceTransactionConfirmation({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            getNonceInvalidationPromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
        expect(getNonceInvalidationPromise).toHaveBeenCalledWith({
            abortSignal: expect.any(AbortSignal),
            commitment: 'finalized',
            currentNonceValue: 'xyz',
            nonceAccountAddress: '5'.repeat(44),
        });
    });
    it('calls the abort signal passed to `getBlockHeightExceededPromise` when aborted', async () => {
        expect.assertions(1);
        const handleAbortOnBlockHeightExceedencePromise = jest.fn();
        getNonceInvalidationPromise.mockImplementation(async ({ abortSignal }) => {
            abortSignal.addEventListener('abort', handleAbortOnBlockHeightExceedencePromise);
            await FOREVER_PROMISE;
        });
        const abortController = new AbortController();
        waitForDurableNonceTransactionConfirmation({
            abortSignal: abortController.signal,
            commitment: 'finalized',
            getNonceInvalidationPromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
        abortController.abort();
        expect(handleAbortOnBlockHeightExceedencePromise).toHaveBeenCalled();
    });
    it('calls the abort signal passed to `getRecentSignatureConfirmationPromise` when aborted', async () => {
        expect.assertions(1);
        const handleAbortOnSignatureConfirmationPromise = jest.fn();
        getRecentSignatureConfirmationPromise.mockImplementation(async ({ abortSignal }) => {
            abortSignal.addEventListener('abort', handleAbortOnSignatureConfirmationPromise);
            await FOREVER_PROMISE;
        });
        const abortController = new AbortController();
        waitForDurableNonceTransactionConfirmation({
            abortSignal: abortController.signal,
            commitment: 'finalized',
            getNonceInvalidationPromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
        abortController.abort();
        expect(handleAbortOnSignatureConfirmationPromise).toHaveBeenCalled();
    });
    it('calls `getRecentSignatureConfirmationPromise` with the necessary input', async () => {
        expect.assertions(1);
        waitForDurableNonceTransactionConfirmation({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            getNonceInvalidationPromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
        expect(getRecentSignatureConfirmationPromise).toHaveBeenCalledWith({
            abortSignal: expect.any(AbortSignal),
            commitment: 'finalized',
            signature: '1111111111111111111111111111111111111111111111111111111111111111' as Signature,
        });
    });
    it('throws when supplied a transaction that has not been signed by the fee payer', async () => {
        expect.assertions(1);
        const transactionWithoutFeePayerSignature = {
            ...MOCK_DURABLE_NONCE_TRANSACTION,
            signatures: {
                // Signature by someone other than the fee payer.
                ['456' as Address]: new Uint8Array(new Array(64).fill(0)) as SignatureBytes,
            } as const,
        };
        const commitmentPromise = waitForDurableNonceTransactionConfirmation({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            getNonceInvalidationPromise,
            getRecentSignatureConfirmationPromise,
            transaction: transactionWithoutFeePayerSignature,
        });
        await expect(commitmentPromise).rejects.toThrow(
            "Could not determine this transaction's signature. Make sure that the transaction " +
                'has been signed by its fee payer.'
        );
    });
    it('resolves when the signature confirmation promise resolves despite the block height exceedence promise having thrown', async () => {
        expect.assertions(1);
        getNonceInvalidationPromise.mockRejectedValue(new Error('o no'));
        getRecentSignatureConfirmationPromise.mockResolvedValue(undefined);
        const commitmentPromise = waitForDurableNonceTransactionConfirmation({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            getNonceInvalidationPromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
        await expect(commitmentPromise).resolves.toBeUndefined();
    });
    it('throws when the block height exceedence promise throws', async () => {
        expect.assertions(1);
        getNonceInvalidationPromise.mockRejectedValue(new Error('o no'));
        const commitmentPromise = waitForDurableNonceTransactionConfirmation({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            getNonceInvalidationPromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
        await expect(commitmentPromise).rejects.toThrow('o no');
    });
    it('throws when the signature confirmation promise throws', async () => {
        expect.assertions(1);
        getRecentSignatureConfirmationPromise.mockRejectedValue(new Error('o no'));
        const commitmentPromise = waitForDurableNonceTransactionConfirmation({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            getNonceInvalidationPromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_DURABLE_NONCE_TRANSACTION,
        });
        await expect(commitmentPromise).rejects.toThrow('o no');
    });
});

describe('waitForRecentTransactionConfirmation', () => {
    const MOCK_TRANSACTION = {
        feePayer: '9'.repeat(44) as Address,
        lifetimeConstraint: { blockhash: '4'.repeat(44) as Blockhash, lastValidBlockHeight: 123n },
        signatures: {
            ['9'.repeat(44) as Address]: new Uint8Array(new Array(64).fill(0)) as SignatureBytes,
        } as const,
    } as const;
    let getBlockHeightExceedencePromise: jest.Mock<Promise<void>>;
    let getRecentSignatureConfirmationPromise: jest.Mock<Promise<void>>;
    beforeEach(() => {
        getBlockHeightExceedencePromise = jest.fn().mockReturnValue(FOREVER_PROMISE);
        getRecentSignatureConfirmationPromise = jest.fn().mockReturnValue(FOREVER_PROMISE);
    });
    it('throws when the signal is already aborted', async () => {
        expect.assertions(1);
        const abortController = new AbortController();
        abortController.abort();
        const commitmentPromise = waitForRecentTransactionConfirmation({
            abortSignal: abortController.signal,
            commitment: 'finalized',
            getBlockHeightExceedencePromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_TRANSACTION,
        });
        await expect(commitmentPromise).rejects.toThrow('aborted');
    });
    it('calls `getBlockHeightExceededPromise` with the necessary input', async () => {
        expect.assertions(1);
        waitForRecentTransactionConfirmation({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            getBlockHeightExceedencePromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_TRANSACTION,
        });
        expect(getBlockHeightExceedencePromise).toHaveBeenCalledWith({
            abortSignal: expect.any(AbortSignal),
            lastValidBlockHeight: MOCK_TRANSACTION.lifetimeConstraint.lastValidBlockHeight,
        });
    });
    it('calls `getRecentSignatureConfirmationPromise` with the necessary input', async () => {
        expect.assertions(1);
        waitForRecentTransactionConfirmation({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            getBlockHeightExceedencePromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_TRANSACTION,
        });
        expect(getRecentSignatureConfirmationPromise).toHaveBeenCalledWith({
            abortSignal: expect.any(AbortSignal),
            commitment: 'finalized',
            signature: '1111111111111111111111111111111111111111111111111111111111111111' as Signature,
        });
    });
    it('throws when supplied a transaction that has not been signed by the fee payer', async () => {
        expect.assertions(1);
        const transactionWithoutFeePayerSignature = {
            ...MOCK_TRANSACTION,
            signatures: {
                // Signature by someone other than the fee payer.
                ['456' as Address]: new Uint8Array(new Array(64).fill(0)) as SignatureBytes,
            } as const,
        };
        const commitmentPromise = waitForRecentTransactionConfirmation({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            getBlockHeightExceedencePromise,
            getRecentSignatureConfirmationPromise,
            transaction: transactionWithoutFeePayerSignature,
        });
        await expect(commitmentPromise).rejects.toThrow(
            "Could not determine this transaction's signature. Make sure that the transaction " +
                'has been signed by its fee payer.'
        );
    });
    it('resolves when the signature confirmation promise resolves despite the block height exceedence promise having thrown', async () => {
        expect.assertions(1);
        getBlockHeightExceedencePromise.mockRejectedValue(new Error('o no'));
        getRecentSignatureConfirmationPromise.mockResolvedValue(undefined);
        const commitmentPromise = waitForRecentTransactionConfirmation({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            getBlockHeightExceedencePromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_TRANSACTION,
        });
        await expect(commitmentPromise).resolves.toBeUndefined();
    });
    it('throws when the block height exceedence promise throws', async () => {
        expect.assertions(1);
        getBlockHeightExceedencePromise.mockRejectedValue(new Error('o no'));
        const commitmentPromise = waitForRecentTransactionConfirmation({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            getBlockHeightExceedencePromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_TRANSACTION,
        });
        await expect(commitmentPromise).rejects.toThrow('o no');
    });
    it('throws when the signature confirmation promise throws', async () => {
        expect.assertions(1);
        getRecentSignatureConfirmationPromise.mockRejectedValue(new Error('o no'));
        const commitmentPromise = waitForRecentTransactionConfirmation({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            getBlockHeightExceedencePromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_TRANSACTION,
        });
        await expect(commitmentPromise).rejects.toThrow('o no');
    });
    it('calls the abort signal passed to `getBlockHeightExceededPromise` when aborted', async () => {
        expect.assertions(1);
        const handleAbortOnBlockHeightExceedencePromise = jest.fn();
        getBlockHeightExceedencePromise.mockImplementation(async ({ abortSignal }) => {
            abortSignal.addEventListener('abort', handleAbortOnBlockHeightExceedencePromise);
            await FOREVER_PROMISE;
        });
        const abortController = new AbortController();
        waitForRecentTransactionConfirmation({
            abortSignal: abortController.signal,
            commitment: 'finalized',
            getBlockHeightExceedencePromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_TRANSACTION,
        });
        abortController.abort();
        expect(handleAbortOnBlockHeightExceedencePromise).toHaveBeenCalled();
    });
    it('calls the abort signal passed to `getRecentSignatureConfirmationPromise` when aborted', async () => {
        expect.assertions(1);
        const handleAbortOnSignatureConfirmationPromise = jest.fn();
        getRecentSignatureConfirmationPromise.mockImplementation(async ({ abortSignal }) => {
            abortSignal.addEventListener('abort', handleAbortOnSignatureConfirmationPromise);
            await FOREVER_PROMISE;
        });
        const abortController = new AbortController();
        waitForRecentTransactionConfirmation({
            abortSignal: abortController.signal,
            commitment: 'finalized',
            getBlockHeightExceedencePromise,
            getRecentSignatureConfirmationPromise,
            transaction: MOCK_TRANSACTION,
        });
        abortController.abort();
        expect(handleAbortOnSignatureConfirmationPromise).toHaveBeenCalled();
    });
});
