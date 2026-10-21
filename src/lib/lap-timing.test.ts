import {
  averageLapTime,
  currentLapTime,
  elapsedTime,
  emptyTimer,
  formatLapTime,
  lapTimerReducer as reduce,
} from './lap-timing'

describe('lap timing', () => {
  it('averages 60/65/55 second laps immediately, using completed laps only', () => {
    let timer = reduce(emptyTimer, { type: 'start', now: 1000 })
    expect(averageLapTime(timer.lapsMs)).toBeNull()
    timer = reduce(timer, { type: 'lap', now: 61000 })
    expect(averageLapTime(timer.lapsMs)).toBe(60000)
    expect(currentLapTime(timer, 70000)).toBe(9000)
    expect(averageLapTime(timer.lapsMs)).toBe(60000)
    timer = reduce(timer, { type: 'lap', now: 126000 })
    expect(averageLapTime(timer.lapsMs)).toBe(62500)
    timer = reduce(timer, { type: 'lap', now: 181000 })
    expect(timer.lapsMs).toEqual([60000, 65000, 55000])
    expect(averageLapTime(timer.lapsMs)).toBe(60000)
  })

  it('excludes multiple pauses across lap boundaries and finishes while paused', () => {
    let timer = reduce(emptyTimer, { type: 'start', now: 100 })
    timer = reduce(timer, { type: 'pause', now: 10100 })
    expect(elapsedTime(timer, 999999)).toBe(10000)
    timer = reduce(timer, { type: 'resume', now: 50000 })
    timer = reduce(timer, { type: 'lap', now: 55000 })
    timer = reduce(timer, { type: 'pause', now: 60000 })
    timer = reduce(timer, { type: 'resume', now: 100000 })
    timer = reduce(timer, { type: 'pause', now: 105000 })
    timer = reduce(timer, { type: 'finish', now: 200000 })
    timer = reduce(timer, { type: 'complete', recordPartial: true })
    expect(timer.lapsMs).toEqual([15000, 10000])
    expect(timer.elapsedMs).toBe(25000)
  })

  it('measures background time without receiving any interval callbacks', () => {
    const timer = reduce(emptyTimer, { type: 'start', now: 123.125 })
    expect(currentLapTime(timer, 3600123.75)).toBe(3600000.625)
    const lapped = reduce(timer, { type: 'lap', now: 3600123.75 })
    expect(lapped.lapsMs).toEqual([3600000.625])
  })

  it.each([true, false])(
    'freezes finish time while deciding whether to record (%s)',
    (recordPartial) => {
      let timer = reduce(emptyTimer, { type: 'start', now: 0 })
      timer = reduce(timer, { type: 'lap', now: 60000 })
      timer = reduce(timer, { type: 'finish', now: 75000.125 })
      expect(elapsedTime(timer, 1000000)).toBe(75000.125)
      timer = reduce(timer, { type: 'complete', recordPartial })
      expect(timer.lapsMs).toEqual(recordPartial ? [60000, 15000.125] : [60000])
      expect(timer.elapsedMs).toBe(75000.125)
      expect(reduce(timer, { type: 'complete', recordPartial: true })).toBe(
        timer,
      )
    },
  )

  it('handles finishing before any lap, zero-time laps, and invalid controls', () => {
    expect(reduce(emptyTimer, { type: 'pause', now: 1 })).toBe(emptyTimer)
    let timer = reduce(emptyTimer, { type: 'start', now: 1 })
    expect(reduce(timer, { type: 'lap', now: 1 })).toBe(timer)
    expect(reduce(timer, { type: 'resume', now: 2 })).toBe(timer)
    timer = reduce(timer, { type: 'finish', now: 2 })
    const discarded = reduce(timer, { type: 'complete', recordPartial: false })
    expect(averageLapTime(discarded.lapsMs)).toBeNull()
    expect(discarded.elapsedMs).toBe(1)
    expect(reduce(timer, { type: 'cancel-finish' }).status).toBe('paused')
    expect(reduce(discarded, { type: 'reset' })).toEqual(emptyTimer)
  })

  it('rounds display with carry without rounding the average or measurements', () => {
    expect(formatLapTime(null)).toBe('—')
    expect(formatLapTime(59999.9)).toBe('01:00.00')
    expect(formatLapTime(3600000)).toBe('60:00.00')
    expect(averageLapTime([1000.125, 1000.25])).toBe(1000.1875)
  })
})
