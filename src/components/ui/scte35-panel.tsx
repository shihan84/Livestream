import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Plus, Clock, CheckCircle, AlertTriangle, Trash2, Edit } from 'lucide-react'

interface SCTE35Marker {
  id: string
  cueId?: string
  startTime: number
  duration: number
  adType: 'PROGRAM' | 'PROVIDER_ADVERTISEMENT' | 'DISTRIBUTOR_ADVERTISEMENT' | 'NETWORK_ADVERTISEMENT' | 'LOCAL_ADVERTISEMENT'
  description?: string
  isInserted: boolean
  insertionTime?: string
}

interface SCTE35PanelProps {
  markers: SCTE35Marker[]
  onCreateMarker: (marker: Omit<SCTE35Marker, 'id' | 'isInserted' | 'insertionTime'>) => void
  onInsertMarker: (markerId: string) => void
  onDeleteMarker: (markerId: string) => void
  streamDuration?: number
  className?: string
}

export function SCTE35Panel({
  markers,
  onCreateMarker,
  onInsertMarker,
  onDeleteMarker,
  streamDuration = 0,
  className
}: SCTE35PanelProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newMarker, setNewMarker] = useState({
    startTime: '',
    duration: '',
    adType: 'PROVIDER_ADVERTISEMENT' as const,
    description: '',
    cueId: ''
  })

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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCreateMarker = () => {
    if (!newMarker.startTime || !newMarker.duration) return

    onCreateMarker({
      startTime: parseFloat(newMarker.startTime),
      duration: parseFloat(newMarker.duration),
      adType: newMarker.adType,
      description: newMarker.description,
      cueId: newMarker.cueId || undefined
    })

    setNewMarker({
      startTime: '',
      duration: '',
      adType: 'PROVIDER_ADVERTISEMENT',
      description: '',
      cueId: ''
    })
    setIsCreateDialogOpen(false)
  }

  const getMarkerPosition = (startTime: number) => {
    if (streamDuration <= 0) return 0
    return Math.min((startTime / streamDuration) * 100, 100)
  }

  const pendingMarkers = markers.filter(m => !m.isInserted)
  const insertedMarkers = markers.filter(m => m.isInserted)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              SCTE-35 Ad Markers
            </CardTitle>
            <CardDescription>
              Schedule and manage ad breaks for your live stream
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Marker
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
                  <Label htmlFor="startTime">Start Time (seconds)</Label>
                  <Input
                    id="startTime"
                    type="number"
                    value={newMarker.startTime}
                    onChange={(e) => setNewMarker({ ...newMarker, startTime: e.target.value })}
                    placeholder="300"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newMarker.duration}
                    onChange={(e) => setNewMarker({ ...newMarker, duration: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="adType">Ad Type</Label>
                  <Select value={newMarker.adType} onValueChange={(value: any) => setNewMarker({ ...newMarker, adType: value })}>
                    <SelectTrigger>
                      <SelectValue />
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
                    value={newMarker.description}
                    onChange={(e) => setNewMarker({ ...newMarker, description: e.target.value })}
                    placeholder="Mid-roll commercial break"
                  />
                </div>
                <div>
                  <Label htmlFor="cueId">Cue ID (optional)</Label>
                  <Input
                    id="cueId"
                    value={newMarker.cueId}
                    onChange={(e) => setNewMarker({ ...newMarker, cueId: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <Button onClick={handleCreateMarker} className="w-full">
                  Create Ad Marker
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline Visualization */}
        {streamDuration > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Stream Timeline</span>
              <span>{formatDuration(streamDuration)}</span>
            </div>
            <div className="relative h-8 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              {/* Timeline markers */}
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  className="absolute top-0 h-full w-0.5 bg-blue-500"
                  style={{ left: `${getMarkerPosition(marker.startTime)}%` }}
                >
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              ))}
              
              {/* Progress indicator */}
              <div className="absolute top-0 left-0 h-1 bg-green-500" style={{ width: '45%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0:00</span>
              <span>Current: {formatDuration(streamDuration * 0.45)}</span>
              <span>{formatDuration(streamDuration)}</span>
            </div>
          </div>
        )}

        {/* Pending Markers */}
        {pendingMarkers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Markers ({pendingMarkers.length})
            </h4>
            <div className="space-y-2">
              {pendingMarkers.map((marker) => (
                <div key={marker.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getAdTypeColor(marker.adType)} text-white`}>
                        {marker.adType.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm text-gray-500">Cue: {marker.cueId || 'Auto'}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{marker.description}</p>
                    <p className="text-xs text-gray-500">
                      Start: {formatDuration(marker.startTime)} | Duration: {formatDuration(marker.duration)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => onInsertMarker(marker.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Insert Now
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onDeleteMarker(marker.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inserted Markers */}
        {insertedMarkers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Inserted Markers ({insertedMarkers.length})
            </h4>
            <div className="space-y-2">
              {insertedMarkers.map((marker) => (
                <div key={marker.id} className="flex items-center justify-between p-3 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getAdTypeColor(marker.adType)} text-white`}>
                        {marker.adType.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Inserted
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{marker.description}</p>
                    <p className="text-xs text-gray-500">
                      Inserted at: {marker.insertionTime ? new Date(marker.insertionTime).toLocaleTimeString() : 'Unknown'}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDeleteMarker(marker.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {markers.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Ad Markers Scheduled
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Schedule SCTE-35 ad markers to control ad breaks in your live stream
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Marker
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}