// -*- mode: javascript; js-indent-level: 2 -*-

import * as exec from '@actions/exec'
import fs = require('fs')
import * as tools from '../src/tools'

afterEach(() => {
  jest.restoreAllMocks()
})

test('ensureSnapd installs snapd if needed', async () => {
  expect.assertions(4)

  const accessMock = jest
    .spyOn(fs.promises, 'access')
    .mockImplementation(
      async (
        filename: fs.PathLike,
        mode?: number | undefined
      ): Promise<void> => {
        throw new Error('not found')
      }
    )
  const statMock = jest
    .spyOn(fs.promises, 'stat')
    .mockImplementation(async (filename: fs.PathLike): Promise<fs.Stats> => {
      const s = new fs.Stats()
      s.uid = 0
      s.gid = 0
      return s
    })
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  await tools.ensureSnapd()

  expect(accessMock).toHaveBeenCalled()
  expect(statMock).toHaveBeenCalled()
  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    'apt-get',
    'update',
    '-q'
  ])
  expect(execMock).toHaveBeenNthCalledWith(2, 'sudo', [
    'apt-get',
    'install',
    '-qy',
    'snapd'
  ])
})

test('ensureSnapd is a no-op if snapd is installed', async () => {
  expect.assertions(3)

  const accessMock = jest
    .spyOn(fs.promises, 'access')
    .mockImplementation(
      async (
        filename: fs.PathLike,
        mode?: number | undefined
      ): Promise<void> => {}
    )
  const statMock = jest
    .spyOn(fs.promises, 'stat')
    .mockImplementation(async (filename: fs.PathLike): Promise<fs.Stats> => {
      const s = new fs.Stats()
      s.uid = 0
      s.gid = 0
      return s
    })
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  await tools.ensureSnapd()

  expect(accessMock).toHaveBeenCalled()
  expect(statMock).toHaveBeenCalled()
  expect(execMock).not.toHaveBeenCalled()
})

test('ensureSnapd fixes permissions on the root directory', async () => {
  expect.assertions(3)

  const accessMock = jest
    .spyOn(fs.promises, 'access')
    .mockImplementation(
      async (
        filename: fs.PathLike,
        mode?: number | undefined
      ): Promise<void> => {}
    )
  const statMock = jest
    .spyOn(fs.promises, 'stat')
    .mockImplementation(async (filename: fs.PathLike): Promise<fs.Stats> => {
      const s = new fs.Stats()
      s.uid = 500
      s.gid = 0
      return s
    })
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  await tools.ensureSnapd()

  expect(accessMock).toHaveBeenCalled()
  expect(statMock).toHaveBeenCalled()
  expect(execMock).toHaveBeenCalledWith('sudo', ['chown', 'root:root', '/'])
})

test('ensureReviewTools installs Review Tools if needed', async () => {
  expect.assertions(2)

  const accessMock = jest
    .spyOn(fs.promises, 'access')
    .mockImplementation(
      async (
        filename: fs.PathLike,
        mode?: number | undefined
      ): Promise<void> => {
        throw new Error('not found')
      }
    )
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  await tools.ensureReviewTools()

  expect(accessMock).toHaveBeenCalled()
  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    'snap',
    'install',
    'review-tools'
  ])
})

test('ensureReviewTools is a no-op if Review Tools is installed', async () => {
  expect.assertions(2)

  const accessMock = jest
    .spyOn(fs.promises, 'access')
    .mockImplementation(
      async (
        filename: fs.PathLike,
        mode?: number | undefined
      ): Promise<void> => {
        return
      }
    )
  const execMock = jest
    .spyOn(exec, 'exec')
    .mockImplementation(
      async (program: string, args?: string[]): Promise<number> => {
        return 0
      }
    )

  await tools.ensureReviewTools()

  expect(accessMock).toHaveBeenCalled()
  expect(execMock).not.toHaveBeenCalled()
})
