'use strict'
const indent = require('indent-string')
const style = require('./style')

function print(input, options = {}) {
  let {expanded} = options
  const index = new Map()
  let row = 0

  function doPrint(v, path = '') {
    index.set(row, path)

    const eol = () => {
      row++
      return '\n'
    }

    if (typeof v === 'undefined') {
      return void 0
    }

    if (v === null) {
      return style.null('null')
    }

    if (typeof v === 'number' && Number.isFinite(v)) {
      return style.number(JSON.stringify(v))
    }

    if (typeof v === 'boolean') {
      return style.boolean(JSON.stringify(v))
    }

    if (typeof v === 'string') {
      return style.string(JSON.stringify(v))
    }

    if (Array.isArray(v)) {
      let output = style.bracket('[')
      const len = v.length

      if (len > 0) {
        if (expanded && !expanded.has(path)) {
          output += '\u2026'
        } else {
          output += eol()
          let i = 0
          for (let item of v) {
            const value = typeof item === 'undefined' ? null : item // JSON.stringify compatibility
            output += indent(doPrint(value, path + '[' + i + ']'), style.indent)
            output += i++ < len - 1 ? style.comma(',') : ''
            output += eol()
          }
        }
      }

      return output + style.bracket(']')
    }

    if (typeof v === 'object' && v.constructor === Object) {
      let output = style.bracket('{')

      const entries = Object.entries(v).filter(([key, value]) => typeof value !== 'undefined') // JSON.stringify compatibility
      const len = entries.length

      if (len > 0) {
        if (expanded && !expanded.has(path)) {
          output += '\u2026'
        } else {
          output += eol()
          let i = 0
          for (let [key, value] of entries) {
            const keyValue = style.key(JSON.stringify(key))
              + style.colon(':') + ' '
              + doPrint(value, path + '.' + key)

            output += indent(keyValue, style.indent)
            output += i++ < len - 1 ? style.comma(',') : ''
            output += eol()
          }
        }
      }

      return output + style.bracket('}')
    }

    return JSON.stringify(v, null, style.space)
  }

  return [doPrint(input), index]
}

module.exports = print
