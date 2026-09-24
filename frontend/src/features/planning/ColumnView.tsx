import { Fragment, useEffect, useRef, type CSSProperties, type DragEvent } from 'react'
import { ExecutionCard } from './ExecutionCard.js'
import { clipToRange, resourceIdOf, useNow, type BoardProps, type Segment } from './board.js'
import { ResourceHeader } from './ResourceHeader.js'
import { addDays, clamp, DAY_MINUTES, formatDayLong, isSameDay, isWeekend, layoutLanes, MINUTE_MS, SNAP_MINUTES, snapMinutes } from './dateUtils.js'
import type { PlanningResource } from './types.js'

// Hauteur d'une heure en pixels : une journée complète fait 24 × HOUR_PX.
const HOUR_PX = 26
const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => i * 2)
// Heure affichée en haut à l'ouverture (la nuit est rarement utilisée).
const INITIAL_SCROLL_HOUR = 5

// Mode « Colonne » : une colonne par ressource, les journées de la période
// empilées verticalement avec leur axe horaire (comme l'écran WinDev).
export function ColumnView(props: BoardProps) {
  const { days, resources, executions, groupBy, caByResource, countByResource, onSelect } = props
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = useNow()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: INITIAL_SCROLL_HOUR * HOUR_PX })
  }, [])

  return (
    <div className="pl-board-scroll" ref={scrollRef} onClick={() => onSelect(null)}>
      <div className="pl-col-grid" style={{ gridTemplateColumns: `var(--pl-gutter) repeat(${resources.length}, minmax(11rem, 1fr))`, minWidth: `calc(var(--pl-gutter) + ${resources.length} * 11rem)` }}>
        <div className="pl-col-head pl-col-corner" />
        {resources.map((r) => (
          <div key={r.id} className="pl-col-head">
            <ResourceHeader resource={r} ca={caByResource.get(r.id) ?? 0} count={countByResource.get(r.id) ?? 0} />
          </div>
        ))}

        {days.map((day) => {
          const dayStart = day.getTime()
          const dayEnd = addDays(day, 1).getTime()
          const segments = clipToRange(executions, dayStart, dayEnd)
          const today = isSameDay(day, now)
          return (
            <Fragment key={dayStart}>
              <div className={`pl-col-day${today ? ' is-today' : ''}`}>
                <span className="pl-col-day-label">
                  {formatDayLong(day)}
                  {today && <span className="pl-today-pill">Aujourd'hui</span>}
                  <span className="pl-col-day-count">{segments.length} exécution{segments.length > 1 ? 's' : ''}</span>
                </span>
              </div>
              <div className="pl-col-gutter" style={{ height: 24 * HOUR_PX }}>
                {HOUR_LABELS.map((h) => (
                  <span key={h} style={{ top: h * HOUR_PX }}>{String(h).padStart(2, '0')}:00</span>
                ))}
              </div>
              {resources.map((r) => (
                <DayCell
                  key={r.id}
                  {...props}
                  day={day}
                  dayStart={dayStart}
                  resource={r}
                  segments={segments.filter((s) => resourceIdOf(s.execution, groupBy) === r.id)}
                  nowMinutes={today ? (now - dayStart) / MINUTE_MS : null}
                  weekend={isWeekend(day)}
                />
              ))}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

type DayCellProps = BoardProps & {
  day: Date
  dayStart: number
  resource: PlanningResource
  segments: Segment[]
  nowMinutes: number | null
  weekend: boolean
}

function DayCell({ dayStart, resource, segments, nowMinutes, weekend, selectedId, dragItem, preview, onSelect, onDragStartItem, onDragEnd, onPreview, onDrop, onResizeEnd }: DayCellProps) {
  const lanes = layoutLanes(segments)
  const dayEnd = dayStart + DAY_MINUTES * MINUTE_MS

  // Horaire correspondant à la position du curseur, arrondi au quart d'heure.
  function startAt(event: DragEvent<HTMLDivElement>): number | null {
    if (!dragItem) return null
    const rect = event.currentTarget.getBoundingClientRect()
    const minutes = ((event.clientY - rect.top) / HOUR_PX) * 60 - dragItem.grabOffsetMinutes
    return dayStart + clamp(snapMinutes(minutes), 0, DAY_MINUTES - SNAP_MINUTES) * MINUTE_MS
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    const start = startAt(event)
    if (start === null || !dragItem) return
    event.preventDefault()
    event.dataTransfer.dropEffect = dragItem.kind === 'execution' ? 'move' : 'copy'
    if (preview?.resourceId !== resource.id || preview.start !== start) {
      onPreview({ resourceId: resource.id, start, end: start + dragItem.durationMinutes * MINUTE_MS })
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    const start = startAt(event)
    if (start === null) return
    event.preventDefault()
    onDrop(resource.id, start)
  }

  const showPreview = preview && preview.resourceId === resource.id && preview.end > dayStart && preview.start < dayEnd
  const toPx = (t: number) => ((t - dayStart) / MINUTE_MS / 60) * HOUR_PX

  return (
    <div
      className={`pl-col-cell${weekend ? ' is-weekend' : ''}`}
      style={{ height: 24 * HOUR_PX, '--hour': `${HOUR_PX}px` } as CSSProperties}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {segments.map((s) => {
        const { lane, lanes: count } = lanes.get(s.id) ?? { lane: 0, lanes: 1 }
        const top = toPx(s.start)
        return (
          <ExecutionCard
            key={s.id}
            execution={s.execution}
            resize={s.continuesAfter ? undefined : { axis: 'y', pxPerMinute: HOUR_PX / 60, onResizeEnd }}
            selected={selectedId === s.id}
            continuesBefore={s.continuesBefore}
            continuesAfter={s.continuesAfter}
            style={{
              top,
              height: Math.max(toPx(s.end) - top, 20),
              left: `calc(${(lane / count) * 100}% + 3px)`,
              width: `calc(${100 / count}% - 6px)`,
            }}
            onSelect={onSelect}
            onDragEnd={onDragEnd}
            onDragStart={(execution, event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              const grabbed = ((event.clientY - rect.top) / HOUR_PX) * 60 + (s.start - execution.start) / MINUTE_MS
              onDragStartItem(
                { kind: 'execution', id: execution.id, durationMinutes: (execution.end - execution.start) / MINUTE_MS, grabOffsetMinutes: grabbed },
                event,
              )
            }}
          />
        )
      })}
      {showPreview && (
        <div
          className="pl-drop-preview"
          style={{ top: toPx(Math.max(preview.start, dayStart)), height: toPx(Math.min(preview.end, dayEnd)) - toPx(Math.max(preview.start, dayStart)) }}
        />
      )}
      {nowMinutes !== null && <div className="pl-now pl-now--h" style={{ top: (nowMinutes / 60) * HOUR_PX }} />}
    </div>
  )
}
