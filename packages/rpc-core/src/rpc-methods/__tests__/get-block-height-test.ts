import { createHttpTransport, createJsonRpc } from '@solana/rpc-transport';
import type { SolanaJsonRpcErrorCode } from '@solana/rpc-transport/dist/types/json-rpc-errors';
import type { Rpc } from '@solana/rpc-transport/dist/types/json-rpc-types';
import fetchMock from 'jest-fetch-mock-fork';
import { SolanaRpcMethods, createSolanaRpcApi } from '../../index';
import { Commitment } from '../common';

describe('getBlockHeight', () => {
    let rpc: Rpc<SolanaRpcMethods>;
    beforeEach(() => {
        fetchMock.resetMocks();
        fetchMock.dontMock();
        rpc = createJsonRpc<SolanaRpcMethods>({
            api: createSolanaRpcApi(),
            transport: createHttpTransport({ url: 'http://127.0.0.1:8899' }),
        });
    });
    (['confirmed', 'finalized', 'processed'] as Commitment[]).forEach(commitment => {
        describe(`when called with \`${commitment}\` commitment`, () => {
            it('returns the block height as a bigint', async () => {
                expect.assertions(1);
                const blockHeight = await rpc.getBlockHeight({ commitment }).send();
                expect(blockHeight).toEqual(expect.any(BigInt));
            });
        });
    });
    describe('when called with a `minContextSlot` of 0', () => {
        it('returns the block height as a bigint', async () => {
            expect.assertions(1);
            const blockHeight = await rpc.getBlockHeight({ minContextSlot: 0n }).send();
            expect(blockHeight).toEqual(expect.any(BigInt));
        });
    });
    describe('when called with a `minContextSlot` higher than the highest slot available', () => {
        it('throws an error', async () => {
            expect.assertions(1);
            const sendPromise = rpc
                .getBlockHeight({
                    minContextSlot: 2n ** 63n - 1n, // u64:MAX; safe bet it'll be too high.
                })
                .send();
            await expect(sendPromise).rejects.toMatchObject({
                code: -32016 satisfies (typeof SolanaJsonRpcErrorCode)['JSON_RPC_SERVER_ERROR_MIN_CONTEXT_SLOT_NOT_REACHED'],
                message: expect.any(String),
                name: 'SolanaJsonRpcError',
            });
        });
    });
});
