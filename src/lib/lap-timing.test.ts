import {
  averageLapTime,
  completedLaps,
  lapWindow,
  currentLapTime,
  elapsedTime,
  emptyTimer,
  formatLapTime,
  lapTimerReducer as reduce,
} from './lap-timing'

describe('lap timing', () => {
  it('averages 60/65/55 second laps immediately, using completed laps only', () => {
    let timer = reduce(emptyTimer, { type: 'start', now: 1000 })
    expect(averageLapTime(completedLaps(timer))).toBeNull()
    timer = reduce(timer, { type: 'lap', now: 61000 })
    expect(averageLapTime(completedLaps(timer))).toBe(60000)
    expect(currentLapTime(timer, 70000)).toBe(9000)
    expect(averageLapTime(completedLaps(timer))).toBe(60000)
    timer = reduce(timer, { type: 'lap', now: 126000 })
    expect(averageLapTime(completedLaps(timer))).toBe(62500)
    timer = reduce(timer, { type: 'lap', now: 181000 })
    expect(completedLaps(timer)).toEqual([60000, 65000, 55000])
    expect(averageLapTime(completedLaps(timer))).toBe(60000)
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
    expect(completedLaps(timer)).toEqual([15000, 10000])
    expect(timer.elapsedMs).toBe(25000)
  })

  it('measures background time without receiving any interval callbacks', () => {
    const timer = reduce(emptyTimer, { type: 'start', now: 123.125 })
    expect(currentLapTime(timer, 3600123.75)).toBe(3600000.625)
    const lapped = reduce(timer, { type: 'lap', now: 3600123.75 })
    expect(completedLaps(lapped)).toEqual([3600000.625])
  })

  it.each([true, false])(
    'freezes finish time while deciding whether to record (%s)',
    (recordPartial) => {
      let timer = reduce(emptyTimer, { type: 'start', now: 0 })
      timer = reduce(timer, { type: 'lap', now: 60000 })
      timer = reduce(timer, { type: 'finish', now: 75000.125 })
      expect(elapsedTime(timer, 1000000)).toBe(75000.125)
      timer = reduce(timer, { type: 'complete', recordPartial })
      expect(completedLaps(timer)).toEqual(
        recordPartial ? [60000, 15000.125] : [60000],
      )
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
    expect(averageLapTime(completedLaps(discarded))).toBeNull()
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

  it('preserves order and immutable snapshots across a maximum-size session', () => {
    let timer = reduce(emptyTimer, { type: 'start', now: 0 })
    for (let i = 1; i <= 100; i++)
      timer = reduce(timer, { type: 'lap', now: i * 1000.125 })
    const snapshot = timer
    for (let i = 101; i <= 10000; i++)
      timer = reduce(timer, { type: 'lap', now: i * 1000.125 })
    expect(completedLaps(snapshot)).toEqual(Array(100).fill(1000.125))
    expect(completedLaps(timer)).toEqual(Array(10000).fill(1000.125))
    expect(timer.lapCount).toBe(10000)
    expect(timer.completedMs).toBe(10001250)
    expect(currentLapTime(timer, 10001250.25)).toBe(0.25)
  })

  it('reads only the requested ordered window across chunk boundaries', () => {
    let timer = reduce(emptyTimer, { type: 'start', now: 0 })
    for (let i = 1; i <= 250; i++)
      timer = reduce(timer, { type: 'lap', now: (i * (i + 1)) / 2 })
    expect(lapWindow(timer, 95, 10)).toEqual([
      96, 97, 98, 99, 100, 101, 102, 103, 104, 105,
    ])
    expect(lapWindow(timer, 245, 100)).toEqual([246, 247, 248, 249, 250])
    expect(lapWindow(emptyTimer, 0, 100)).toEqual([])
  })
})
