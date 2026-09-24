import type { DragEvent } from 'react'
import { ExecutionCard } from './ExecutionCard.js'
import { clipToRange, resourceIdOf, useNow, type BoardProps } from './board.js'
import { ResourceHeader } from './ResourceHeader.js'
import { addDays, clamp, formatDayShort, isSameDay, isWeekend, layoutLanes, MINUTE_MS, SNAP_MINUTES, snapMinutes } from './dateUtils.js'

// Largeur d'une heure en pixels : une journée fait 24 × HOUR_W.
const HOUR_W = 20
const DAY_W = 24 * HOUR_W
const LANE_H = 68
const TICKS = [0, 6, 12, 18]

// Mode « Ligne » : une ligne par ressource, la période en frise
// horizontale — pratique pour voir d'un coup d'œil la charge de chacun.
export function RowView(props: BoardProps) {
  const { days, resources, executions, groupBy, caByResource, countByResource, selectedId, dragItem, preview, onSelect, onDragStartItem, onDragEnd, onPreview, onDrop, onResizeEnd } = props
  const now = useNow()
  const periodStart = days[0].getTime()
  const periodEnd = addDays(days[days.length - 1], 1).getTime()
  const dayStarts = days.map((d) => d.getTime())
  const segments = clipToRange(executions, periodStart, periodEnd)
  const trackWidth = days.length * DAY_W

  // Position horizontale d'un instant, calculée jour par jour pour rester
  // juste les jours de changement d'heure (23 h ou 25 h).
  function xOf(t: number): number {
    if (t >= periodEnd) return trackWidth
    let index = dayStarts.findIndex((start, i) => t >= start && (i === dayStarts.length - 1 || t < dayStarts[i + 1]))
    if (index === -1) index = 0
    return index * DAY_W + ((t - dayStarts[index]) / MINUTE_MS / 60) * HOUR_W
  }

  function startAt(event: DragEvent<HTMLDivElement>): number | null {
    if (!dragItem) return null
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp(event.clientX - rect.left, 0, trackWidth - 1)
    const index = Math.floor(x / DAY_W)
    const minutes = ((x - index * DAY_W) / HOUR_W) * 60 - dragItem.grabOffsetMinutes
    const start = dayStarts[index] + snapMinutes(minutes) * MINUTE_MS
    return clamp(start, periodStart, periodEnd - SNAP_MINUTES * MINUTE_MS)
  }

  const nowX = now >= periodStart && now < periodEnd ? xOf(now) : null

  return (
    <div className="pl-board-scroll" onClick={() => onSelect(null)}>
      <div className="pl-row-grid" style={{ width: `calc(var(--pl-label) + ${trackWidth}px)` }}>
        <div className="pl-row-head">
          <div className="pl-row-corner">{groupBy === 'executant' ? 'Exécutant' : 'Remorque'}</div>
          {days.map((d) => (
            <div key={d.getTime()} className={`pl-row-dayhead${isSameDay(d, now) ? ' is-today' : ''}`} style={{ width: DAY_W }}>
              <strong>{formatDayShort(d)}</strong>
              <div className="pl-row-ticks">
                {TICKS.map((h) => (
                  <span key={h} style={{ left: h * HOUR_W }}>{h}h</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {resources.map((r) => {
          const rowSegments = segments.filter((s) => resourceIdOf(s.execution, groupBy) === r.id)
          const lanes = layoutLanes(rowSegments)
          const laneCount = Math.max(1, ...[...lanes.values()].map((l) => l.lanes))
          const showPreview = preview?.resourceId === r.id

          return (
            <div key={r.id} className="pl-row">
              <div className="pl-row-label">
                <ResourceHeader resource={r} ca={caByResource.get(r.id) ?? 0} count={countByResource.get(r.id) ?? 0} />
              </div>
              <div
                className="pl-row-track"
                style={{ width: trackWidth, height: laneCount * LANE_H + 8, backgroundSize: `${HOUR_W * 6}px 100%, ${DAY_W}px 100%` }}
                onDragOver={(event) => {
                  const start = startAt(event)
                  if (start === null || !dragItem) return
                  event.preventDefault()
                  event.dataTransfer.dropEffect = dragItem.kind === 'execution' ? 'move' : 'copy'
                  if (preview?.resourceId !== r.id || preview.start !== start) {
                    onPreview({ resourceId: r.id, start, end: start + dragItem.durationMinutes * MINUTE_MS })
                  }
                }}
                onDrop={(event) => {
                  const start = startAt(event)
                  if (start === null) return
                  event.preventDefault()
                  onDrop(r.id, start)
                }}
              >
                {days.map((d, i) =>
                  isWeekend(d) || isSameDay(d, now) ? (
                    <div key={i} className={`pl-row-daybg${isSameDay(d, now) ? ' is-today' : ' is-weekend'}`} style={{ left: i * DAY_W, width: DAY_W }} />
                  ) : null,
                )}
                {rowSegments.map((s) => {
                  const { lane } = lanes.get(s.id) ?? { lane: 0 }
                  const left = xOf(s.start)
                  return (
                    <ExecutionCard
                      key={s.id}
                      execution={s.execution}
                      resize={s.continuesAfter ? undefined : { axis: 'x', pxPerMinute: HOUR_W / 60, onResizeEnd }}
                      selected={selectedId === s.id}
                      continuesBefore={s.continuesBefore}
                      continuesAfter={s.continuesAfter}
                      style={{ left: left + 1, width: Math.max(xOf(s.end) - left - 2, 26), top: 4 + lane * LANE_H, height: LANE_H - 6 }}
                      onSelect={onSelect}
                      onDragEnd={onDragEnd}
                      onDragStart={(execution, event) => {
                        const rect = event.currentTarget.getBoundingClientRect()
                        const grabbed = ((event.clientX - rect.left) / HOUR_W) * 60 + (s.start - execution.start) / MINUTE_MS
                        onDragStartItem(
                          { kind: 'execution', id: execution.id, durationMinutes: (execution.end - execution.start) / MINUTE_MS, grabOffsetMinutes: grabbed },
                          event,
                        )
                      }}
                    />
                  )
                })}
                {showPreview && preview && (
                  <div className="pl-drop-preview" style={{ left: xOf(preview.start), width: Math.max(xOf(Math.min(preview.end, periodEnd)) - xOf(preview.start), 8), top: 4, bottom: 4 }} />
                )}
                {nowX !== null && <div className="pl-now pl-now--v" style={{ left: nowX }} />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
