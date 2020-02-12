// -*- mode: javascript; js-indent-level: 2 -*-

import {spawn} from 'node-pty'
import * as core from '@actions/core'
import * as tools from './tools'

// Importing as an ECMAScript Module blocks access to fs.promises:
//   https://github.com/nodejs/node/issues/21014
import fs = require('fs') // eslint-disable-line @typescript-eslint/no-require-imports
interface singleResult {
  manual_review: boolean,
  text: string,
}
interface reviewResults {
  [id: string]: singleResult,
}
interface reviewOutput {
  [id: string]: {
    error: reviewResults,
    info: reviewResults,
    warn: reviewResults,
  }
}

export class SnapReviewer {
  snapFile: string
  plugsDeclFile: string
  slotsDeclFile: string
  allowClassic: boolean

  constructor(
    snapFile: string,
    plugsDeclFile: string,
    slotsDeclFile: string,
    allowClassic: boolean
  ) {
    this.snapFile = snapFile
    this.plugsDeclFile = plugsDeclFile
    this.slotsDeclFile = slotsDeclFile
    this.allowClassic = allowClassic
  }

  async validate(): Promise<void> {
    try {
      await fs.promises.access(this.snapFile, fs.constants.R_OK)
    } catch (error) {
      throw new Error(`cannot read snap file "${this.snapFile}"`)
    }
    try {
      if (this.plugsDeclFile) {
        await fs.promises.access(this.plugsDeclFile, fs.constants.R_OK)
      }
    } catch {
      throw new Error(
        `cannot read plugs declaration file "${this.plugsDeclFile}"`
      )
    }
    try {
      if (this.slotsDeclFile) {
        await fs.promises.access(this.slotsDeclFile, fs.constants.R_OK)
      }
    } catch {
      throw new Error(
        `cannot read slots declaration file "${this.slotsDeclFile}"`
      )
    }
  }

  async runReviewTools(): Promise<void> {
    let myOutput = '';

    const args: string[] = ['--json']
    if (this.plugsDeclFile) {
      args.push('--plugs', this.plugsDeclFile)
    }
    if (this.slotsDeclFile) {
      args.push('--slots', this.slotsDeclFile)
    }
    if (this.allowClassic) {
      args.push('--allow-classic')
    }
    args.push(this.snapFile)

    let snapcraftFile = ''
    try {
      await fs.promises.access('./snap/snapcraft.yaml')
      snapcraftFile = './snap/snapcraft.yaml'
    } catch {
      try {
        await fs.promises.access('./snapcraft.yaml')
        snapcraftFile = './snapcraft.yaml'
      } catch {
        try {
          await fs.promises.access('./.snapcraft.yaml')
          snapcraftFile = './.snapcraft.yaml'
        } catch {
          throw new Error(`Cannot find snapcraft.yaml file`)
        }
      }
    }

    const buffer = await fs.promises.readFile(snapcraftFile)
    const yamlString = buffer.toString()
    const yamlLines = yamlString.split("\n")

    await new Promise((resolve, reject) => {
      const proc = spawn('review-tools.snap-review', args, {})
      proc.on('data', (data) => {
        myOutput += data
      })
      proc.on('exit', (code) => {
        resolve(code)
      })
    })

    const json:reviewOutput = JSON.parse(myOutput);
    for (let tests of Object.values(json)) {
      if (tests.error) {
        for (let [key, value] of Object.entries(tests.error)) {
          if (value.manual_review) {
            const parts = key.split(':')
            let line = 0, col = 0
            switch(parts[0]) {
              case 'msg':
                core.error(`${value.text}`)
                break
              case 'declaration-snap-v2':
                switch(parts[1]) {
                  case 'plugs_connection':
                  case 'plugs_installation':
                    ({line, col} = this.getYamlSlotOrPlugLocation(yamlLines, 'plugs', parts[3]))
                    break
                  case 'slots_connection':
                    ({line, col} = this.getYamlSlotOrPlugLocation(yamlLines, 'slots', parts[3]))
                    break
                }
                core.error(`file=${snapcraftFile},line=${line + 1},col=${col + 1}::${value.text}`)
                break
              case 'lint-snap-v2':
                switch(parts[1]) {
                  case 'snap_type_redflag':
                    switch(value.text) {
                      case "(NEEDS REVIEW) type 'base' not allowed":
                      case "(NEEDS REVIEW) type 'os' not allowed":
                      case "(NEEDS REVIEW) type 'gadget' not allowed":
                        ({line, col} = this.getYamlKeyValueLocation(yamlLines, 'type', '\\w+'))
                        break
                    }
                    break
                  case 'base_interfaces':
                    switch(value.text) {
                      case "'plugs' not allowed with base snaps":
                        ({line, col} = this.getYamlKeyValueLocation(yamlLines, 'plugs', '.*?'))
                        break
                      case "'slots' not allowed with base snaps":
                        ({line, col} = this.getYamlKeyValueLocation(yamlLines, 'slots', '.*?'))
                        break
                    }
                    break
                  case 'base_allowed':
                    ({line, col} = this.getYamlKeyValueLocation(yamlLines, 'base', '\\w+'))
                    break
                  case 'confinement_classic':
                    ({line, col} = this.getYamlKeyValueLocation(yamlLines, 'confinement', 'classic'))
                    break
                }
                core.error(`file=${snapcraftFile},line=${line + 1},col=${col + 1}::${value.text}`)
                break
            }
          }
        }
      }
    }
  }

  getYamlKeyValueLocation(yaml: Array<string>, key: string, value: string) {
    let re = new RegExp(`^${key}:\\s*("?)${value}\\1$`)
    let line = yaml.findIndex((value, index, []) => {
      if (value.match(re)) {
        return index
      }
    })
    return {line, col: 0}
  }

  getYamlSlotOrPlugLocation(yaml: Array<string>, key: string, item: string) {
    let keyRe = new RegExp(`(^("?)${key}\\2:|(\\{|,)\\s*("?)${key}\\4:)`)
    let itemRe = new RegExp(`(^\\s+("?)interface\\2\\s*:\\s*("?)${item}\\3|,\\s*("?)interface\\4\\s*:\\s*("?)${item}\\5)`)

    let line = yaml.findIndex((value, index, []) => {
      if (value.match(keyRe)) {
        return index
      }
    })

    let iter = line
    do {
      if (yaml[iter].match(itemRe)) {
        let col = yaml[iter].search(itemRe);
        do {
          if (![' ', "\t", ',', '{'].includes(yaml[iter].charAt(col))) {
            break
          }
        } while (++col < yaml[iter].length)
        return {
          line: iter,
          col,
        }
      }
    } while (++iter < yaml.length && yaml[iter].match(/^\s+/))

    return {
      line,
      col: 0,
    }
  }

  async review(): Promise<void> {
    await tools.ensureSnapd()
    await tools.ensureReviewTools()
    await this.runReviewTools()
  }
}
