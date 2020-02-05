// -*- mode: javascript; js-indent-level: 2 -*-

import * as core from '@actions/core'
import {SnapReviewer} from './review'

async function run(): Promise<void> {
  try {
    const snapFile: string = core.getInput('snap')
    const plugs: string = core.getInput('plugs')
    const slots: string = core.getInput('slots')
    const isClassic: boolean =
      core.getInput('isClassic') === 'true' ? true : false
    core.info(`Reviewing snap "${snapFile}"...`)

    const reviewer = new SnapReviewer(snapFile, plugs, slots, isClassic)
    await reviewer.validate()
    await reviewer.review()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
