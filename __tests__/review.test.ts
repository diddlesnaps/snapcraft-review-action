// -*- mode: javascript; js-indent-level: 2 -*-

import * as fs from 'fs'
import * as path from 'path'
import * as exec from '@actions/exec'
import * as review from '../src/review'
import * as tools from '../src/tools'

test('SnapReviewer.validate validates inputs', async () => {
  expect.assertions(3)

  const existingSnap = path.join(__dirname, '..', 'README.md')
  const missingSnap = path.join(__dirname, 'no-such-snap.snap')

  // No error on valid inputs
  let reviewer = new review.SnapReviewer(existingSnap, existingSnap, existingSnap, true)
  await reviewer.validate()

  // Missing plugs declaration file
  reviewer = new review.SnapReviewer(existingSnap, missingSnap, existingSnap, true)
  await expect(reviewer.validate()).rejects.toThrow(`cannot read plugs declaration file "${missingSnap}"`)

  // Missing slots declaration file
  reviewer = new review.SnapReviewer(existingSnap, existingSnap, missingSnap, true)
  await expect(reviewer.validate()).rejects.toThrow(`cannot read slots declaration file "${missingSnap}"`)

  // Missing snap
  reviewer = new review.SnapReviewer(missingSnap, existingSnap, existingSnap, true)
  await expect(reviewer.validate()).rejects.toThrow(
    `cannot read snap file "${missingSnap}"`
  )
})

test('SnapReviewer.review reviews the snap', async () => {
  expect.assertions(3)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureReviewTools = jest
    .spyOn(tools, 'ensureReviewTools')
    .mockImplementation(async (): Promise<void> => {})
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  const reviewer = new review.SnapReviewer(
    'filename.snap',
    '',
    '',
    false
  )
  await reviewer.review()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureReviewTools).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith('review-tools.snap-review', ['filename.snap'])
})

test('SnapReviewer.review reviews the snap for classic', async () => {
  expect.assertions(3)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureReviewTools = jest
    .spyOn(tools, 'ensureReviewTools')
    .mockImplementation(async (): Promise<void> => {})
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  const reviewer = new review.SnapReviewer(
    'filename.snap',
    '',
    '',
    true
  )
  await reviewer.review()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureReviewTools).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith('review-tools.snap-review', ['--allow-classic', 'filename.snap'])
})

test('SnapReviewer.review reviews the snap with plugs declaration', async () => {
  expect.assertions(3)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureReviewTools = jest
    .spyOn(tools, 'ensureReviewTools')
    .mockImplementation(async (): Promise<void> => {})
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  const reviewer = new review.SnapReviewer(
    'filename.snap',
    'plugs.json',
    '',
    false
  )
  await reviewer.review()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureReviewTools).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith('review-tools.snap-review', ['--plugs', 'plugs.json', 'filename.snap'])
})

test('SnapReviewer.review reviews the snap with slots declaration', async () => {
  expect.assertions(3)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureReviewTools = jest
    .spyOn(tools, 'ensureReviewTools')
    .mockImplementation(async (): Promise<void> => {})
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  const reviewer = new review.SnapReviewer(
    'filename.snap',
    '',
    'slots.json',
    false
  )
  await reviewer.review()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureReviewTools).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith('review-tools.snap-review', ['--slots', 'slots.json', 'filename.snap'])
})

test('SnapReviewer.review reviews the snap with plugs & slots declaration', async () => {
  expect.assertions(3)

  const ensureSnapd = jest
    .spyOn(tools, 'ensureSnapd')
    .mockImplementation(async (): Promise<void> => {})
  const ensureReviewTools = jest
    .spyOn(tools, 'ensureReviewTools')
    .mockImplementation(async (): Promise<void> => {})
  const execMock = jest.spyOn(exec, 'exec').mockImplementation(
    async (program: string, args?: string[]): Promise<number> => {
      return 0
    }
  )

  const reviewer = new review.SnapReviewer(
    'filename.snap',
    'plugs.json',
    'slots.json',
    false
  )
  await reviewer.review()

  expect(ensureSnapd).toHaveBeenCalled()
  expect(ensureReviewTools).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith('review-tools.snap-review', ['--plugs', 'plugs.json', '--slots', 'slots.json', 'filename.snap'])
})
