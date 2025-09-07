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
import { Play, Square, Settings, BarChart3, Users, Activity, Radio, Plus, Zap, Shield, Cloud, Monitor, Cpu, HardDrive } from 'lucide-react'
import { useStreaming } from '@/hooks/use-streaming'

export default function StreamingDashboard() {
  const {
    streams,
    adMarkers,
    isConnected,
    viewerCounts,
    createStream,
    startStream,
    stopStream,
    deleteStream,
    createAdMarker,
    insertAdMarker,
    subscribeToStream,
    unsubscribeFromStream
  } = useStreaming()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAdMarkerDialogOpen, setIsAdMarkerDialogOpen] = useState(false)
  const [newStream, setNewStream] = useState({
    name: '',
    description: '',
    streamKey: ''
  })
  const [newAdMarker, setNewAdMarker] = useState({
    streamId: '',
    startTime: '',
    duration: '',
    adType: 'PROVIDER_ADVERTISEMENT',
    description: '',
    cueId: ''
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
      setNewStream({ name: '', description: '', streamKey: '' })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating stream:', error)
    }
  }

  const handleStartStream = async (streamId: string) => {
    try {
      await startStream(streamId)
    } catch (error) {
      console.error('Error starting stream:', error)
    }
  }

  const handleStopStream = async (streamId: string) => {
    try {
      await stopStream(streamId)
    } catch (error) {
      console.error('Error stopping stream:', error)
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
    <div className="aws-theme min-h-screen aws-bg-gradient">
      {/* AWS-style Header */}
      <div className="bg-aws-dark border-b border-aws-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-8 h-8 text-aws-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-aws-primary">Elemental Live</h1>
                  <p className="text-xs text-aws-text-secondary">Broadcast Encoder</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-aws-success' : 'bg-aws-danger'}`} />
                <span className="text-sm text-aws-text-secondary">
                  {isConnected ? 'Encoder Online' : 'Encoder Offline'}
                </span>
              </div>
              <div className="text-sm text-aws-text-secondary">
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* AWS-style Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metrics-panel">
            <div className="flex items-center justify-between">
              <div>
                <div className="metric-value">{streams.length}</div>
                <div className="metric-label">Channels</div>
              </div>
              <Radio className="w-8 h-8 text-aws-primary opacity-50" />
            </div>
          </div>

          <div className="metrics-panel">
            <div className="flex items-center justify-between">
              <div>
                <div className="metric-value">
                  {streams.reduce((sum, stream) => sum + stream.viewerCount, 0)}
                </div>
                <div className="metric-label">Viewers</div>
              </div>
              <Users className="w-8 h-8 text-aws-primary opacity-50" />
            </div>
          </div>

          <div className="metrics-panel">
            <div className="flex items-center justify-between">
              <div>
                <div className="metric-value">
                  {adMarkers.filter(m => !m.isInserted).length}
                </div>
                <div className="metric-label">Ad Markers</div>
              </div>
              <Activity className="w-8 h-8 text-aws-primary opacity-50" />
            </div>
          </div>

          <div className="metrics-panel">
            <div className="flex items-center justify-between">
              <div>
                <div className="metric-value">
                  {streams.filter(s => s.bitrate).length > 0 
                    ? Math.round(streams.filter(s => s.bitrate).reduce((sum, stream) => sum + (stream.bitrate || 0), 0) / streams.filter(s => s.bitrate).length)
                    : 0
                  }
                </div>
                <div className="metric-label">Avg Bitrate</div>
              </div>
              <BarChart3 className="w-8 h-8 text-aws-primary opacity-50" />
            </div>
          </div>
        </div>

        {/* AWS-style Control Panel */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-aws-primary">Channel Management</h2>
            <p className="text-aws-text-secondary">Manage your broadcast channels and SCTE-35 ad markers</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <button className="broadcast-button">
                  <Radio className="w-4 h-4 mr-2" />
                  Create Channel
                </button>
              </DialogTrigger>
              <DialogContent className="bg-aws-surface border-aws-border">
                <DialogHeader>
                  <DialogTitle className="text-aws-primary">Create New Channel</DialogTitle>
                  <DialogDescription className="text-aws-text-secondary">
                    Configure a new broadcast channel for live streaming
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-aws-text-primary">Channel Name</Label>
                    <Input
                      id="name"
                      value={newStream.name}
                      onChange={(e) => setNewStream({ ...newStream, name: e.target.value })}
                      placeholder="Enter channel name"
                      className="bg-aws-card border-aws-border text-aws-text-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-aws-text-primary">Description</Label>
                    <Textarea
                      id="description"
                      value={newStream.description}
                      onChange={(e) => setNewStream({ ...newStream, description: e.target.value })}
                      placeholder="Enter channel description"
                      className="bg-aws-card border-aws-border text-aws-text-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="streamKey" className="text-aws-text-primary">Stream Key (optional)</Label>
                    <Input
                      id="streamKey"
                      value={newStream.streamKey}
                      onChange={(e) => setNewStream({ ...newStream, streamKey: e.target.value })}
                      placeholder="Leave empty to auto-generate"
                      className="bg-aws-card border-aws-border text-aws-text-primary"
                    />
                  </div>
                  <button onClick={handleCreateStream} className="broadcast-button w-full">
                    Create Channel
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAdMarkerDialogOpen} onOpenChange={setIsAdMarkerDialogOpen}>
              <DialogTrigger asChild>
                <button className="broadcast-button secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ad Marker
                </button>
              </DialogTrigger>
              <DialogContent className="bg-aws-surface border-aws-border">
                <DialogHeader>
                  <DialogTitle className="text-aws-primary">Create SCTE-35 Ad Marker</DialogTitle>
                  <DialogDescription className="text-aws-text-secondary">
                    Schedule an ad marker for your broadcast channel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="streamSelect" className="text-aws-text-primary">Channel</Label>
                    <Select onValueChange={(value) => setNewAdMarker({ ...newAdMarker, streamId: value })}>
                      <SelectTrigger className="bg-aws-card border-aws-border text-aws-text-primary">
                        <SelectValue placeholder="Select a channel" />
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
                    <Label htmlFor="startTime" className="text-aws-text-primary">Start Time (seconds)</Label>
                    <Input
                      id="startTime"
                      type="number"
                      value={newAdMarker.startTime}
                      onChange={(e) => setNewAdMarker({ ...newAdMarker, startTime: e.target.value })}
                      placeholder="300"
                      className="bg-aws-card border-aws-border text-aws-text-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration" className="text-aws-text-primary">Duration (seconds)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newAdMarker.duration}
                      onChange={(e) => setNewAdMarker({ ...newAdMarker, duration: e.target.value })}
                      placeholder="30"
                      className="bg-aws-card border-aws-border text-aws-text-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adType" className="text-aws-text-primary">Ad Type</Label>
                    <Select onValueChange={(value) => setNewAdMarker({ ...newAdMarker, adType: value })}>
                      <SelectTrigger className="bg-aws-card border-aws-border text-aws-text-primary">
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
                    <Label htmlFor="description" className="text-aws-text-primary">Description</Label>
                    <Textarea
                      id="description"
                      value={newAdMarker.description}
                      onChange={(e) => setNewAdMarker({ ...newAdMarker, description: e.target.value })}
                      placeholder="Enter ad marker description"
                      className="bg-aws-card border-aws-border text-aws-text-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cueId" className="text-aws-text-primary">Cue ID (optional)</Label>
                    <Input
                      id="cueId"
                      value={newAdMarker.cueId}
                      onChange={(e) => setNewAdMarker({ ...newAdMarker, cueId: e.target.value })}
                      placeholder="Leave empty to auto-generate"
                      className="bg-aws-card border-aws-border text-aws-text-primary"
                    />
                  </div>
                  <button onClick={handleCreateAdMarker} className="broadcast-button w-full">
                    Create Ad Marker
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* AWS-style Tabs */}
        <Tabs defaultValue="channels" className="space-y-4">
          <TabsList className="bg-aws-surface border-aws-border">
            <TabsTrigger value="channels" className="text-aws-text-primary">Channels</TabsTrigger>
            <TabsTrigger value="ad-markers" className="text-aws-text-primary">SCTE-35 Markers</TabsTrigger>
            <TabsTrigger value="analytics" className="text-aws-text-primary">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-4">
            <div className="grid gap-4">
              {streams.map((stream) => (
                <div key={stream.id} className="broadcast-card">
                  <div className="broadcast-header">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`status-indicator ${stream.status === 'LIVE' ? 'online' : stream.status === 'OFFLINE' ? 'offline' : 'warning'}`} />
                        <div>
                          <h3 className="text-lg font-semibold text-aws-primary">{stream.name}</h3>
                          <p className="text-sm text-aws-text-secondary">{stream.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-white ${getStatusColor(stream.status)}`}>
                          {stream.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-aws-text-secondary mb-1">Stream Key</p>
                        <p className="font-mono text-sm text-aws-primary">{stream.streamKey}</p>
                      </div>
                      <div>
                        <p className="text-sm text-aws-text-secondary mb-1">Viewers</p>
                        <p className="metric-value text-lg">{stream.viewerCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-aws-text-secondary mb-1">Quality</p>
                        <p className="text-aws-primary font-semibold">
                          {stream.resolution ? `${stream.resolution} @ ${stream.fps}fps` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-aws-text-secondary mb-1">Bitrate</p>
                        <p className="text-aws-primary font-semibold">
                          {stream.bitrate ? `${stream.bitrate} kbps` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    {/* AWS-style URL Configuration */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-aws-text-secondary mb-2">SRT URL</p>
                        <div className="bg-aws-card border-aws-border rounded p-3">
                          <code className="text-aws-primary text-sm font-mono">{stream.srtUrl}</code>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-aws-text-secondary mb-2">RTMP URL</p>
                        <div className="bg-aws-card border-aws-border rounded p-3">
                          <code className="text-aws-primary text-sm font-mono">{stream.rtmpUrl}</code>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      {stream.status === 'OFFLINE' && (
                        <button onClick={() => handleStartStream(stream.id)} className="broadcast-button">
                          <Play className="w-4 h-4 mr-2" />
                          Start Channel
                        </button>
                      )}
                      {stream.status === 'LIVE' && (
                        <button onClick={() => handleStopStream(stream.id)} className="broadcast-button danger">
                          <Square className="w-4 h-4 mr-2" />
                          Stop Channel
                        </button>
                      )}
                      <button onClick={() => handleDeleteStream(stream.id)} className="broadcast-button secondary">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ad-markers" className="space-y-4">
            <div className="broadcast-card">
              <div className="broadcast-header">
                <h3 className="text-lg font-semibold text-aws-primary">SCTE-35 Ad Markers</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {adMarkers.map((marker) => {
                    const stream = streams.find(s => s.id === marker.streamId)
                    return (
                      <div key={marker.id} className="bg-aws-card border-aws-border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-white ${getAdTypeColor(marker.adType)}`}>
                                {marker.adType.replace(/_/g, ' ')}
                              </Badge>
                              {marker.isInserted && (
                                <Badge variant="outline" className="text-aws-success border-aws-success">Inserted</Badge>
                              )}
                              {stream && (
                                <Badge variant="secondary" className="text-aws-text-secondary">{stream.name}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-aws-text-secondary">{marker.description}</p>
                            <div className="flex items-center gap-4 text-xs text-aws-text-muted">
                              <span>Cue ID: {marker.cueId}</span>
                              <span>Start: {formatDuration(marker.startTime)}</span>
                              <span>Duration: {formatDuration(marker.duration)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!marker.isInserted && stream && (
                              <button 
                                className="broadcast-button"
                                onClick={() => handleInsertAdMarker(stream.streamKey, marker)}
                              >
                                Insert Now
                              </button>
                            )}
                            <button className="broadcast-button secondary">
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AWS-style Stream Health */}
              <div className="broadcast-card">
                <div className="broadcast-header">
                  <h3 className="text-lg font-semibold text-aws-primary">Stream Health</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-aws-text-secondary mb-2">
                      <span className="flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        CPU Usage
                      </span>
                      <span>45%</span>
                    </div>
                    <div className="w-full bg-aws-card rounded-full h-2">
                      <div className="bg-aws-primary h-2 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-aws-text-secondary mb-2">
                      <span className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        Memory Usage
                      </span>
                      <span>62%</span>
                    </div>
                    <div className="w-full bg-aws-card rounded-full h-2">
                      <div className="bg-aws-warning h-2 rounded-full" style={{ width: '62%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-aws-text-secondary mb-2">
                      <span className="flex items-center gap-2">
                        <Cloud className="w-4 h-4" />
                        Network Latency
                      </span>
                      <span>23ms</span>
                    </div>
                    <div className="w-full bg-aws-card rounded-full h-2">
                      <div className="bg-aws-success h-2 rounded-full" style={{ width: '23%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* AWS-style Stream Preview */}
              <div className="broadcast-card">
                <div className="broadcast-header">
                  <h3 className="text-lg font-semibold text-aws-primary">Stream Preview</h3>
                </div>
                <div className="p-6">
                  <div className="stream-preview">
                    {streams.some(s => s.status === 'LIVE') && (
                      <div className="absolute top-4 left-4 bg-aws-danger text-white px-2 py-1 rounded text-sm font-bold">
                        LIVE
                      </div>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-aws-text-secondary text-sm">Resolution</p>
                      <p className="text-aws-primary font-semibold">1920x1080</p>
                    </div>
                    <div>
                      <p className="text-aws-text-secondary text-sm">FPS</p>
                      <p className="text-aws-primary font-semibold">30</p>
                    </div>
                    <div>
                      <p className="text-aws-text-secondary text-sm">Bitrate</p>
                      <p className="text-aws-primary font-semibold">5000 kbps</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AWS-style Viewer Analytics */}
            <div className="broadcast-card">
              <div className="broadcast-header">
                <h3 className="text-lg font-semibold text-aws-primary">Viewer Analytics</h3>
              </div>
              <div className="p-6">
                <div className="h-40 bg-aws-card rounded flex items-center justify-center border-aws-border">
                  <p className="text-aws-text-secondary">Analytics chart would be displayed here</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}