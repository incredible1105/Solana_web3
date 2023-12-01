import {
    assertIsFixedSize,
    Codec,
    combineCodec,
    createDecoder,
    createEncoder,
    Decoder,
    Encoder,
    FixedSizeCodec,
    FixedSizeDecoder,
    FixedSizeEncoder,
    getEncodedSize,
    Offset,
    VariableSizeCodec,
    VariableSizeDecoder,
    VariableSizeEncoder,
} from '@solana/codecs-core';
import { getU32Decoder, getU32Encoder, NumberCodec, NumberDecoder, NumberEncoder } from '@solana/codecs-numbers';

import { assertValidNumberOfItemsForCodec } from './assertions';
import { getFixedSize, getMaxSize } from './utils';

/**
 * Represents all the size options for array-like codecs
 * — i.e. `array`, `map` and `set`.
 *
 * It can be one of the following:
 * - a {@link NumberCodec} that prefixes its content with its size.
 * - a fixed number of items.
 * - or `'remainder'` to infer the number of items by dividing
 *   the rest of the byte array by the fixed size of its item.
 *   Note that this option is only available for fixed-size items.
 */
export type ArrayLikeCodecSize<TPrefix extends NumberCodec | NumberEncoder | NumberDecoder> =
    | TPrefix
    | number
    | 'remainder';

/** Defines the configs for array codecs. */
export type ArrayCodecConfig<TPrefix extends NumberCodec | NumberEncoder | NumberDecoder> = {
    /**
     * The size of the array.
     * @defaultValue u32 prefix.
     */
    size?: ArrayLikeCodecSize<TPrefix>;
};

/**
 * Encodes an array of items.
 *
 * @param item - The encoder to use for the array's items.
 * @param config - A set of config for the encoder.
 */
export function getArrayEncoder<TFrom>(
    item: Encoder<TFrom>,
    config: ArrayCodecConfig<NumberEncoder> & { size: 0 }
): FixedSizeEncoder<TFrom[], 0>;
export function getArrayEncoder<TFrom>(
    item: FixedSizeEncoder<TFrom>,
    config: ArrayCodecConfig<NumberEncoder> & { size: number }
): FixedSizeEncoder<TFrom[]>;
export function getArrayEncoder<TFrom>(
    item: FixedSizeEncoder<TFrom>,
    config: ArrayCodecConfig<NumberEncoder> & { size: 'remainder' }
): VariableSizeEncoder<TFrom[]>;
export function getArrayEncoder<TFrom>(
    item: Encoder<TFrom>,
    config?: ArrayCodecConfig<NumberEncoder> & { size?: number | NumberEncoder }
): VariableSizeEncoder<TFrom[]>;
export function getArrayEncoder<TFrom>(
    item: Encoder<TFrom>,
    config: ArrayCodecConfig<NumberEncoder> = {}
): Encoder<TFrom[]> {
    const size = config.size ?? getU32Encoder();
    if (size === 'remainder') {
        assertIsFixedSize(item, 'Codecs of "remainder" size must have fixed-size items.');
    }

    const fixedSize = computeArrayLikeCodecSize(size, getFixedSize(item));
    const maxSize = computeArrayLikeCodecSize(size, getMaxSize(item)) ?? undefined;

    return createEncoder({
        ...(fixedSize !== null
            ? { fixedSize }
            : {
                  getSizeFromValue: (array: TFrom[]) => {
                      const prefixSize = typeof size === 'object' ? getEncodedSize(array.length, size) : 0;
                      return prefixSize + [...array].reduce((all, value) => all + getEncodedSize(value, item), 0);
                  },
                  maxSize,
              }),
        write: (array: TFrom[], bytes, offset) => {
            if (typeof size === 'number') {
                assertValidNumberOfItemsForCodec('array', size, array.length);
            }
            if (typeof size === 'object') {
                offset = size.write(array.length, bytes, offset);
            }
            array.forEach(value => {
                offset = item.write(value, bytes, offset);
            });
            return offset;
        },
    });
}

/**
 * Decodes an array of items.
 *
 * @param item - The encoder to use for the array's items.
 * @param config - A set of config for the encoder.
 */
