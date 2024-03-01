import { Address } from '@solana/addresses';
import {
    SOLANA_ERROR__EXPECTED_INSTRUCTION_TO_HAVE_ACCOUNTS,
    SOLANA_ERROR__EXPECTED_INSTRUCTION_TO_HAVE_DATA,
    SolanaError,
} from '@solana/errors';

import { IAccountLookupMeta, IAccountMeta } from './accounts';

export interface IInstruction<
    TProgramAddress extends string = string,
    TAccounts extends readonly (IAccountMeta | IAccountLookupMeta)[] = readonly (IAccountMeta | IAccountLookupMeta)[],
> {
    readonly accounts?: TAccounts;
    readonly data?: Uint8Array;
    readonly programAddress: Address<TProgramAddress>;
}

export interface IInstructionWithAccounts<TAccounts extends readonly (IAccountMeta | IAccountLookupMeta)[]>
    extends IInstruction {
    readonly accounts: TAccounts;
}

export function isInstructionWithAccounts<
    TAccounts extends readonly (IAccountMeta | IAccountLookupMeta)[] = readonly (IAccountMeta | IAccountLookupMeta)[],
    TInstruction extends IInstruction = IInstruction,
>(instruction: TInstruction): instruction is TInstruction & IInstructionWithAccounts<TAccounts> {
    return instruction.accounts !== undefined;
}

export function assertIsInstructionWithAccounts<
    TAccounts extends readonly (IAccountMeta | IAccountLookupMeta)[] = readonly (IAccountMeta | IAccountLookupMeta)[],
    TInstruction extends IInstruction = IInstruction,
>(instruction: TInstruction): asserts instruction is TInstruction & IInstructionWithAccounts<TAccounts> {
    if (instruction.accounts === undefined) {
        throw new SolanaError(SOLANA_ERROR__EXPECTED_INSTRUCTION_TO_HAVE_ACCOUNTS, {
            data: instruction.data,
            programAddress: instruction.programAddress,
        });
    }
}

export interface IInstructionWithData<TData extends Uint8Array> extends IInstruction {
    readonly data: TData;
}

export function isInstructionWithData<
    TData extends Uint8Array = Uint8Array,
    TInstruction extends IInstruction = IInstruction,
>(instruction: TInstruction): instruction is TInstruction & IInstructionWithData<TData> {
    return instruction.data !== undefined;
}

export function assertIsInstructionWithData<
    TData extends Uint8Array = Uint8Array,
    TInstruction extends IInstruction = IInstruction,
>(instruction: TInstruction): asserts instruction is TInstruction & IInstructionWithData<TData> {
    if (instruction.data === undefined) {
        throw new SolanaError(SOLANA_ERROR__EXPECTED_INSTRUCTION_TO_HAVE_DATA, {
            accountAddresses: instruction.accounts?.map(a => a.address),
            programAddress: instruction.programAddress,
        });
    }
}
