export const rootTypeDefs = /* GraphQL */ `
    type Query {
        account(
            address: Address!
            commitment: Commitment
            dataSlice: DataSlice
            encoding: AccountEncoding
            minContextSlot: Slot
        ): Account
        block(
            slot: Slot!
            commitment: Commitment
            encoding: TransactionEncoding
            transactionDetails: BlockTransactionDetails
        ): Block
        programAccounts(
            programAddress: Address!
            commitment: Commitment
            dataSlice: DataSlice
            encoding: AccountEncoding
            filters: [ProgramAccountsFilter]
            minContextSlot: Slot
        ): [Account]
        transaction(signature: Signature!, commitment: Commitment, encoding: TransactionEncoding): Transaction
    }

    schema {
        query: Query
    }
`;
