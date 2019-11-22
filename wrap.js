'use strict'
const wrapAnsi = require('wrap-ansi')

function wrap([content, index], cols) {
  const wrapped = wrapAnsi(content, cols, {
    trim: false,
    hard: true,
    wordWrap: false,
  })
  return [wrapped, index]
}

module.exports = wrap