export function getArrayDecoder<TTo>(
    item: Decoder<TTo>,
    config: ArrayCodecConfig<NumberDecoder> & { size: 0 }
): FixedSizeDecoder<TTo[], 0>;
export function getArrayDecoder<TTo>(
    item: FixedSizeDecoder<TTo>,
    config: ArrayCodecConfig<NumberDecoder> & { size: number }
): FixedSizeDecoder<TTo[]>;
export function getArrayDecoder<TTo>(
    item: FixedSizeDecoder<TTo>,
    config: ArrayCodecConfig<NumberDecoder> & { size: 'remainder' }
): VariableSizeDecoder<TTo[]>;
export function getArrayDecoder<TTo>(
    item: Decoder<TTo>,
    config?: ArrayCodecConfig<NumberDecoder> & { size?: number | NumberDecoder }
): VariableSizeDecoder<TTo[]>;
export function getArrayDecoder<TTo>(item: Decoder<TTo>, config: ArrayCodecConfig<NumberDecoder> = {}): Decoder<TTo[]> {
    const size = config.size ?? getU32Decoder();
    if (size === 'remainder') {
        assertIsFixedSize(item, 'Codecs of "remainder" size must have fixed-size items.');
    }

    const itemSize = getFixedSize(item);
    const fixedSize = computeArrayLikeCodecSize(size, itemSize);
    const maxSize = computeArrayLikeCodecSize(size, getMaxSize(item)) ?? undefined;

    return createDecoder({
        ...(fixedSize !== null ? { fixedSize } : { maxSize }),
        read: (bytes: Uint8Array, offset) => {
            const array: TTo[] = [];
            if (typeof size === 'object' && bytes.slice(offset).length === 0) {
                return [array, offset];
            }
            const [resolvedSize, newOffset] = readArrayLikeCodecSize(size, itemSize, bytes, offset);
            offset = newOffset;
            for (let i = 0; i < resolvedSize; i += 1) {
                const [value, newOffset] = item.read(bytes, offset);
                offset = newOffset;
                array.push(value);
            }
            return [array, offset];
        },
    });
}

/**
 * Creates a codec for an array of items.
 *
 * @param item - The codec to use for the array's items.
 * @param config - A set of config for the codec.
 */
export function getArrayCodec<TFrom, TTo extends TFrom = TFrom>(
    item: Codec<TFrom, TTo>,
    config: ArrayCodecConfig<NumberCodec> & { size: 0 }
): FixedSizeCodec<TFrom[], TTo[], 0>;
export function getArrayCodec<TFrom, TTo extends TFrom = TFrom>(
    item: FixedSizeCodec<TFrom, TTo>,
    config: ArrayCodecConfig<NumberCodec> & { size: number }
): FixedSizeCodec<TFrom[], TTo[]>;
export function getArrayCodec<TFrom, TTo extends TFrom = TFrom>(
    item: FixedSizeCodec<TFrom, TTo>,
    config: ArrayCodecConfig<NumberCodec> & { size: 'remainder' }
): VariableSizeCodec<TFrom[], TTo[]>;
export function getArrayCodec<TFrom, TTo extends TFrom = TFrom>(
    item: Codec<TFrom, TTo>,
    config?: ArrayCodecConfig<NumberCodec> & { size?: number | NumberCodec }
): VariableSizeCodec<TFrom[], TTo[]>;
export function getArrayCodec<TFrom, TTo extends TFrom = TFrom>(
    item: Codec<TFrom, TTo>,
    config: ArrayCodecConfig<NumberCodec> = {}
): Codec<TFrom[], TTo[]> {
    return combineCodec(getArrayEncoder(item, config as object), getArrayDecoder(item, config as object));
}

function readArrayLikeCodecSize(
    size: ArrayLikeCodecSize<NumberDecoder>,
    itemSize: number | null,
    bytes: Uint8Array,
    offset: Offset
): [number | bigint, Offset] {
    if (typeof size === 'number') {
        return [size, offset];
    }

    if (typeof size === 'object') {
        return size.read(bytes, offset);
    }

    if (size === 'remainder') {
        if (itemSize === null) {
            // TODO: Coded error.
            throw new Error('Codecs of "remainder" size must have fixed-size items.');
        }
        const remainder = Math.max(0, bytes.length - offset);
        if (remainder % itemSize !== 0) {
            // TODO: Coded error.
            throw new Error(
                `The remainder of the byte array (${remainder} bytes) cannot be split into chunks of ${itemSize} bytes. ` +
                    `Codecs of "remainder" size must have a remainder that is a multiple of its item size. ` +
                    `In other words, ${remainder} modulo ${itemSize} should be equal to zero.`
            );
        }
        return [remainder / itemSize, offset];
    }

    // TODO: Coded error.
    throw new Error(`Unrecognized array-like codec size: ${JSON.stringify(size)}`);
}

function computeArrayLikeCodecSize(size: object | number | 'remainder', itemSize: number | null): number | null {
    if (typeof size !== 'number') return null;
    if (size === 0) return 0;
    return itemSize === null ? null : itemSize * size;
}
