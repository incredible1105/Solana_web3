import { Base58EncodedAddress } from '../base58';
import { createAddressWithSeed, getProgramDerivedAddress } from '../computed-address';

describe('getProgramDerivedAddress()', () => {
    it('fatals when supplied more than 16 seeds', async () => {
        expect.assertions(1);
        await expect(
            getProgramDerivedAddress({
                programAddress: 'FN2R9R724eb4WaxeDmDYrUtmJgoSzkBiQMEHELV3ocyg' as Base58EncodedAddress,
                seeds: Array(17).fill(''),
            })
        ).rejects.toThrow(/A maximum of 16 seeds/);
    });
    it.each([
        new Uint8Array(Array(33).fill(0)),
        'a'.repeat(33),
        '\uD83D\uDC68\u200D\uD83D\uDC68\u200D\uD83D\uDC67\u200D\uD83D\uDC66\uD83D\uDC69\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66',
    ])('fatals when supplied a seed that is 33 bytes long', async oversizedSeed => {
        expect.assertions(1);
        await expect(
            getProgramDerivedAddress({
                programAddress: '5eUi55m4FVaDqKubGH9r6ca1TxjmimmXEU9v1WUZJ47Z' as Base58EncodedAddress,
                seeds: [oversizedSeed],
            })
        ).rejects.toThrow(/exceeds the maximum length of 32 bytes/);
    });
    it('returns a program derived address given a program address and no seeds', async () => {
        expect.assertions(1);
        await expect(
            getProgramDerivedAddress({
                programAddress: 'CZ3TbkgUYpDAJVEWpujQhDSgzNTeqbokrJmYa1j4HAZc' as Base58EncodedAddress,
                seeds: [],
            })
        ).resolves.toStrictEqual({
            bumpSeed: 255,
            pda: '9tVtkyCGAHSDDBPwz7895aC3p2gJRjpu2v26o35FTUco',
        });
    });
    it('returns a program derived address after having tried multiple bump seeds given a program address and no seeds', async () => {
        expect.assertions(1);
        await expect(
            getProgramDerivedAddress({
                programAddress: 'EfTbwNBrSqSuCNBhWUHsBoBdSMWgRU1S47daqRNgW7aK' as Base58EncodedAddress,
                seeds: [],
            })
        ).resolves.toStrictEqual({
            bumpSeed: 251,
            pda: 'CKWT8KZ5GMzKpVRiAULWKPg1LiHt9U3NdAtbuTErHCTq',
        });
    });
    it('returns a program derived address given a program address and a byte-array seed', async () => {
        expect.assertions(1);
        await expect(
            getProgramDerivedAddress({
                programAddress: 'FD3PDEvpQ9JXq8tv7FpJPyZrCjWkCnAaTju16gFPdpqP' as Base58EncodedAddress,
                seeds: [new Uint8Array([1, 2, 3])],
            })
        ).resolves.toStrictEqual({
            bumpSeed: 255,
            pda: '9Tj3hpMWacDiZoBe94sjwJQ72zsUVvEQYsrqyy2CfHky',
        });
    });
    it('returns a program derived address after having tried multiple bump seeds given a program address and a byte-array seed', async () => {
        expect.assertions(1);
        await expect(
            getProgramDerivedAddress({
                programAddress: '9HT3iB4oX1aZPH5V8eNUGByKuwhfcKjBQ3x9rfEAuNeF' as Base58EncodedAddress,
                seeds: [new Uint8Array([1, 2, 3])],
            })
        ).resolves.toStrictEqual({
            bumpSeed: 251,
            pda: 'EeTcRajHcPh74C5D4GqZePac1wYB7Dj9ChTaNHaTH77V',
        });
    });
    it('returns a program derived address given a program address and a string seed', async () => {
        expect.assertions(1);
        await expect(
            getProgramDerivedAddress({
                programAddress: 'EKaNRGA37uiGRyRPMap5EZg9cmbT5mt7KWrGwKwAQ3rK' as Base58EncodedAddress,
                seeds: ['hello'],
            })
        ).resolves.toStrictEqual({
            bumpSeed: 255,
            pda: '6V76gtKMCmVVjrx4sxR9uB868HtZbL3piKEmadC7rSgf',
        });
    });
    it('returns a program derived address after having tried multiple bump seeds given a program address and a string seed', async () => {
        expect.assertions(1);
        await expect(
            getProgramDerivedAddress({
                programAddress: '9PyoV2rqNtoboSvg2JD7GWhM5RQvHGwgdDvK7MCfpgX1' as Base58EncodedAddress,
                seeds: ['hello'],
            })
        ).resolves.toStrictEqual({
            bumpSeed: 251,
            pda: 'E6npEurFu1UEbQFh1DsqBvny17XxUK2QPMgxD3Edn3aG',
        });
    });
    it('returns a program derived address given a program address and a UTF-8 string seed', async () => {
        expect.assertions(1);
        await expect(
            getProgramDerivedAddress({
                programAddress: 'A5dcVPLJsE2vbf7hkqqyYkYDK9UjUfNxuwGtWF2m2vEz' as Base58EncodedAddress,
                seeds: ['\uD83D\uDE80'],
            })
        ).resolves.toStrictEqual({
            bumpSeed: 255,
            pda: 'GYpAzW57Ex4Sw3rp4pq95QrjvtsDyqZsMhSZwqz3NMsE',
        });
    });
    it('returns a program derived address after having tried multiple bump seeds given a program address and a UTF-8 string seed', async () => {
        expect.assertions(1);
        await expect(
            getProgramDerivedAddress({
                programAddress: 'H8gBP21L5ietkHgXcGbgQBCVVEdPUQyuP9Q5MPRLLSJu' as Base58EncodedAddress,
                seeds: ['\uD83D\uDE80'],
            })
        ).resolves.toStrictEqual({
            bumpSeed: 251,
            pda: '46v3JvPtEPeQmH3euXydEbxYD6yfxeZjWSzkkYvvM5Pp',
        });
    });
    it('returns the same result given a program address and two different seed inputs that concatenate to the same bytes', async () => {
        expect.assertions(1);
        const [pdaButterfly, pdaButterFly] = await Promise.all([
            getProgramDerivedAddress({
                programAddress: '9PyoV2rqNtoboSvg2JD7GWhM5RQvHGwgdDvK7MCfpgX1' as Base58EncodedAddress,
                seeds: ['butterfly'],
            }),
            getProgramDerivedAddress({
                programAddress: '9PyoV2rqNtoboSvg2JD7GWhM5RQvHGwgdDvK7MCfpgX1' as Base58EncodedAddress,
                seeds: ['butter', 'fly'],
            }),
        ]);
        expect(pdaButterfly).toStrictEqual(pdaButterFly);
    });
    // https://solana.stackexchange.com/questions/7253/what-combination-of-program-address-and-seeds-would-cause-findprogramaddress-t
    it.todo(
        'fatals when supplied a combination of program address and seeds for which no off-curve point can be found'
    );
});

