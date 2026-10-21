'use client'

import { memo, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatLapTime, lapWindow, LapTimer } from '@/lib/lap-timing'

export const LAP_TABLE_PAGE_SIZE = 100

type LapSource =
  { laps: readonly number[]; timer?: never } | { timer: LapTimer; laps?: never }

function LapList({ laps, timer }: LapSource) {
  const count = timer ? timer.lapCount : laps.length
  const lastPage = Math.max(0, Math.ceil(count / LAP_TABLE_PAGE_SIZE) - 1)
  const [page, setPage] = useState(lastPage)
  useEffect(() => {
    setPage(lastPage)
  }, [lastPage])
  const start = Math.min(page, lastPage) * LAP_TABLE_PAGE_SIZE
  const visible = timer
    ? lapWindow(timer, start, LAP_TABLE_PAGE_SIZE)
    : laps.slice(start, start + LAP_TABLE_PAGE_SIZE)
  return (
    <div className="space-y-3">
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <caption className="mb-2 text-left font-medium">Lap history</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="py-2 text-left">
                Lap
              </th>
              <th scope="col" className="py-2 text-right">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-3 text-slate-500">
                  No completed laps.
                </td>
              </tr>
            ) : (
              visible.map((lap, i) => (
                <tr key={start + i} className="border-b last:border-0">
                  <th scope="row" className="py-2 text-left font-normal">
                    {start + i + 1}
                  </th>
                  <td className="py-2 text-right font-mono tabular-nums">
                    {formatLapTime(lap)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {count > LAP_TABLE_PAGE_SIZE && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Button
            variant="outline"
            disabled={start === 0}
            onClick={() => setPage((value) => value - 1)}
          >
            Earlier laps
          </Button>
          <span>
            Showing laps {start + 1}–
            {Math.min(start + LAP_TABLE_PAGE_SIZE, count)} of {count}
          </span>
          <Button
            variant="outline"
            disabled={page >= lastPage}
            onClick={() => setPage((value) => value + 1)}
          >
            Later laps
          </Button>
        </div>
      )}
    </div>
  )
}

export default memo(LapList)
