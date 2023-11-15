import { address } from '@solana/addresses';

import { assertIsMessagePartialSigner, isMessagePartialSigner, MessagePartialSigner } from '../message-partial-signer';

describe('isMessagePartialSigner', () => {
    it('checks whether a given value is a MessagePartialSigner', () => {
        const myAddress = address('Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy');
        const mySigner = {
            address: myAddress,
            signMessages: async () => [],
        } satisfies MessagePartialSigner<'Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy'>;

        expect(isMessagePartialSigner(mySigner)).toBe(true);
        expect(isMessagePartialSigner({ address: myAddress })).toBe(false);
        expect(isMessagePartialSigner({ address: myAddress, signMessages: 42 })).toBe(false);
    });
});

describe('assertIsMessagePartialSigner', () => {
    it('asserts that a given value is a MessagePartialSigner', () => {
        const myAddress = address('Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy');
        const mySigner = {
            address: myAddress,
            signMessages: async () => [],
        } satisfies MessagePartialSigner<'Gp7YgHcJciP4px5FdFnywUiMG4UcfMZV9UagSAZzDxdy'>;

        const expectedMessage = 'The provided value does not implement the MessagePartialSigner interface';
        expect(() => assertIsMessagePartialSigner(mySigner)).not.toThrow();
        expect(() => assertIsMessagePartialSigner({ address: myAddress })).toThrow(expectedMessage);
        expect(() => assertIsMessagePartialSigner({ address: myAddress, signMessages: 42 })).toThrow(expectedMessage);
    });
});
