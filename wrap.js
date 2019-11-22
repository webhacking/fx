'use strict'
const wrapAnsi = require('wrap-ansi')
const ansiRegex = require('ansi-regex')


function wrap([content, index], cols) {
  let entries = [...index.entries()]

  function update(fromRow, offset) {
    entries = entries.map(([row, path]) => {
      if (row > fromRow) {
        return [row + offset, path]
      }
      return [row, path]
    })
  }

  let output = ''
  let row = 0
  for (let line of content.split('\n')) {
    let wrapped = wrapAnsi(line, cols, {
      trim: false,
      hard: true,
      wordWrap: false,
    })
    const count = countNewlines(wrapped)
    update(row, count)
    row += count + 1
    output += wrapped + '\n'
  }
  return [output, new Map(entries)]
}

function countNewlines(s) {
  let count = 0
  for (let ch of s) {
    if (ch === '\n') {
      count++
    }
  }
  return count
}

module.exports = wrap