describe('createAddressWithSeed', () => {
    it('returns an address that is the SHA-256 hash of the concatenated base address, seed, and program address', async () => {
        expect.assertions(2);
        const baseAddress = 'Bh1uUDP3ApWLeccVNHwyQKpnfGQbuE2UECbGA6M4jiZJ' as Base58EncodedAddress;
        const programAddress = 'FGrddpvjBUAG6VdV4fR8Q2hEZTHS6w4SEveVBgfwbfdm' as Base58EncodedAddress;
        const expectedAddress = 'HUKxCeXY6gZohFJFARbLE6L6C9wDEHz1SfK8ENM7QY7z' as Base58EncodedAddress;

        await expect(createAddressWithSeed({ baseAddress, programAddress, seed: 'seed' })).resolves.toEqual(
            expectedAddress
        );

        await expect(
            createAddressWithSeed({ baseAddress, programAddress, seed: new Uint8Array([0x73, 0x65, 0x65, 0x64]) })
        ).resolves.toEqual(expectedAddress);
    });
    it('fails when the seed is longer than 32 bytes', async () => {
        expect.assertions(1);
        const baseAddress = 'Bh1uUDP3ApWLeccVNHwyQKpnfGQbuE2UECbGA6M4jiZJ' as Base58EncodedAddress;
        const programAddress = 'FGrddpvjBUAG6VdV4fR8Q2hEZTHS6w4SEveVBgfwbfdm' as Base58EncodedAddress;

        await expect(createAddressWithSeed({ baseAddress, programAddress, seed: 'a'.repeat(33) })).rejects.toThrow(
            'The seed exceeds the maximum length of 32 bytes'
        );
    });
    it('fails with a malicious programAddress meant to produce an address that would collide with a PDA', async () => {
        expect.assertions(1);
        const baseAddress = 'Bh1uUDP3ApWLeccVNHwyQKpnfGQbuE2UECbGA6M4jiZJ' as Base58EncodedAddress;
        // The ending bytes of this address decode to the ASCII string 'ProgramDerivedAddress'
        const programAddress = '4vJ9JU1bJJE96FbKdjWme2JfVK1knU936FHTDZV7AC2' as Base58EncodedAddress;

        await expect(createAddressWithSeed({ baseAddress, programAddress, seed: 'seed' })).rejects.toThrow(
            'programAddress cannot end with the PDA marker'
        );
    });
});
