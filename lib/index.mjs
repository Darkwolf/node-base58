import { TextEncoder, TextDecoder } from 'util'
import {
  ObjectCreate,
  ObjectDefineProperties,
  FunctionPrototypeBind,
  FunctionPrototypeSymbolHasInstance,
  Symbol,
  SymbolToStringTag,
  RangeError,
  SyntaxError,
  TypeError,
  NumberMAX_SAFE_INTEGER,
  NumberMIN_SAFE_INTEGER,
  NumberPrototypeToString,
  BigInt,
  MathFloor,
  MathLog,
  MathMax,
  MathMin,
  String,
  StringPrototypeCharCodeAt,
  StringPrototypeRepeat,
  StringPrototypeSafeSymbolIterator,
  TypedArrayPrototypeFill,
  Uint8Array,
  PrimitivesIsString,
  InstancesIsUint8Array,
  TypesToIntegerOrInfinity,
  TypesToBigInt,
  TypesToLength
} from '@darkwolf/primordials'

const textEncoder = new TextEncoder()
const stringToUint8Array = FunctionPrototypeBind(TextEncoder.prototype.encode, textEncoder)

const textDecoder = new TextDecoder()
const uint8ArrayToString = FunctionPrototypeBind(TextDecoder.prototype.decode, textDecoder)

const alphabetSymbol = Symbol('alphabet')
const alphabetLookupSymbol = Symbol('alphabetLookup')
const baseMapSymbol = Symbol('baseMap')
const baseMapLookupSymbol = Symbol('baseMapLookup')
const encodeToStringSymbol = Symbol('encodeToString')
const decodeFromStringSymbol = Symbol('decodeFromString')

const BASE = 58

const FACTOR = MathLog(256) / MathLog(BASE)
const INVERSE_FACTOR = MathLog(BASE) / MathLog(256)

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const DARKWOLF_ALPHABET = 'AveDarkwo1f23456789BCEFGHJKLMNPQRSTUVWXYZbcdghijmnpqstuxyz'

const NEGATIVE_CHAR = '-'

const createAlphabetLookups = alphabet => {
  const lookup = ObjectCreate(null)
  const baseMap = new Uint8Array(BASE)
  const baseMapLookup = ObjectCreate(null)
  for (let i = 0; i < BASE; i++) {
    const char = alphabet[i]
    const charCode = StringPrototypeCharCodeAt(char)
    lookup[char] = i
    baseMap[i] = charCode
    baseMapLookup[charCode] = i
  }
  return {
    lookup,
    baseMap,
    baseMapLookup
  }
}

const isAlphabet = value => {
  if (!PrimitivesIsString(value) || value.length !== BASE) {
    return false
  }
  const alphabetLookup = base58[alphabetLookupSymbol]
  const uniqueCharsLookup = ObjectCreate(null)
  for (let i = 0; i < BASE; i++) {
    const char = value[i]
    if (alphabetLookup[char] === undefined || uniqueCharsLookup[char] !== undefined) {
      return false
    }
    uniqueCharsLookup[char] = i
  }
  return true
}

const toAlphabet = value => {
  if (value === undefined) {
    return ALPHABET
  }
  if (!PrimitivesIsString(value)) {
    throw new TypeError('The alphabet must be a string')
  }
  if (value.length !== BASE) {
    throw new RangeError('The length of the alphabet must be equal to 58')
  }
  const alphabetLookup = base58[alphabetLookupSymbol]
  const uniqueCharsLookup = ObjectCreate(null)
  for (let i = 0; i < BASE; i++) {
    const char = value[i]
    if (alphabetLookup[char] === undefined) {
      throw new SyntaxError(`Invalid character "${char}" at index ${i} for the Base58 alphabet`)
    }
    if (uniqueCharsLookup[char] !== undefined) {
      throw new SyntaxError(`The character "${char}" at index ${i} is already in the alphabet`)
    }
    uniqueCharsLookup[char] = i
  }
  return value
}

const isBase58String = value => {
  if (!PrimitivesIsString(value)) {
    return false
  }
  const alphabetLookup = base58[alphabetLookupSymbol]
  for (const char of StringPrototypeSafeSymbolIterator(value)) {
    if (alphabetLookup[char] === undefined) {
      return false
    }
  }
  return true
}

