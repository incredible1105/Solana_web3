// TODO: Eventually move this into whatever package implements transactions
export type Commitment = 'confirmed' | 'finalized' | 'processed';

export type DataSlice = Readonly<{
    offset: number;
    length: number;
}>;

export type Slot = U64UnsafeBeyond2Pow53Minus1;

// FIXME(solana-labs/solana/issues/30341) Beware that any value above 9007199254740991 may be
// truncated or rounded because of a downcast to JavaScript `number` between your calling code and
// the JSON-RPC transport.
export type U64UnsafeBeyond2Pow53Minus1 = bigint;
