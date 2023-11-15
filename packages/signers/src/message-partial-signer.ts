import { Address } from '@solana/addresses';

import { SignableMessage } from './signable-message';
import { SignatureDictionary } from './types';

/** Defines a signer capable of signing messages. */
export type MessagePartialSigner<TAddress extends string = string> = Readonly<{
    address: Address<TAddress>;
    signMessages(messages: readonly SignableMessage[]): Promise<readonly SignatureDictionary[]>;
}>;

/** Checks whether the provided value implements the {@link MessagePartialSigner} interface. */
export function isMessagePartialSigner<TAddress extends string>(value: {
    address: Address<TAddress>;
    [key: string]: unknown;
}): value is MessagePartialSigner<TAddress> {
    return 'signMessages' in value && typeof value.signMessages === 'function';
}

/** Asserts that the provided value implements the {@link MessagePartialSigner} interface. */
export function assertIsMessagePartialSigner<TAddress extends string>(value: {
    address: Address<TAddress>;
    [key: string]: unknown;
}): asserts value is MessagePartialSigner<TAddress> {
    if (!isMessagePartialSigner(value)) {
        // TODO: Coded error.
        throw new Error('The provided value does not implement the MessagePartialSigner interface');
    }
}
