import { IsAny, IsNever } from '../utils';

import { GetKey } from './internal/getPath';
import { AsPathTuple, PathTuple } from './internal/pathTuple';
import {
  AccessPattern,
  ArrayKey,
  AsKey,
  IsTuple,
  Key,
  MapKeys,
  ToKey,
  Traversable,
  UnionToIntersection,
} from './internal/utils';

/**
 * Type to access a type by a key. Returns never
 *  - if it can't be indexed by that key.
 *  - if the type is not traversable.
 * @typeParam T - type which is indexed by the key
 * @typeParam K - key into the type
 * ```
 * TrySet<{foo: string}, 'foo'> = string
 * TrySet<{foo: string}, 'bar'> = never
 * TrySet<null, 'foo'> = never
 * TrySet<string, 'foo'> = never
 * ```
 */
type TrySet<T, K> = K extends keyof T ? T[K] : never;

/**
 * Type to access an array type by a key.
 * @typeParam T - type which is indexed by the key
 * @typeParam K - key into the type
 * ```
 * TrySetArray<string[], '0'> = string
 * TrySetArray<string[], 'foo'> = never
 * ```
 */
type TrySetArray<
  T extends ReadonlyArray<any>,
  K extends Key,
> = K extends `${ArrayKey}` ? T[number] : TrySet<T, K>;

/**
 * Type to implement {@link SetKey}. Wraps everything into a tuple.
 * @typeParam T - non-nullable type which is indexed by the key
 * @typeParam K - key into the type, mustn't be a union of keys
 */
type SetKeyImpl<T, K extends Key> = T extends ReadonlyArray<any>
  ? IsTuple<T> extends true
    ? [TrySet<T, K>]
    : [TrySetArray<T, K>]
  : [TrySet<MapKeys<T>, K>];

/**
 * Type to evaluate the type which the given key points to. This type is the
 * contravariant equivalent of {@link GetKey}.
 *  - If either T or K is union, it will evaluate to the intersection of the
 *    types at the given key(s).
 *  - If T can be null or undefined, the resulting type won't include null or
 *    undefined.
 *  - If a key doesn't exist,the resulting type will be never.
 *  - If a key may be optional, the resulting type will include undefined.
 * @typeParam T - type which is indexed by the key
 * @typeParam K - key into the type
 * @example
 * ```
 * SetKey<{foo: string}, 'foo'> = string
 * SetKey<{foo: string, bar: number}, 'foo' | 'bar'> = string & number
 * SetKey<{foo: string} | {foo: number}, 'foo'> = string & number
 * SetKey<null | {foo: string}, 'foo'> = string
 * SetKey<{bar: string}, 'foo'> = never
 * SetKey<{foo?: string}, 'foo'> = undefined | string
 * ```
 */
export type SetKey<T, K extends Key> = UnionToIntersection<
  K extends any ? SetKeyImpl<NonNullable<T>, K> : never
>[never];

/**
 * Type to implement {@link SetPath} tail-recursively.
 * Wraps everything into a tuple.
 * @typeParam T  - deeply nested type which is indexed by the path
 * @typeParam PT - path into the deeply nested type
 */
type SetPathImpl<T, PT extends PathTuple> = PT extends [infer K, ...infer R]
  ? SetPathImpl<SetKey<T, AsKey<K>>, AsPathTuple<R>>
  : [T];

/**
 * Type to evaluate the type which the given path points to. This type is the
 * contravariant equivalent of {@link GetPath}.
 *  - If either T or PT is union, it will evaluate to the intersection of the
 *    types at the given paths(s).
 *  - If T can be null or undefined, the resulting type won't include null or
 *    undefined.
 *  - If a path doesn't exist, the resulting type will be never.
 *  - Only if last kay is optional, the resulting type will include undefined.
 * @typeParam T  - deeply nested type which is indexed by the path
 * @typeParam PT - path into the deeply nested type
 * @example
 * ```
 * SetPath<{foo: {bar: string}}, ['foo', 'bar']> = string
 * SetPath<{foo: string, bar: number}, ['foo'] | ['bar']> = string & number
 * SetPath<{foo: string} | {foo: number}, ['foo']> = string & number
 * SetPath<null | {foo: string}, ['foo']> = string
 * SetPath<{bar: string}, ['foo']> = never
 * SetPath<{foo?: string}, ['foo']> = undefined | string
 * SetPath<{foo?: {bar: string}}, ['foo', 'bar']> = string
 * ```
 */
export type SetPath<T, PT extends PathTuple> = UnionToIntersection<
  SetPathImpl<T, PT>
>[never];

/**
 * Type which given a tuple type returns its own keys, i.e. only its indices.
 * @typeParam T - tuple type
 * @example
 * ```
 * TupleKeys<[number, string]> = '0' | '1'
 * ```
 */
export type TupleKeys<T extends ReadonlyArray<any>> = Exclude<
  keyof T,
  keyof any[]
>;

/**
 * Type which extracts all numeric keys from an object.
 * @typeParam T - type
 * @example
 * ```
 * NumericObjectKeys<{0: string, '1': string, foo: string}> = '0' | '1'
 * ```
 */
type NumericObjectKeys<T extends Traversable> = ToKey<
  Extract<keyof T, ArrayKey | `${ArrayKey}`>
>;

/**
 * Type which extracts all numeric keys from an object, tuple, or array.
 * If a union is passed, it evaluates to the overlapping numeric keys.
 * @typeParam T - type
 * @example
 * ```
 * NumericKeys<{0: string, '1': string, foo: string}> = '0' | '1'
 * NumericKeys<number[]> = `${number}`
 * NumericKeys<[string, number]> = '0' | '1'
 * NumericKeys<{0: string, '1': string} | [number] | number[]> = '0'
 * ```
 */