class Base58 {
  constructor(alphabet) {
    alphabet = toAlphabet(alphabet)
    const lookups = createAlphabetLookups(alphabet)
    this[alphabetSymbol] = alphabet
    this[alphabetLookupSymbol] = lookups.lookup
    this[baseMapSymbol] = lookups.baseMap
    this[baseMapLookupSymbol] = lookups.baseMapLookup
  }

  get alphabet() {
    return this[alphabetSymbol]
  }

  encodeInt(value) {
    let number = TypesToIntegerOrInfinity(value)
    if (number < NumberMIN_SAFE_INTEGER) {
      throw new RangeError('The value must be greater than or equal to the minimum safe integer')
    } else if (number > NumberMAX_SAFE_INTEGER) {
      throw new RangeError('The value must be less than or equal to the maximum safe integer')
    }
    const alphabet = this[alphabetSymbol]
    if (!number) {
      return alphabet[0]
    }
    const isNegative = number < 0
    if (isNegative) {
      number = -number
    }
    let result = ''
    while (number) {
      result = `${alphabet[number % BASE]}${result}`
      number = MathFloor(number / BASE)
    }
    return isNegative ? `${NEGATIVE_CHAR}${result}` : result
  }

  decodeInt(string) {
    string = String(string)
    const alphabetLookup = this[alphabetLookupSymbol]
    const {length} = string
    const isNegative = string[0] === NEGATIVE_CHAR
    let result = 0
    for (let i = isNegative && length > 1 ? 1 : 0; i < length; i++) {
      const char = string[i]
      const index = alphabetLookup[char]
      if (index === undefined) {
        throw new SyntaxError(`Invalid character "${char}" at index ${i} for Base58 encoding`)
      }
      result = result * BASE + index
    }
    return isNegative && result > 0 ? -result : result
  }

  encodeBigInt(value) {
    let bigInt = TypesToBigInt(value)
    const alphabet = this[alphabetSymbol]
    if (!bigInt) {
      return alphabet[0]
    }
    const isNegative = bigInt < 0n
    if (isNegative) {
      bigInt = -bigInt
    }
    let result = ''
    while (bigInt) {
      result = `${alphabet[bigInt % 58n]}${result}`
      bigInt /= 58n
    }
    return isNegative ? `${NEGATIVE_CHAR}${result}` : result
  }

  decodeBigInt(string) {
    string = String(string)
    const alphabetLookup = this[alphabetLookupSymbol]
    const {length} = string
    const isNegative = string[0] === NEGATIVE_CHAR
    let result = 0n
    for (let i = isNegative && length > 1 ? 1 : 0; i < length; i++) {
      const char = string[i]
      const index = alphabetLookup[char]
      if (index === undefined) {
        throw new SyntaxError(`Invalid character "${char}" at index ${i} for Base58 encoding`)
      }
      result = result * 58n + BigInt(index)
    }
    return isNegative ? -result : result
  }

  [encodeToStringSymbol](input, start, end) {
    const alphabet = this[alphabetSymbol]
    const length = TypesToLength(input.length)
    let startIndex = 0
    let endIndex = length
    if (start !== undefined) {
      start = TypesToIntegerOrInfinity(start)
      startIndex = start < 0 ? MathMax(0, length + start) : MathMin(start, length)
    }
    if (end !== undefined) {
      end = TypesToIntegerOrInfinity(end)
      endIndex = end < 0 ? MathMax(0, length + end) : MathMin(end, length)
    }
    const newLength = MathMax(0, endIndex - startIndex)
    let zeroCount = 0
    while (zeroCount < newLength && input[startIndex + zeroCount] === 0) {
      zeroCount++
    }
    const size = ((newLength - zeroCount) * FACTOR + 1) >>> 0
    const bytes = new Uint8Array(size)
    let lastIndex = size - 1
    let carry = 0
    for (let i = startIndex + zeroCount; i < endIndex; i++) {
      carry = input[i]
      let index = size - 1
      for (; carry !== 0 || index > lastIndex; index--) {
        carry += (bytes[index] << 8) >>> 0
        bytes[index] = (carry % BASE) >>> 0
        carry = (carry / BASE) >>> 0
      }
      lastIndex = index
    }
    let result = zeroCount ? StringPrototypeRepeat(alphabet[0], zeroCount) : ''
    for (let i = lastIndex + 1; i < size; i++) {
      const index = bytes[i]
      result += alphabet[index]
    }
    return result
  }

