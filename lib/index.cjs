const { TextEncoder, TextDecoder } = require('util')
const {
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
  String,
  StringPrototypeCharCodeAt,
  StringPrototypeRepeat,
  StringPrototypeSafeSymbolIterator,
  TypedArrayPrototypeFill,
  Uint8Array,
  PrimitivesIsString,
  InstancesIsUint8Array,
  TypesToIntegerOrInfinity,
  TypesToBigInt
} = require('@darkwolf/primordials')

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const alphabetSymbol = Symbol('alphabet')
const alphabetLookupSymbol = Symbol('alphabetLookup')
const baseMapSymbol = Symbol('baseMap')
const baseMapLookupSymbol = Symbol('baseMapLookup')
const encodeToStringSymbol = Symbol('encodeToString')
const decodeFromStringSymbol = Symbol('decodeFromString')
class Base58 {
  constructor(alphabet) {
    if (alphabet === undefined) {
      alphabet = ALPHABET
    } else {
      validateAlphabet(alphabet)
    }
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
      result = `${alphabet[number % 58]}${result}`
      number = MathFloor(number / 58)
    }
    return isNegative ? `-${result}` : result
  }

  decodeInt(string) {
    string = String(string)
    const {length} = string
    const alphabetLookup = this[alphabetLookupSymbol]
    const isNegative = string[0] === '-'
    let result = 0
    for (let i = isNegative && length > 1 ? 1 : 0; i < length; i++) {
      const char = string[i]
      const index = alphabetLookup[char]
      if (index === undefined) {
        throw new SyntaxError(`Invalid character "${char}" at index ${i} for Base58 encoding`)
      }
      result = result * 58 + index
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
    return isNegative ? `-${result}` : result
  }

  decodeBigInt(string) {
    string = String(string)
    const {length} = string
    const alphabetLookup = this[alphabetLookupSymbol]
    const isNegative = string[0] === '-'
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

  [encodeToStringSymbol](input) {
    const length = input.length >>> 0
    let zeroCount = 0
    while (zeroCount < length && input[zeroCount] === 0) {
      zeroCount++
    }
    const size = ((length - zeroCount) * FACTOR + 1) >>> 0
    const bytes = new Uint8Array(size)
    let lastIndex = size - 1
    let carry = 0
    for (let i = zeroCount; i < length; i++) {
      carry = input[i]
      let index = size - 1
      for (; carry !== 0 || index > lastIndex; index--) {
        carry += (bytes[index] << 8) >>> 0
        bytes[index] = (carry % 58) >>> 0
        carry = (carry / 58) >>> 0
      }
      lastIndex = index
    }
    const alphabet = this[alphabetSymbol]
    let result = zeroCount ? StringPrototypeRepeat(alphabet[0], zeroCount) : ''
    for (let i = lastIndex + 1; i < size; i++) {
      const index = bytes[i]
      result += alphabet[index]
    }
    return result
  }

  [decodeFromStringSymbol](string) {
    const {length} = string
    const alphabet = this[alphabetSymbol]
    const alphabetLookup = this[alphabetLookupSymbol]
    const firstAlphabetChar = alphabet[0]
    let zeroCount = 0
    while (zeroCount < length && string[zeroCount] === firstAlphabetChar) {
      zeroCount++
    }
    const size = ((length - zeroCount) * INVERSE_FACTOR + 1) >>> 0
    const bytes = new Uint8Array(size)
    let lastIndex = size - 1
    let carry = 0
    for (let i = zeroCount; i < length; i++) {
      const char = string[i]
      carry = alphabetLookup[char]
      if (carry === undefined) {
        throw new SyntaxError(`Invalid character "${char}" at index ${i} for Base58 encoding`)
      }
      let index = size - 1
      for (; carry !== 0 || index > lastIndex; index--) {
        carry += (bytes[index] * 58) >>> 0
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

  encodeText(string) {
    return this[encodeToStringSymbol](textEncoder.encode(String(string)))
  }

  decodeText(string) {
    return textDecoder.decode(this[decodeFromStringSymbol](String(string)))
  }

  encode(input) {
    if (!InstancesIsUint8Array(input)) {
      throw new TypeError('The input must be an instance of Uint8Array')
    }
    const length = input.length >>> 0
    let zeroCount = 0
    while (zeroCount < length && input[zeroCount] === 0) {
      zeroCount++
    }
    const size = ((length - zeroCount) * FACTOR + 1) >>> 0
    const bytes = new Uint8Array(size)
    let lastIndex = size - 1
    let carry = 0
    for (let i = zeroCount; i < length; i++) {
      carry = input[i]
      let index = size - 1
      for (; carry !== 0 || index > lastIndex; index--) {
        carry += (bytes[index] << 8) >>> 0
        bytes[index] = (carry % 58) >>> 0
        carry = (carry / 58) >>> 0
      }
      lastIndex = index
    }
    const index = lastIndex + 1
    const byteLength = size - index
    const result = new Uint8Array(zeroCount + byteLength)
    const baseMap = this[baseMapSymbol]
    if (zeroCount) {
      TypedArrayPrototypeFill(result, baseMap[0], 0, zeroCount)
    }
    for (let i = 0; i < byteLength; i++) {
      const charIndex = bytes[index + i]
      result[zeroCount + i] = baseMap[charIndex]
    }
    return result
  }

  decode(input) {
    if (!InstancesIsUint8Array(input)) {
      throw new TypeError('The input must be an instance of Uint8Array')
    }
    const length = input.length >>> 0
    const baseMap = this[baseMapSymbol]
    const baseMapLookup = this[baseMapLookupSymbol]
    const firstAlphabetCharCode = baseMap[0]
    let zeroCount = 0
    while (zeroCount < length && input[zeroCount] === firstAlphabetCharCode) {
      zeroCount++
    }
    const size = ((length - zeroCount) * INVERSE_FACTOR + 1) >>> 0
    const bytes = new Uint8Array(size)
    let lastIndex = size - 1
    let carry = 0
    for (let i = zeroCount; i < length; i++) {
      const charCode = input[i]
      carry = baseMapLookup[charCode]
      if (carry === undefined) {
        throw new SyntaxError(`Invalid byte "${NumberPrototypeToString(charCode, 16)}" at index ${i} for Base58 encoding`)
      }
      let index = size - 1
      for (; carry !== 0 || index > lastIndex; index--) {
        carry += (bytes[index] * 58) >>> 0
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

  encodeToString(input) {
    if (!InstancesIsUint8Array(input)) {
      throw new TypeError('The input must be an instance of Uint8Array')
    }
    return this[encodeToStringSymbol](input)
  }

  decodeFromString(input) {
    if (!PrimitivesIsString(input)) {
      throw new TypeError('The input must be a string')
    }
    return this[decodeFromStringSymbol](input)
  }
}

const isBase58 = FunctionPrototypeBind(FunctionPrototypeSymbolHasInstance, null, Base58)

const FACTOR = MathLog(256) / MathLog(58)
const INVERSE_FACTOR = MathLog(58) / MathLog(256)

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const DARKWOLF_ALPHABET = 'AveDarkwo1f23456789BCEFGHJKLMNPQRSTUVWXYZbcdghijmnpqstuxyz'

const createAlphabetLookups = alphabet => {
  const lookup = ObjectCreate(null)
  const baseMap = new Uint8Array(58)
  const baseMapLookup = ObjectCreate(null)
  for (let i = 0; i < 58; i++) {
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

const validateAlphabet = value => {
  if (!PrimitivesIsString(value)) {
    throw new TypeError('The alphabet must be a string')
  }
  if (value.length !== 58) {
    throw new RangeError('The length of the alphabet must be equal to 58')
  }
  const alphabetLookup = base58[alphabetLookupSymbol]
  const uniqueCharsLookup = ObjectCreate(null)
  for (let i = 0; i < 58; i++) {
    const char = value[i]
    if (alphabetLookup[char] === undefined) {
      throw new SyntaxError(`Invalid character "${char}" at index ${i} for the Base58 alphabet`)
    }
    if (uniqueCharsLookup[char]) {
      throw new SyntaxError(`The character "${char}" at index ${i} is already in the alphabet`)
    }
    uniqueCharsLookup[char] = i
  }
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

ObjectDefineProperties(Base58, {
  ALPHABET: {
    value: ALPHABET
  },
  DARKWOLF_ALPHABET: {
    value: DARKWOLF_ALPHABET
  },
  isBase58: {
    value: isBase58
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

module.exports = Base58
