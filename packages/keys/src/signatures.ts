import { assertSigningCapabilityIsAvailable, assertVerificationCapabilityIsAvailable } from '@solana/assertions';
import { Encoder } from '@solana/codecs-core';
import { getBase58Encoder } from '@solana/codecs-strings';

export type Signature = string & { readonly __brand: unique symbol };
export type SignatureBytes = Uint8Array & { readonly __brand: unique symbol };

let base58Encoder: Encoder<string> | undefined;

export function assertIsSignature(putativeSignature: string): asserts putativeSignature is Signature {
    if (!base58Encoder) base58Encoder = getBase58Encoder();

    try {
        // Fast-path; see if the input string is of an acceptable length.
        if (
            // Lowest value (64 bytes of zeroes)
            putativeSignature.length < 64 ||
            // Highest value (64 bytes of 255)
            putativeSignature.length > 88
        ) {
            throw new Error('Expected input string to decode to a byte array of length 64.');
        }
        // Slow-path; actually attempt to decode the input string.
        const bytes = base58Encoder.encode(putativeSignature);
        const numBytes = bytes.byteLength;
        if (numBytes !== 64) {
            throw new Error(`Expected input string to decode to a byte array of length 64. Actual length: ${numBytes}`);
        }
    } catch (e) {
        throw new Error(`\`${putativeSignature}\` is not a signature`, {
            cause: e,
        });
    }
}

export function isSignature(putativeSignature: string): putativeSignature is Signature {
    if (!base58Encoder) base58Encoder = getBase58Encoder();

    // Fast-path; see if the input string is of an acceptable length.
    if (
        // Lowest value (64 bytes of zeroes)
        putativeSignature.length < 64 ||
        // Highest value (64 bytes of 255)
        putativeSignature.length > 88
    ) {
        return false;
    }
    // Slow-path; actually attempt to decode the input string.
    const bytes = base58Encoder.encode(putativeSignature);
    const numBytes = bytes.byteLength;
    if (numBytes !== 64) {
        return false;
    }
    return true;
}

export async function signBytes(key: CryptoKey, data: Uint8Array): Promise<SignatureBytes> {
    await assertSigningCapabilityIsAvailable();
    const signedData = await crypto.subtle.sign('Ed25519', key, data);
    return new Uint8Array(signedData) as SignatureBytes;
}

export function signature(putativeSignature: string): Signature {
    assertIsSignature(putativeSignature);
    return putativeSignature;
}

export async function verifySignature(key: CryptoKey, signature: SignatureBytes, data: Uint8Array): Promise<boolean> {
    await assertVerificationCapabilityIsAvailable();
    return await crypto.subtle.verify('Ed25519', key, signature, data);
}