  [decodeFromStringSymbol](string, start, end) {
    const alphabet = this[alphabetSymbol]
    const alphabetLookup = this[alphabetLookupSymbol]
    const firstAlphabetChar = alphabet[0]
    const {length} = string
    let startIndex = 0
    let endIndex = length
    if (start !== undefined) {
      start = TypesToIntegerOrInfinity(start)
      startIndex = start < 0 ? MathMax(0, length + start) : MathMin(start, length)
    }
    if (end !== undefined) {
      end = TypesToIntegerOrInfinity(end)
      endIndex = end < 0 ? MathMax(0, length + end) : MathMin(end, length)
    }
    const newLength = MathMax(0, endIndex - startIndex)
    let zeroCount = 0
    while (zeroCount < newLength && string[startIndex + zeroCount] === firstAlphabetChar) {
      zeroCount++
    }
    const size = ((newLength - zeroCount) * INVERSE_FACTOR + 1) >>> 0
    const bytes = new Uint8Array(size)
    let lastIndex = size - 1
    let carry = 0
    for (let i = startIndex + zeroCount; i < endIndex; i++) {
      const char = string[i]
      carry = alphabetLookup[char]
      if (carry === undefined) {
        throw new SyntaxError(`Invalid character "${char}" at index ${i} for Base58 encoding`)
      }
      let index = size - 1
      for (; carry !== 0 || index > lastIndex; index--) {
        carry += (bytes[index] * BASE) >>> 0
        bytes[index] = (carry & 0xff) >>> 0
        carry = (carry >> 8) >>> 0
      }
      lastIndex = index
    }
    const index = lastIndex + 1
    const byteLength = size - index
    const result = new Uint8Array(zeroCount + byteLength)
    for (let i = 0; i < byteLength; i++) {
      result[zeroCount + i] = bytes[index + i]
    }
    return result
  }

  encodeText(string, start, end) {
    return this[encodeToStringSymbol](stringToUint8Array(String(string)), start, end)
  }

  decodeText(string, start, end) {
    return uint8ArrayToString(this[decodeFromStringSymbol](String(string), start, end))
  }

  encode(input, start, end) {
    if (!InstancesIsUint8Array(input)) {
      throw new TypeError('The input must be an instance of Uint8Array')
    }
    const baseMap = this[baseMapSymbol]
    const length = TypesToLength(input.length)
    let startIndex = 0
    let endIndex = length
    if (start !== undefined) {
      start = TypesToIntegerOrInfinity(start)
      startIndex = start < 0 ? MathMax(0, length + start) : MathMin(start, length)
    }
    if (end !== undefined) {
      end = TypesToIntegerOrInfinity(end)
      endIndex = end < 0 ? MathMax(0, length + end) : MathMin(end, length)
    }
    const newLength = MathMax(0, endIndex - startIndex)
    let zeroCount = 0
    while (zeroCount < newLength && input[startIndex + zeroCount] === 0) {
      zeroCount++
    }
    const size = ((newLength - zeroCount) * FACTOR + 1) >>> 0
    const bytes = new Uint8Array(size)
    let lastIndex = size - 1
    let carry = 0
    for (let i = startIndex + zeroCount; i < endIndex; i++) {
      carry = input[i]
      let index = size - 1
      for (; carry !== 0 || index > lastIndex; index--) {
        carry += (bytes[index] << 8) >>> 0
        bytes[index] = (carry % BASE) >>> 0
        carry = (carry / BASE) >>> 0
      }
      lastIndex = index
    }
    const index = lastIndex + 1
    const byteLength = size - index
    const result = new Uint8Array(zeroCount + byteLength)
    if (zeroCount) {
      TypedArrayPrototypeFill(result, baseMap[0], 0, zeroCount)
    }
    for (let i = 0; i < byteLength; i++) {
      const charIndex = bytes[index + i]
      result[zeroCount + i] = baseMap[charIndex]
    }
    return result
  }

