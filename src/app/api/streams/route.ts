import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const streams = await db.stream.findMany({
      include: {
        adMarkers: true,
        analytics: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(streams)
  } catch (error) {
    console.error('Error fetching streams:', error)
    return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, streamKey, externalSrtUrl, externalRtmpUrl } = body

    if (!name) {
      return NextResponse.json({ error: 'Stream name is required' }, { status: 400 })
    }

    const finalStreamKey = streamKey || `stream-${Date.now()}`
    
    const stream = await db.stream.create({
      data: {
        name,
        description,
        streamKey: finalStreamKey,
        srtUrl: `srt://localhost:9999?streamid=${finalStreamKey}`,
        rtmpUrl: `rtmp://localhost:1935/live/${finalStreamKey}`,
        externalSrtUrl,
        externalRtmpUrl,
        status: 'OFFLINE'
      },
      include: {
        adMarkers: true,
        analytics: true
      }
    })

    return NextResponse.json(stream, { status: 201 })
  } catch (error) {
    console.error('Error creating stream:', error)
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 })
  }
}