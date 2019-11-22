'use strict'
const fs = require('fs')
const tty = require('tty')
const blessed = require('@medv/blessed')
const stringWidth = require('string-width')
const reduce = require('./reduce')
const print = require('./print')
const wrap = require('./wrap')
const find = require('./find')
const config = require('./style')

module.exports = function start(filename, json) {
  const source = json // Full, original input JSON object.
  let current = json // Current rendered object on a screen.

  // Contains map from row number to expand path.
  // Example: {0: '', 1: '.foo', 2: '.foo[0]'}
  let index = new Map()

  // Contains expanded paths. Example: ['', '.foo']
  // Empty string represents root path.
  const expanded = new Set()
  expanded.add('')

  // Reopen tty
  let input, output

  if (process.platform === 'win32') {
    const cfs = process.binding('fs')
    input = tty.ReadStream(cfs.open('conin$', fs.constants.O_RDWR | fs.constants.O_EXCL, 0o666))
    output = tty.WriteStream(cfs.open('conout$', fs.constants.O_RDWR | fs.constants.O_EXCL, 0o666))
  } else {
    const ttyFd = fs.openSync('/dev/tty', 'r+')
    input = tty.ReadStream(ttyFd)
    output = tty.WriteStream(ttyFd)
  }

  const program = blessed.program({
    input,
    output,
    tput: true,
    buffer: true,
  })

  // Init screen.
  program.alternateBuffer()
  program.put.keypad_xmit()
  program.hideCursor()
  program.enableMouse()
  program.cursorPos(0, 0)
  if (program.tput.strings.ena_acs) {
    // We need this for tmux now.
    program._write(program.tput.enacs())
  }

  program.on('keypress', (ch, e) => {
    console.error(ch, e)
    if (e.full === 'C-c' || e.full === 'q') {
      process.exit(0)
    }
  })

  // program.on('mouse', (e) => {
  //   console.error('mouse', e)
  // })

  program.on('resize', () => {
    console.error('resize', program.cols, program.rows)
    render()
  })
  console.error(program.output.isTTY)

    function expandAll() {
    expanded.clear()
    for (let path of dfs(json)) {
      if (expanded.size < 1000) {
        expanded.add(path)
      } else {
        break
      }
    }

  }

  function render() {
    let content
    [content, index] = wrap(print(current), program.cols / 2)

    console.error(index)

    if (typeof content === 'undefined') {
      content = 'undefined'
    }

    program._write(content)
  }

  render()

  process.on('uncaughtException', err => {
    console.error(err.stack ? `${err.stack}` : `${err}`)
    process.nextTick(function () {
      process.exit(1)
    })
  });

  ['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(signal => {
    process.on(signal, () => {
      process.nextTick(() => {
        process.exit(0)
      })
    })
  })

  process.on('exit', () => {
    console.error('bye ')
    program.put.keypad_local()
    program.showCursor()
    program.disableMouse()
    program.normalBuffer()
    program.flush()
  })
}

function* dfs(v, path = '') {
  if (!v) {
    return
  }

  if (Array.isArray(v)) {
    yield path
    let i = 0
    for (let item of v) {
      yield* dfs(item, path + '[' + (i++) + ']')
    }
  }

  if (typeof v === 'object' && v.constructor === Object) {
    yield path
    for (let [key, value] of Object.entries(v)) {
      yield* dfs(value, path + '.' + key)
    }
  }
}

