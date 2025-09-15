import { mkdir, stat, appendFile, readFile } from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'

export type PersistedLogLine = {
  data: string
  stream: 'stdout' | 'stderr'
  timestamp: number
}

const BASE_DIR = process.env.LOGS_DIR || path.join(process.cwd(), 'logs')

function getLogFilePath(sandboxId: string, cmdId: string) {
  const dir = path.join(BASE_DIR, sandboxId)
  const file = path.join(dir, `${cmdId}.ndjson`)
  return { dir, file }
}

export async function appendLog(
  sandboxId: string,
  cmdId: string,
  line: PersistedLogLine
) {
  const { dir, file } = getLogFilePath(sandboxId, cmdId)
  try {
    await stat(dir)
  } catch {
    await mkdir(dir, { recursive: true })
  }
  const payload = JSON.stringify(line) + "\n"
  await appendFile(file, payload, { encoding: 'utf8' })
}

export async function hasLogs(sandboxId: string, cmdId: string) {
  const { file } = getLogFilePath(sandboxId, cmdId)
  try {
    await stat(file)
    return true
  } catch {
    return false
  }
}

export function readLogsStream(sandboxId: string, cmdId: string) {
  const { file } = getLogFilePath(sandboxId, cmdId)
  return createReadStream(file, { encoding: 'utf8' })
}

export async function readLogsText(sandboxId: string, cmdId: string) {
  const { file } = getLogFilePath(sandboxId, cmdId)
  return readFile(file, { encoding: 'utf8' })
}


