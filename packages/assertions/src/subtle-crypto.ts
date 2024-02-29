import {
    SOLANA_ERROR__SUBTLE_CRYPTO_DIGEST_MISSING,
    SOLANA_ERROR__SUBTLE_CRYPTO_ED25519_ALGORITHM_MISSING,
    SOLANA_ERROR__SUBTLE_CRYPTO_EXPORT_FUNCTION_MISSING,
    SOLANA_ERROR__SUBTLE_CRYPTO_GENERATE_FUNCTION_MISSING,
    SOLANA_ERROR__SUBTLE_CRYPTO_MISSING,
    SOLANA_ERROR__SUBTLE_CRYPTO_SIGN_FUNCTION_MISSING,
    SOLANA_ERROR__SUBTLE_CRYPTO_VERIFY_FUNCTION_MISSING,
    SolanaError,
} from '@solana/errors';

function assertIsSecureContext() {
    if (__BROWSER__ && !globalThis.isSecureContext) {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO_MISSING);
    }
}

let cachedEd25519Decision: PromiseLike<boolean> | boolean | undefined;
async function isEd25519CurveSupported(subtle: SubtleCrypto): Promise<boolean> {
    if (cachedEd25519Decision === undefined) {
        cachedEd25519Decision = new Promise(resolve => {
            subtle
                .generateKey('Ed25519', /* extractable */ false, ['sign', 'verify'])
                .catch(() => {
                    resolve((cachedEd25519Decision = false));
                })
                .then(() => {
                    resolve((cachedEd25519Decision = true));
                });
        });
    }
    if (typeof cachedEd25519Decision === 'boolean') {
        return cachedEd25519Decision;
    } else {
        return await cachedEd25519Decision;
    }
}

export async function assertDigestCapabilityIsAvailable() {
    assertIsSecureContext();
    if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle?.digest !== 'function') {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO_DIGEST_MISSING);
    }
}

export async function assertKeyGenerationIsAvailable() {
    assertIsSecureContext();
    if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle?.generateKey !== 'function') {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO_GENERATE_FUNCTION_MISSING);
    }
    if (!(await isEd25519CurveSupported(globalThis.crypto.subtle))) {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO_ED25519_ALGORITHM_MISSING);
    }
}

export async function assertKeyExporterIsAvailable() {
    assertIsSecureContext();
    if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle?.exportKey !== 'function') {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO_EXPORT_FUNCTION_MISSING);
    }
}

export async function assertSigningCapabilityIsAvailable() {
    assertIsSecureContext();
    if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle?.sign !== 'function') {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO_SIGN_FUNCTION_MISSING);
    }
}

export async function assertVerificationCapabilityIsAvailable() {
    assertIsSecureContext();
    if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.subtle?.verify !== 'function') {
        throw new SolanaError(SOLANA_ERROR__SUBTLE_CRYPTO_VERIFY_FUNCTION_MISSING);
    }
}
