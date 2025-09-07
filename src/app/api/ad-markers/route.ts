import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const streamId = searchParams.get('streamId')

    const where = streamId ? { streamId } : {}
    
    const adMarkers = await db.adMarker.findMany({
      where,
      include: {
        stream: true
      },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json(adMarkers)
  } catch (error) {
    console.error('Error fetching ad markers:', error)
    return NextResponse.json({ error: 'Failed to fetch ad markers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { streamId, startTime, duration, adType, description, cueId } = body

    if (!streamId || !startTime || !duration) {
      return NextResponse.json({ 
        error: 'Stream ID, start time, and duration are required' 
      }, { status: 400 })
    }

    const stream = await db.stream.findUnique({
      where: { id: streamId }
    })

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
    }

    const adMarker = await db.adMarker.create({
      data: {
        streamId,
        startTime,
        duration,
        adType: adType || 'PROGRAM',
        description,
        cueId: cueId || `cue-${Date.now()}`
      },
      include: {
        stream: true
      }
    })

    return NextResponse.json(adMarker, { status: 201 })
  } catch (error) {
    console.error('Error creating ad marker:', error)
    return NextResponse.json({ error: 'Failed to create ad marker' }, { status: 500 })
  }
}