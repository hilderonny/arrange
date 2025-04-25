import { formatWithOptions } from 'node:util'

/**
 * Macht eine rote Logausgabe
 */
function error(...args) {
    console.warn(`\x1b[31m${formatWithOptions({ colors: true }, ...args)}\x1b[0m`)
}

/**
 * Macht eine normale formatierte Logausgabe
 */
function log(...args) {
    console.log(formatWithOptions({ colors: true }, ...args))
}

/**
 * Macht eine gelbe Logausgabe
 */
function warn(...args) {
    console.warn(`\x1b[33m${formatWithOptions({ colors: true }, ...args)}\x1b[0m`)
}

export { error, log, warn }