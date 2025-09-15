import { NextRequest, NextResponse } from 'next/server'
import { appendLog, hasLogs, readLogsStream, type PersistedLogLine } from '@/lib/log-store'
import z from 'zod/v3'

const appendSchema = z.object({
  data: z.string(),
  stream: z.enum(['stdout', 'stderr']),
  timestamp: z.number(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sandboxId: string; cmdId: string }> }
) {
  const { sandboxId, cmdId } = await params
  const body = await request.json().catch(() => null)
  const parsed = appendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  await appendLog(sandboxId, cmdId, parsed.data as PersistedLogLine)
  return NextResponse.json({ ok: true })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sandboxId: string; cmdId: string }> }
) {
  const { sandboxId, cmdId } = await params
  const exists = await hasLogs(sandboxId, cmdId)
  if (!exists) {
    return NextResponse.json({ error: 'No logs found' }, { status: 404 })
  }

  const stream = readLogsStream(sandboxId, cmdId)
  const reader = stream as unknown as ReadableStream

  return new NextResponse(reader, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  })
}


