import * as exec from '@actions/exec'
import * as tools from './tools'

// Importing as an ECMAScript Module blocks access to fs.promises:
//   https://github.com/nodejs/node/issues/21014
import fs = require('fs') // eslint-disable-line @typescript-eslint/no-require-imports

export class SnapReviewer {
    snapFile: string
    plugsDeclFile: string
    slotsDeclFile: string
    allowClassic: boolean

    constructor(snapFile: string, plugsDeclFile: string, slotsDeclFile: string, allowClassic: boolean) {
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
            throw new Error(`cannot read plugs declaration file "${this.plugsDeclFile}"`)
        }
        try {
            if (this.slotsDeclFile) {
                await fs.promises.access(this.slotsDeclFile, fs.constants.R_OK)
            }
        } catch {
            throw new Error(`cannot read slots declaration file "${this.slotsDeclFile}"`)
        }
    }

    async runReviewTools(): Promise<void> {
        const args: string[] = []
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
        await exec.exec('review-tools.snap-review', args)

    }

    async review(): Promise<void> {
        await tools.ensureSnapd()
        await tools.ensureReviewTools()
        await this.runReviewTools()
    }
}