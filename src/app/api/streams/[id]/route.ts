import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action } = body

    const stream = await db.stream.findUnique({
      where: { id: params.id }
    })

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 })
    }

    let updatedStream

    switch (action) {
      case 'start':
        updatedStream = await db.stream.update({
          where: { id: params.id },
          data: {
            status: 'STARTING',
            isLive: true,
            startTime: new Date()
          },
          include: {
            adMarkers: true,
            analytics: true
          }
        })
        
        // Simulate stream starting process
        setTimeout(async () => {
          await db.stream.update({
            where: { id: params.id },
            data: { status: 'LIVE' }
          })
        }, 2000)
        break

      case 'stop':
        updatedStream = await db.stream.update({
          where: { id: params.id },
          data: {
            status: 'STOPPING'
          },
          include: {
            adMarkers: true,
            analytics: true
          }
        })
        
        // Simulate stream stopping process
        setTimeout(async () => {
          await db.stream.update({
            where: { id: params.id },
            data: {
              status: 'OFFLINE',
              isLive: false,
              viewerCount: 0,
              endTime: new Date()
            }
          })
        }, 2000)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(updatedStream)
  } catch (error) {
    console.error('Error updating stream:', error)
    return NextResponse.json({ error: 'Failed to update stream' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.stream.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting stream:', error)
    return NextResponse.json({ error: 'Failed to delete stream' }, { status: 500 })
  }
}