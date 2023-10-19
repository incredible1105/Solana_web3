import { Base58EncodedAddress } from '@solana/addresses';
import { lamports } from '@solana/rpc-core';
import { GetSignatureStatusesApi } from '@solana/rpc-core/dist/types/rpc-methods/getSignatureStatuses';
import { RequestAirdropApi } from '@solana/rpc-core/dist/types/rpc-methods/requestAirdrop';
import { SignatureNotificationsApi } from '@solana/rpc-core/dist/types/rpc-subscriptions/signature-notifications';
import { Rpc, RpcSubscriptions } from '@solana/rpc-transport/dist/types/json-rpc-types';
import { TransactionSignature } from '@solana/transactions';

import { requestAndConfirmAirdrop } from '../airdrop';
import { createDefaultSignatureOnlyRecentTransactionConfirmer } from '../airdrop-confirmer';

jest.mock('../airdrop-confirmer');

const FOREVER_PROMISE = new Promise(() => {
    /* never resolve */
});

describe('requestAndConfirmAirdrop', () => {
    let confirmSignatureOnlyTransaction: jest.Mock;
    let rpc: Rpc<RequestAirdropApi & GetSignatureStatusesApi>;
    let rpcSubscriptions: RpcSubscriptions<SignatureNotificationsApi>;
    let requestAirdrop: jest.Mock;
    let sendAirdropRequest: jest.Mock;
    let subscribe;
    beforeEach(() => {
        jest.useFakeTimers();
        confirmSignatureOnlyTransaction = jest.fn();
        jest.mocked(createDefaultSignatureOnlyRecentTransactionConfirmer).mockReturnValue(
            confirmSignatureOnlyTransaction
        );
        subscribe = jest.fn().mockReturnValue(FOREVER_PROMISE);
        sendAirdropRequest = jest.fn().mockReturnValue(FOREVER_PROMISE);
        requestAirdrop = jest.fn().mockReturnValue({ send: sendAirdropRequest });
        rpc = {
            getSignatureStatuses: jest.fn().mockReturnValue({ send: jest.fn() }),
            requestAirdrop,
        };
        rpcSubscriptions = {
            signatureNotifications: jest.fn().mockReturnValue({ subscribe }),
        };
    });
    it('aborts the `requestAirdrop` request when aborted', async () => {
        expect.assertions(2);
        const abortController = new AbortController();
        requestAndConfirmAirdrop({
            abortSignal: abortController.signal,
            commitment: 'finalized',
            lamports: lamports(1n),
            recipientAddress: '123' as Base58EncodedAddress,
            rpc,
            rpcSubscriptions,
        });
        expect(sendAirdropRequest).toHaveBeenCalledWith({
            abortSignal: expect.objectContaining({ aborted: false }),
        });
        abortController.abort();
        expect(sendAirdropRequest).toHaveBeenCalledWith({
            abortSignal: expect.objectContaining({ aborted: true }),
        });
    });
    it('aborts the `confirmSignatureOnlyTransaction` call when aborted', async () => {
        expect.assertions(2);
        const abortController = new AbortController();
        sendAirdropRequest.mockResolvedValue('abc' as TransactionSignature);
        requestAndConfirmAirdrop({
            abortSignal: abortController.signal,
            commitment: 'finalized',
            lamports: lamports(1n),
            recipientAddress: '123' as Base58EncodedAddress,
            rpc,
            rpcSubscriptions,
        });
        await jest.runAllTimersAsync();
        expect(confirmSignatureOnlyTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                abortSignal: expect.objectContaining({ aborted: false }),
            })
        );
        abortController.abort();
        expect(confirmSignatureOnlyTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                abortSignal: expect.objectContaining({ aborted: true }),
            })
        );
    });
    it('passes the expected input to the airdrop request', async () => {
        expect.assertions(1);
        sendAirdropRequest.mockResolvedValue('abc' as TransactionSignature);
        requestAndConfirmAirdrop({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            lamports: lamports(1n),
            recipientAddress: '123' as Base58EncodedAddress,
            rpc,
            rpcSubscriptions,
        });
        expect(requestAirdrop).toHaveBeenCalledWith('123', 1n, { commitment: 'finalized' });
    });
    it('passes the expected input to the transaction confirmer', async () => {
        expect.assertions(1);
        sendAirdropRequest.mockResolvedValue('abc' as TransactionSignature);
        requestAndConfirmAirdrop({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            lamports: lamports(1n),
            recipientAddress: '123' as Base58EncodedAddress,
            rpc,
            rpcSubscriptions,
        });
        await jest.runAllTimersAsync();
        expect(confirmSignatureOnlyTransaction).toHaveBeenCalledWith({
            abortSignal: expect.any(AbortSignal),
            commitment: 'finalized',
            signature: 'abc' as TransactionSignature,
        });
    });
    it('returns the airdrop transaction signature on success', async () => {
        expect.assertions(1);
        sendAirdropRequest.mockResolvedValue('abc' as TransactionSignature);
        confirmSignatureOnlyTransaction.mockResolvedValue(undefined);
        const airdropPromise = requestAndConfirmAirdrop({
            abortSignal: new AbortController().signal,
            commitment: 'finalized',
            lamports: lamports(1n),
            recipientAddress: '123' as Base58EncodedAddress,
            rpc,
            rpcSubscriptions,
        });
        await expect(airdropPromise).resolves.toBe('abc');
    });
});
