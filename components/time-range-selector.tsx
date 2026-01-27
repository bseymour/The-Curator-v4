'use client'

import { useState } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TimeRangePreset } from '@/lib/types'

interface TimeRangeSelectorProps {
  value: {
    preset: TimeRangePreset
    weekNumber?: number
    year?: number
  }
  onChange: (value: { preset: TimeRangePreset; weekNumber?: number; year?: number }) => void
}

const presetLabels: Record<TimeRangePreset, string> = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  'week': 'Specific week',
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const [weekDialogOpen, setWeekDialogOpen] = useState(false)
  const [tempWeek, setTempWeek] = useState(value.weekNumber || getCurrentWeek())
  const [tempYear, setTempYear] = useState(value.year || new Date().getFullYear())

  function getCurrentWeek(): number {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - start.getTime()
    const oneWeek = 1000 * 60 * 60 * 24 * 7
    return Math.ceil(diff / oneWeek)
  }

  const displayLabel = value.preset === 'week' && value.weekNumber
    ? `Week ${value.weekNumber}, ${value.year}`
    : presetLabels[value.preset]

  const handleWeekSelect = () => {
    onChange({ preset: 'week', weekNumber: tempWeek, year: tempYear })
    setWeekDialogOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-transparent">
            {displayLabel}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onChange({ preset: '24h' })}>
            Last 24 hours
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange({ preset: '7d' })}>
            Last 7 days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange({ preset: '30d' })}>
            Last 30 days
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <Dialog open={weekDialogOpen} onOpenChange={setWeekDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                Specific week...
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select a specific week</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="week">Week number</Label>
                    <Input
                      id="week"
                      type="number"
                      min={1}
                      max={53}
                      value={tempWeek}
                      onChange={(e) => setTempWeek(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      min={2020}
                      max={2030}
                      value={tempYear}
                      onChange={(e) => setTempYear(parseInt(e.target.value) || new Date().getFullYear())}
                    />
                  </div>
                </div>
                <Button onClick={handleWeekSelect}>Apply</Button>
              </div>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