export type NumericKeys<T extends Traversable> = UnionToIntersection<
  T extends ReadonlyArray<any>
    ? IsTuple<T> extends true
      ? [TupleKeys<T>]
      : [ToKey<ArrayKey>]
    : [NumericObjectKeys<T>]
>[never];

/**
 * Type which extracts all keys from an object.
 * If a union is passed, it evaluates to the overlapping keys.
 * @typeParam T - object type
 * @example
 * ```
 * ObjectKeys<{foo: string, bar: string}, string> = 'foo' | 'bar'
 * ObjectKeys<{foo: string, bar: number}, string> = 'foo'
 * ```
 */
export type ObjectKeys<T extends Traversable> = Exclude<
  ToKey<keyof T>,
  `${string}.${string}` | ''
>;

/**
 * Type to check whether a type's property matches the constraint type
 * and return its key. Converts the key to a {@link Key}.
 * @typeParam T - type whose property should be checked
 * @typeParam K - key of the property
 * @typeParam C - constraint
 * @example
 * ```
 * CheckKeyConstraint<{foo: string}, 'foo', AccessPattern<string>> = 'foo'
 * CheckKeyConstraint<{foo: string}, 'foo', AccessPattern<number>> = never
 * CheckKeyConstraint<string[], number, AccessPattern<string>> = `${number}`
 * ```
 */
export type CheckKeyConstraint<
  T,
  K extends Key,
  C extends AccessPattern,
> = K extends any
  ? AccessPattern<GetKey<T, K>, SetKey<T, K>> extends C
    ? K
    : never
  : never;

/**
 * Type which evaluates to true when the type is an array or tuple or is a union
 * which contains an array or tuple.
 * @typeParam T - type
 * @example
 * ```
 * ContainsIndexable<{foo: string}> = false
 * ContainsIndexable<{foo: string} | number[]> = true
 * ```
 */
export type ContainsIndexable<T> = IsNever<
  Extract<T, ReadonlyArray<any>>
> extends true
  ? false
  : true;

/**
 * Type to implement {@link Keys} for non-nullable values.
 * @typeParam T - non-nullable type whose property should be checked
 */
type KeysImpl<T> = [T] extends [Traversable]
  ? ContainsIndexable<T> extends true
    ? NumericKeys<T>
    : ObjectKeys<T>
  : never;

/**
 * Type to find all properties of a type that match the constraint type
 * and return their keys.
 * If a union is passed, it evaluates to the overlapping keys.
 * @typeParam T - type whose property should be checked
 * @typeParam C - constraint
 * @example
 * ```
 * Keys<{foo: string, bar: string}, AccessPattern<string>> = 'foo' | 'bar'
 * Keys<{foo?: string, bar?: string}> = 'foo' | 'bar'
 * Keys<{foo: string, bar: number}, AccessPattern<string>> = 'foo'
 * Keys<[string, number], string> = '0'
 * Keys<string[], AccessPattern<string>> = `${number}`
 * Keys<{0: string, '1': string} | [number] | number[]> = '0'
 * ```
 */
export type Keys<
  T,
  C extends AccessPattern = AccessPattern,
> = IsAny<T> extends true
  ? Key
  : IsNever<T> extends true
  ? Key
  : IsNever<NonNullable<T>> extends true
  ? never
  : CheckKeyConstraint<T, KeysImpl<NonNullable<T>>, C>;

/**
 * Type to check whether a {@link Key} is present in a type.
 * If a union of {@link Key}s is passed, all {@link Key}s have to be present
 * in the type.
 * @typeParam T - type which is introspected
 * @typeParam K - key
 * @example
 * ```
 * HasKey<{foo: string}, 'foo'> = true
 * HasKey<{foo: string}, 'bar'> = false
 * HasKey<{foo: string}, 'foo' | 'bar'> = false
 * ```
 */
export type HasKey<T, K extends Key> = IsNever<Exclude<K, Keys<T>>>;

/**
 * Type to implement {@link ValidPathPrefix} tail recursively.
 * @typeParam T   - type which the path should be checked against
 * @typeParam PT  - path which should exist within the given type
 * @typeParam VPT - accumulates the prefix of {@link Key}s which have been
 *                  confirmed to exist already
 */
type ValidPathPrefixImpl<
  T,
  PT extends PathTuple,
  VPT extends PathTuple,
> = PT extends [infer K, ...infer R]
  ? HasKey<T, AsKey<K>> extends true
    ? ValidPathPrefixImpl<
        GetKey<T, AsKey<K>>,
        AsPathTuple<R>,
        AsPathTuple<[...VPT, K]>
      >
    : VPT
  : VPT;

/**
 * Type to find the longest path prefix which is still valid,
 * i.e. exists within the given type.
 * @typeParam T  - type which the path should be checked against
 * @typeParam PT - path which should exist within the given type
 * @example
 * ```
 * ValidPathPrefix<{foo: {bar: string}}, ['foo', 'bar']> = ['foo', 'bar']
 * ValidPathPrefix<{foo: {bar: string}}, ['foo', 'ba']> = ['foo']
 * ```
 */
export type ValidPathPrefix<T, PT extends PathTuple> = ValidPathPrefixImpl<
  T,
  PT,
  []
>;

/**
 * Type to check whether a path through a type exists.
 * @typeParam T  - type which the path should be checked against
 * @typeParam PT - path which should exist within the given type
 * @example
 * ```
 * HasPath<{foo: {bar: string}}, ['foo', 'bar']> = true
 * HasPath<{foo: {bar: string}}, ['foo', 'ba']> = false
 * ```
 */
export type HasPath<T, PT extends PathTuple> = ValidPathPrefix<T, PT> extends PT
  ? true
  : false;
