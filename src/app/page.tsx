"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Play, Square, Settings, BarChart3, Users, Activity, Radio, Plus, ExternalLink, Upload } from 'lucide-react'
import { useStreaming } from '@/hooks/use-streaming'

export default function StreamingDashboard() {
  const {
    streams,
    adMarkers,
    isConnected,
    viewerCounts,
    createStream,
    startExternalStream,
    stopExternalStream,
    deleteStream,
    createAdMarker,
    insertAdMarker,
    subscribeToStream,
    unsubscribeFromStream
  } = useStreaming()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAdMarkerDialogOpen, setIsAdMarkerDialogOpen] = useState(false)
  const [isStreamDialogOpen, setIsStreamDialogOpen] = useState<string | null>(null)
  const [newStream, setNewStream] = useState({
    name: '',
    description: '',
    streamKey: '',
    externalSrtUrl: '',
    externalRtmpUrl: ''
  })
  const [newAdMarker, setNewAdMarker] = useState({
    streamId: '',
    startTime: '',
    duration: '',
    adType: 'PROVIDER_ADVERTISEMENT',
    description: '',
    cueId: ''
  })
  const [streamConfig, setStreamConfig] = useState({
    inputUrl: '',
    outputUrl: '',
    bitrate: '',
    resolution: '',
    fps: ''
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'bg-green-500'
      case 'STARTING': return 'bg-yellow-500'
      case 'STOPPING': return 'bg-orange-500'
      case 'ERROR': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getAdTypeColor = (adType: string) => {
    switch (adType) {
      case 'PROGRAM': return 'bg-blue-500'
      case 'PROVIDER_ADVERTISEMENT': return 'bg-purple-500'
      case 'DISTRIBUTOR_ADVERTISEMENT': return 'bg-pink-500'
      case 'NETWORK_ADVERTISEMENT': return 'bg-indigo-500'
      case 'LOCAL_ADVERTISEMENT': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const handleCreateStream = async () => {
    try {
      await createStream(newStream)
      setNewStream({ 
        name: '', 
        description: '', 
        streamKey: '', 
        externalSrtUrl: '', 
        externalRtmpUrl: '' 
      })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating stream:', error)
    }
  }

  const handleStartExternalStream = async (streamId: string) => {
    try {
      const stream = streams.find(s => s.id === streamId)
      if (!stream) return

      const outputUrl = stream.externalSrtUrl || stream.externalRtmpUrl
      if (!outputUrl) {
        alert('Please configure external SRT or RTMP URL first')
        return
      }

      // For demo, we'll use a test input URL - in production this would come from OBS or other source
      const inputUrl = `rtmp://localhost:1935/live/${stream.streamKey}`
      
      await startExternalStream(streamId, inputUrl, outputUrl, {
        bitrate: streamConfig.bitrate ? parseInt(streamConfig.bitrate) : undefined,
        resolution: streamConfig.resolution || undefined,
        fps: streamConfig.fps ? parseInt(streamConfig.fps) : undefined
      })
      
      setIsStreamDialogOpen(null)
    } catch (error) {
      console.error('Error starting external stream:', error)
    }
  }

  const handleStopExternalStream = async (streamId: string) => {
    try {
      await stopExternalStream(streamId)
    } catch (error) {
      console.error('Error stopping external stream:', error)
    }
  }

  const handleDeleteStream = async (streamId: string) => {
    try {
      await deleteStream(streamId)
    } catch (error) {
      console.error('Error deleting stream:', error)
    }
  }

  const handleCreateAdMarker = async () => {
    try {
      await createAdMarker({
        streamId: newAdMarker.streamId,
        startTime: parseFloat(newAdMarker.startTime),
        duration: parseFloat(newAdMarker.duration),
        adType: newAdMarker.adType,
        description: newAdMarker.description,
        cueId: newAdMarker.cueId || undefined
      })
      setNewAdMarker({
        streamId: '',
        startTime: '',
        duration: '',
        adType: 'PROVIDER_ADVERTISEMENT',
        description: '',
        cueId: ''
      })
      setIsAdMarkerDialogOpen(false)
    } catch (error) {
      console.error('Error creating ad marker:', error)
    }
  }

  const handleInsertAdMarker = async (streamKey: string, marker: any) => {
    try {
      await insertAdMarker(streamKey, marker)
    } catch (error) {
      console.error('Error inserting ad marker:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Streaming Dashboard</h1>
          <p className="text-muted-foreground">Push your stream to external SRT servers with SCTE-35 ad markers</p>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected to streaming server' : 'Disconnected from streaming server'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Radio className="w-4 h-4 mr-2" />
                Create Stream
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Stream</DialogTitle>
                <DialogDescription>
                  Configure a stream to push to external SRT/RTMP servers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Stream Name</Label>
                  <Input
                    id="name"
                    value={newStream.name}
                    onChange={(e) => setNewStream({ ...newStream, name: e.target.value })}
                    placeholder="Enter stream name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newStream.description}
                    onChange={(e) => setNewStream({ ...newStream, description: e.target.value })}
                    placeholder="Enter stream description"
                  />
                </div>
                <div>
                  <Label htmlFor="streamKey">Stream Key (optional)</Label>
                  <Input
                    id="streamKey"
                    value={newStream.streamKey}
                    onChange={(e) => setNewStream({ ...newStream, streamKey: e.target.value })}
                    placeholder="Leave empty to auto-generate"
                  />
                </div>
                <div>
                  <Label htmlFor="externalSrtUrl">External SRT URL</Label>
                  <Input
                    id="externalSrtUrl"
                    value={newStream.externalSrtUrl}
                    onChange={(e) => setNewStream({ ...newStream, externalSrtUrl: e.target.value })}
                    placeholder="srt://distributor-server:9999?streamid=your-stream"
                  />
                </div>
                <div>
                  <Label htmlFor="externalRtmpUrl">External RTMP URL (optional)</Label>
                  <Input
                    id="externalRtmpUrl"
                    value={newStream.externalRtmpUrl}
                    onChange={(e) => setNewStream({ ...newStream, externalRtmpUrl: e.target.value })}
                    placeholder="rtmp://distributor-server:1935/live/your-stream"
                  />
                </div>
                <Button onClick={handleCreateStream} className="w-full">
                  Create Stream
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAdMarkerDialogOpen} onOpenChange={setIsAdMarkerDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Ad Marker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create SCTE-35 Ad Marker</DialogTitle>
                <DialogDescription>
                  Schedule an ad marker for your live stream
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="streamSelect">Stream</Label>
                  <Select onValueChange={(value) => setNewAdMarker({ ...newAdMarker, streamId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a stream" />
                    </SelectTrigger>
                    <SelectContent>
                      {streams.map((stream) => (
                        <SelectItem key={stream.id} value={stream.id}>
                          {stream.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startTime">Start Time (seconds)</Label>
                  <Input
                    id="startTime"
                    type="number"
                    value={newAdMarker.startTime}
                    onChange={(e) => setNewAdMarker({ ...newAdMarker, startTime: e.target.value })}
                    placeholder="300"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newAdMarker.duration}
                    onChange={(e) => setNewAdMarker({ ...newAdMarker, duration: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="adType">Ad Type</Label>
                  <Select onValueChange={(value) => setNewAdMarker({ ...newAdMarker, adType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ad type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROGRAM">Program</SelectItem>
                      <SelectItem value="PROVIDER_ADVERTISEMENT">Provider Advertisement</SelectItem>
                      <SelectItem value="DISTRIBUTOR_ADVERTISEMENT">Distributor Advertisement</SelectItem>
                      <SelectItem value="NETWORK_ADVERTISEMENT">Network Advertisement</SelectItem>
                      <SelectItem value="LOCAL_ADVERTISEMENT">Local Advertisement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAdMarker.description}
                    onChange={(e) => setNewAdMarker({ ...newAdMarker, description: e.target.value })}
                    placeholder="Enter ad marker description"
                  />
                </div>
                <div>
                  <Label htmlFor="cueId">Cue ID (optional)</Label>
                  <Input
                    id="cueId"
                    value={newAdMarker.cueId}
                    onChange={(e) => setNewAdMarker({ ...newAdMarker, cueId: e.target.value })}
                    placeholder="Leave empty to auto-generate"
                  />
                </div>
                <Button onClick={handleCreateAdMarker} className="w-full">
                  Create Ad Marker
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streams.length}</div>
            <p className="text-xs text-muted-foreground">
              {streams.filter(s => s.isLive).length} live streams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {streams.reduce((sum, stream) => sum + stream.viewerCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all streams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Ad Markers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adMarkers.filter(m => !m.isInserted).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending insertion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Bitrate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {streams.filter(s => s.bitrate).length > 0 
                ? Math.round(streams.filter(s => s.bitrate).reduce((sum, stream) => sum + (stream.bitrate || 0), 0) / streams.filter(s => s.bitrate).length)
                : 0
              } kbps
            </div>
            <p className="text-xs text-muted-foreground">
              Current average
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="streams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="streams">Streams</TabsTrigger>
          <TabsTrigger value="ad-markers">SCTE-35 Markers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="streams" className="space-y-4">
          <div className="grid gap-4">
            {streams.map((stream) => (
              <Card key={stream.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {stream.name}
                        <Badge className={`text-white ${getStatusColor(stream.status)}`}>
                          {stream.status}
                        </Badge>
                        {stream.externalSrtUrl && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            External
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{stream.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {stream.status === 'OFFLINE' && stream.externalSrtUrl && (
                        <Button onClick={() => setIsStreamDialogOpen(stream.id)}>
                          <Upload className="w-4 h-4 mr-2" />
                          Start Push
                        </Button>
                      )}
                      {stream.status === 'LIVE' && (
                        <Button variant="destructive" onClick={() => handleStopExternalStream(stream.id)}>
                          <Square className="w-4 h-4 mr-2" />
                          Stop Push
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => handleDeleteStream(stream.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Stream Key</p>
                      <p className="font-mono text-sm">{stream.streamKey}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Viewers</p>
                      <p className="font-semibold">{stream.viewerCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quality</p>
                      <p className="font-semibold">
                        {stream.resolution ? `${stream.resolution} @ ${stream.fps}fps` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bitrate</p>
                      <p className="font-semibold">
                        {stream.bitrate ? `${stream.bitrate} kbps` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Local SRT URL</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded">{stream.srtUrl}</p>
                    <p className="text-sm text-muted-foreground">Local RTMP URL</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded">{stream.rtmpUrl}</p>
                    {stream.externalSrtUrl && (
                      <>
                        <p className="text-sm text-muted-foreground">External SRT URL</p>
                        <p className="font-mono text-sm bg-green-50 dark:bg-green-950 p-2 rounded border border-green-200 dark:border-green-800">
                          {stream.externalSrtUrl}
                        </p>
                      </>
                    )}
                    {stream.externalRtmpUrl && (
                      <>
                        <p className="text-sm text-muted-foreground">External RTMP URL</p>
                        <p className="font-mono text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">
                          {stream.externalRtmpUrl}
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ad-markers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SCTE-35 Ad Markers</CardTitle>
              <CardDescription>
                Manage ad markers for your live streams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adMarkers.map((marker) => {
                  const stream = streams.find(s => s.id === marker.streamId)
                  return (
                    <div key={marker.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-white ${getAdTypeColor(marker.adType)}`}>
                            {marker.adType.replace(/_/g, ' ')}
                          </Badge>
                          {marker.isInserted && (
                            <Badge variant="outline">Inserted</Badge>
                          )}
                          {stream && (
                            <Badge variant="secondary">{stream.name}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{marker.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Cue ID: {marker.cueId} | Start: {formatDuration(marker.startTime)} | Duration: {formatDuration(marker.duration)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!marker.isInserted && stream && (
                          <Button 
                            size="sm" 
                            onClick={() => handleInsertAdMarker(stream.streamKey, marker)}
                          >
                            Insert Now
                          </Button>
                        )}
                        <Button size="sm" variant="outline">Edit</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream Analytics</CardTitle>
              <CardDescription>
                Monitor your stream performance and viewer engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Viewer Count Over Time</h4>
                  <div className="h-40 bg-muted rounded flex items-center justify-center">
                    <p className="text-muted-foreground">Analytics chart would be displayed here</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Stream Health</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>CPU Usage</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span>62%</span>
                      </div>
                      <Progress value={62} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Network Latency</span>
                        <span>23ms</span>
                      </div>
                      <Progress value={23} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stream Configuration Dialog */}
      <Dialog open={!!isStreamDialogOpen} onOpenChange={() => setIsStreamDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Stream Push</DialogTitle>
            <DialogDescription>
              Set up FFmpeg to push your stream to the external SRT server
            </DialogDescription>
          </DialogHeader>
          {isStreamDialogOpen && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="inputUrl">Input URL</Label>
                <Input
                  id="inputUrl"
                  value={streamConfig.inputUrl}
                  onChange={(e) => setStreamConfig({ ...streamConfig, inputUrl: e.target.value })}
                  placeholder="rtmp://localhost:1935/live/stream-key"
                />
              </div>
              <div>
                <Label htmlFor="outputUrl">Output URL</Label>
                <Input
                  id="outputUrl"
                  value={streamConfig.outputUrl}
                  onChange={(e) => setStreamConfig({ ...streamConfig, outputUrl: e.target.value })}
                  placeholder="srt://distributor-server:9999?streamid=your-stream"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bitrate">Bitrate (kbps)</Label>
                  <Input
                    id="bitrate"
                    type="number"
                    value={streamConfig.bitrate}
                    onChange={(e) => setStreamConfig({ ...streamConfig, bitrate: e.target.value })}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label htmlFor="fps">FPS</Label>
                  <Input
                    id="fps"
                    type="number"
                    value={streamConfig.fps}
                    onChange={(e) => setStreamConfig({ ...streamConfig, fps: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="resolution">Resolution</Label>
                <Input
                  id="resolution"
                  value={streamConfig.resolution}
                  onChange={(e) => setStreamConfig({ ...streamConfig, resolution: e.target.value })}
                  placeholder="1920x1080"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleStartExternalStream(isStreamDialogOpen)} className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Start Push
                </Button>
                <Button variant="outline" onClick={() => setIsStreamDialogOpen(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}