# Base58
## Install
`npm i --save @darkwolf/base58`
## Usage
```javascript
// ECMAScript
import Base58 from '@darkwolf/base58'
// CommonJS
const Base58 = require('@darkwolf/base58')

// Number Encoding
const integer = Number.MAX_SAFE_INTEGER // => 9007199254740991
const encodedInt = Base58.encodeInt(integer) // => '2DLNrMSKug'
const decodedInt = Base58.decodeInt(encodedInt) // => 9007199254740991

const negativeInteger = -integer // => -9007199254740991
const encodedNegativeInt = Base58.encodeInt(negativeInteger) // => '-2DLNrMSKug'
const decodedNegativeInt = Base58.decodeInt(encodedNegativeInt) // => -9007199254740991

// BigInt Encoding
const bigInt = BigInt(Number.MAX_VALUE) // => 179769313486231570814527423731704356798070567525844996598917476803157260780028538760589558632766878171540458953514382464234321326889464182768467546703537516986049910576551282076245490090389328944075868508455133942304583236903222948165808559332123348274797826204144723168738177180919299881250404026184124858368n
const encodedBigInt = Base58.encodeBigInt(bigInt) // => 'TCQK6EStJJFRT5mocK94qjPbLcHsyGYEcv2bSnJG6E4DJExMT7t2evaWif2UdjBzMW2mc8DBzMvPnog84qpBGuKfTRUqBxcPpi1KuA3qB9ee7hHwMoDJmZz26J8RTFPhYQvegn4dffqS5Ju2JF5W5Em7uS78WE8usBwLCpUYKpGGAmV'
const decodedBigInt = Base58.decodeBigInt(encodedBigInt) // => 179769313486231570814527423731704356798070567525844996598917476803157260780028538760589558632766878171540458953514382464234321326889464182768467546703537516986049910576551282076245490090389328944075868508455133942304583236903222948165808559332123348274797826204144723168738177180919299881250404026184124858368n

const negativeBigInt = -bigInt // => -179769313486231570814527423731704356798070567525844996598917476803157260780028538760589558632766878171540458953514382464234321326889464182768467546703537516986049910576551282076245490090389328944075868508455133942304583236903222948165808559332123348274797826204144723168738177180919299881250404026184124858368n
const encodedNegativeBigInt = Base58.encodeBigInt(negativeBigInt) // => '-TCQK6EStJJFRT5mocK94qjPbLcHsyGYEcv2bSnJG6E4DJExMT7t2evaWif2UdjBzMW2mc8DBzMvPnog84qpBGuKfTRUqBxcPpi1KuA3qB9ee7hHwMoDJmZz26J8RTFPhYQvegn4dffqS5Ju2JF5W5Em7uS78WE8usBwLCpUYKpGGAmV'
const decodedNegativeBigInt = Base58.decodeBigInt(encodedNegativeBigInt) // => -179769313486231570814527423731704356798070567525844996598917476803157260780028538760589558632766878171540458953514382464234321326889464182768467546703537516986049910576551282076245490090389328944075868508455133942304583236903222948165808559332123348274797826204144723168738177180919299881250404026184124858368n

// Text Encoding
const text = 'Ave, Darkwolf!'
const encodedText = Base58.encodeText(text) // => 'R4qoy4gqDX4ohE7qp7i'
const decodedText = Base58.decodeText(encodedText) // => 'Ave, Darkwolf!'

const emojis = '🐺🐺🐺'
const encodedEmojis = Base58.encodeText(emojis) // => '5YN9We97aSqpNeq13'
const decodedEmojis = Base58.decodeText(encodedEmojis) // => '🐺🐺🐺'

// Buffer Encoding
const buffer = Uint8Array.of(0x00, 0x02, 0x04, 0x08, 0x0f, 0x1f, 0x3f, 0x7f, 0xff) // => <Uint8Array 00 02 04 08 0f 1f 3f 7f ff>
const encodedBuffer = Base58.encode(buffer) // => <Uint8Array 31 4c 5a 43 78 72 75 44 44 4c 32>
const decodedBuffer = Base58.decode(encodedBuffer) // => <Uint8Array 00 02 04 08 0f 1f 3f 7f ff>

const encodedBufferToString = Base58.encodeToString(buffer) // => '1LZCxruDDL2'
const decodedBufferFromString = Base58.decodeFromString(encodedBufferToString) // => <Uint8Array 00 02 04 08 0f 1f 3f 7f ff>

// Custom Alphabet
const dw58 = new Base58('AveDarkwo1f23456789BCEFGHJKLMNPQRSTUVWXYZbcdghijmnpqstuxyz')

const encInt = dw58.encodeInt(integer) // => 'v3BEnCJ9sY'
const decInt = dw58.decodeInt(encInt) // => 9007199254740991

const encNegativeInt = dw58.encodeInt(negativeInteger) // => '-v3BEnCJ9sY'
const decNegativeInt = dw58.decodeInt(encNegativeInt) // => -9007199254740991

const encBigInt = dw58.encodeBigInt(bigInt) // 'K2G9r4Jq885HKagiU9oDmcFTBU7py6Q4UtvTJh86r4D384xCKkqvWtSNbXvLVcfzCNvgUw3fzCtFhiYwDmjf6s9XKHLmfxUFjbA9s1emfoWWkZ7uCi38gRzvr8wHK5FZQGtWYhDVXXmJa8sv85aNa4gksJkwN4wspfuB2jLQ9j661gM'
const decBigInt = dw58.decodeBigInt(encBigInt) // => 179769313486231570814527423731704356798070567525844996598917476803157260780028538760589558632766878171540458953514382464234321326889464182768467546703537516986049910576551282076245490090389328944075868508455133942304583236903222948165808559332123348274797826204144723168738177180919299881250404026184124858368n

const encNegativeBigInt = dw58.encodeBigInt(negativeBigInt) // => '-K2G9r4Jq885HKagiU9oDmcFTBU7py6Q4UtvTJh86r4D384xCKkqvWtSNbXvLVcfzCNvgUw3fzCtFhiYwDmjf6s9XKHLmfxUFjbA9s1emfoWWkZ7uCi38gRzvr8wHK5FZQGtWYhDVXXmJa8sv85aNa4gksJkwN4wspfuB2jLQ9j661gM'
const decNegativeBigInt = dw58.decodeBigInt(encNegativeBigInt) // => -179769313486231570814527423731704356798070567525844996598917476803157260780028538760589558632766878171540458953514382464234321326889464182768467546703537516986049910576551282076245490090389328944075868508455133942304583236903222948165808559332123348274797826204144723168738177180919299881250404026184124858368n

const encText = dw58.encodeText(text) // => 'HDmiyDYm3PDiZ4kmjkb'
const decText = dw58.decodeText(encText) // => 'Ave, Darkwolf!'

const encEmojis = dw58.encodeText(emojis) // => 'aQEoNWokSJmjEWmAe'
const decEmojis = dw58.decodeText(encEmojis) // => '🐺🐺🐺'

const encBuffer = dw58.encode(buffer) // => <Uint8Array 41 42 52 32 78 6e 73 33 33 42 76>
const decBuffer = dw58.decode(encBuffer) // => <Uint8Array 00 02 04 08 0f 1f 3f 7f ff>

const encBufferToString = dw58.encodeToString(buffer) // => 'ABR2xns33Bv'
const decBufferFromString = dw58.decodeFromString(encBufferToString) // => <Uint8Array 00 02 04 08 0f 1f 3f 7f ff>
```
## [API Documentation](https://github.com/Darkwolf/node-base58/blob/master/docs/API.md)
## Contact Me
#### GitHub: [@PavelWolfDark](https://github.com/PavelWolfDark)
#### Telegram: [@PavelWolfDark](https://t.me/PavelWolfDark)
#### Email: [PavelWolfDark@gmail.com](mailto:PavelWolfDark@gmail.com)
