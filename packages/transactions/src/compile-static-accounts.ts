import { Address } from '@solana/addresses';
import { OrderedAccounts } from '@solana/transaction-messages';

export function getCompiledStaticAccounts(orderedAccounts: OrderedAccounts): Address[] {
    const firstLookupTableAccountIndex = orderedAccounts.findIndex(account => 'lookupTableAddress' in account);
    const orderedStaticAccounts =
        firstLookupTableAccountIndex === -1 ? orderedAccounts : orderedAccounts.slice(0, firstLookupTableAccountIndex);
    return orderedStaticAccounts.map(({ address }) => address);
}