  decode(input, start, end) {
    if (!InstancesIsUint8Array(input)) {
      throw new TypeError('The input must be an instance of Uint8Array')
    }
    const baseMap = this[baseMapSymbol]
    const baseMapLookup = this[baseMapLookupSymbol]
    const firstAlphabetCharCode = baseMap[0]
    const length = TypesToLength(input.length)
    let startIndex = 0
    let endIndex = length
    if (start !== undefined) {
      start = TypesToIntegerOrInfinity(start)
      startIndex = start < 0 ? MathMax(0, length + start) : MathMin(start, length)
    }
    if (end !== undefined) {
      end = TypesToIntegerOrInfinity(end)
      endIndex = end < 0 ? MathMax(0, length + end) : MathMin(end, length)
    }
    const newLength = MathMax(0, endIndex - startIndex)
    let zeroCount = 0
    while (zeroCount < newLength && input[startIndex + zeroCount] === firstAlphabetCharCode) {
      zeroCount++
    }
    const size = ((newLength - zeroCount) * INVERSE_FACTOR + 1) >>> 0
    const bytes = new Uint8Array(size)
    let lastIndex = size - 1
    let carry = 0
    for (let i = startIndex + zeroCount; i < endIndex; i++) {
      const charCode = input[i]
      carry = baseMapLookup[charCode]
      if (carry === undefined) {
        throw new SyntaxError(`Invalid byte "${NumberPrototypeToString(charCode, 16)}" at index ${i} for Base58 encoding`)
      }
      let index = size - 1
      for (; carry !== 0 || index > lastIndex; index--) {
        carry += (bytes[index] * BASE) >>> 0
        bytes[index] = (carry & 0xff) >>> 0
        carry = (carry >> 8) >>> 0
      }
      lastIndex = index
    }
    const index = lastIndex + 1
    const byteLength = size - index
    const result = new Uint8Array(zeroCount + byteLength)
    for (let i = 0; i < byteLength; i++) {
      result[zeroCount + i] = bytes[index + i]
    }
    return result
  }

  encodeToString(input, start, end) {
    if (!InstancesIsUint8Array(input)) {
      throw new TypeError('The input must be an instance of Uint8Array')
    }
    return this[encodeToStringSymbol](input, start, end)
  }

  decodeFromString(input, start, end) {
    if (!PrimitivesIsString(input)) {
      throw new TypeError('The input must be a string')
    }
    return this[decodeFromStringSymbol](input, start, end)
  }
}

const isBase58 = FunctionPrototypeBind(FunctionPrototypeSymbolHasInstance, null, Base58)

const base58 = new Base58()
const encodeInt = FunctionPrototypeBind(Base58.prototype.encodeInt, base58)
const decodeInt = FunctionPrototypeBind(Base58.prototype.decodeInt, base58)
const encodeBigInt = FunctionPrototypeBind(Base58.prototype.encodeBigInt, base58)
const decodeBigInt = FunctionPrototypeBind(Base58.prototype.decodeBigInt, base58)
const encodeText = FunctionPrototypeBind(Base58.prototype.encodeText, base58)
const decodeText = FunctionPrototypeBind(Base58.prototype.decodeText, base58)
const encode = FunctionPrototypeBind(Base58.prototype.encode, base58)
const decode = FunctionPrototypeBind(Base58.prototype.decode, base58)
const encodeToString = FunctionPrototypeBind(Base58.prototype.encodeToString, base58)
const decodeFromString = FunctionPrototypeBind(Base58.prototype.decodeFromString, base58)

ObjectDefineProperties(Base58, {
  BASE: {
    value: BASE
  },
  ALPHABET: {
    value: ALPHABET
  },
  DARKWOLF_ALPHABET: {
    value: DARKWOLF_ALPHABET
  },
  NEGATIVE_CHAR: {
    value: NEGATIVE_CHAR
  },
  isBase58: {
    value: isBase58
  },
  isAlphabet: {
    value: isAlphabet
  },
  isBase58String: {
    value: isBase58String
  },
  encodeInt: {
    value: encodeInt
  },
  decodeInt: {
    value: decodeInt
  },
  encodeBigInt: {
    value: encodeBigInt
  },
  decodeBigInt: {
    value: decodeBigInt
  },
  encodeText: {
    value: encodeText
  },
  decodeText: {
    value: decodeText
  },
  encode: {
    value: encode
  },
  decode: {
    value: decode
  },
  encodeToString: {
    value: encodeToString
  },
  decodeFromString: {
    value: decodeFromString
  }
})
ObjectDefineProperties(Base58.prototype, {
  [SymbolToStringTag]: {
    value: 'Base58'
  }
})

export {
  BASE,
  ALPHABET,
  DARKWOLF_ALPHABET,
  NEGATIVE_CHAR,
  isBase58,
  isAlphabet,
  isBase58String,
  encodeInt,
  decodeInt,
  encodeBigInt,
  decodeBigInt,
  encodeText,
  decodeText,
  encode,
  decode,
  encodeToString,
  decodeFromString
}
export default Base58
