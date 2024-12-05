const fs = require('node:fs')
const path = require('node:path')
const Arborist = require('../')

const printTree = require('./lib/print-tree.js')
const log = require('./lib/logging.js')

const printDiff = diff => {
  const { depth } = require('treeverse')
  depth({
    tree: diff,
    visit: d => {
      if (d.location === '') {
        return
      }
      switch (d.action) {
        case 'REMOVE':
          log.info('REMOVE', d.actual.location)
          break
        case 'ADD':
          log.info('ADD', d.ideal.location, d.ideal.resolved)
          break
        case 'CHANGE':
          log.info('CHANGE', d.actual.location, {
            from: d.actual.resolved,
            to: d.ideal.resolved,
          })
          break
      }
    },
    getChildren: d => d.children,
  })
}

module.exports = async (options, time) => {
  // Check for package.json
  if (!fs.existsSync(path.join(options.path, 'package.json'))) {
    log.error('No package.json found in the current directory.')
    log.error('Please navigate to the correct directory or run npm init.')
    throw new Error('Aborted due to missing package.json')
  }

  const arb = new Arborist(options)
  const { timing, result: tree } = await arb.reify(options).then(time)

  printTree(tree)
  if (options.dryRun) {
    printDiff(arb.diff)
  }
  if (tree.meta && options.save) {
    await tree.meta.save()
  }
  return `resolved ${tree.inventory.size} deps in ${timing.seconds}`
}
