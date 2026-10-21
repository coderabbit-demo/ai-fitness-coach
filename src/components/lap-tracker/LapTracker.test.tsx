/** @jest-environment jsdom */
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import LapTracker from './LapTracker'

let clock = 0
const id = 'b3b286cc-8ce6-4518-b6d3-b663beb88f78'
const response = (data: unknown, ok = true) =>
  Promise.resolve({ ok, json: async () => data } as Response)

beforeEach(() => {
  jest.useFakeTimers()
  clock = 0
  jest.spyOn(performance, 'now').mockImplementation(() => clock)
  jest.spyOn(crypto, 'randomUUID').mockReturnValue(id)
  global.fetch = jest.fn().mockImplementation(() => response({ data: [] }))
})
afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

async function mount() {
  render(<LapTracker />)
  await screen.findByText(/No saved sessions yet/)
}
const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))
function repaint(at: number) {
  clock = at
  act(() => {
    jest.advanceTimersByTime(50)
  })
}

it('shows the live timer, immediate completed-lap average, and excludes pause time', async () => {
  await mount()
  expect(screen.getByTestId('average-time')).toHaveTextContent('—')
  click('Start')
  repaint(60000)
  click('Lap')
  expect(screen.getByTestId('average-time')).toHaveTextContent('01:00.00')
  repaint(125000)
  click('Lap')
  expect(screen.getByTestId('average-time')).toHaveTextContent('01:02.50')
  repaint(180000)
  click('Lap')
  expect(screen.getByTestId('lap-count')).toHaveTextContent('3')
  expect(screen.getByTestId('average-time')).toHaveTextContent('01:00.00')
  repaint(185000)
  click('Pause')
  repaint(300000)
  expect(screen.getByTestId('current-time')).toHaveTextContent('00:05.00')
  click('Resume')
  repaint(305000)
  expect(screen.getByTestId('current-time')).toHaveTextContent('00:10.00')
})

it('catches up when a background tab becomes visible without interval ticks', async () => {
  await mount()
  click('Start')
  clock = 600000.25
  fireEvent(document, new Event('visibilitychange'))
  expect(screen.getByTestId('current-time')).toHaveTextContent('10:00.00')
  click('Lap')
  expect(screen.getByTestId('average-time')).toHaveTextContent('10:00.00')
})

it('freezes finish, offers both partial choices, preserves failed saves, and retries the exact payload', async () => {
  await mount()
  click('Start')
  repaint(60000.125)
  click('Lap')
  repaint(75000.375)
  click('Finish')
  expect(screen.getByRole('button', { name: 'Record final lap' })).toBeEnabled()
  expect(
    screen.getByRole('button', { name: 'Discard final lap' }),
  ).toBeEnabled()
  repaint(200000)
  click('Discard final lap')
  expect(screen.getByTestId('average-time')).toHaveTextContent('01:00.00')
  const mockFetch = jest.mocked(fetch)
  mockFetch.mockImplementationOnce(() =>
    response({ error: 'Connection lost' }, false),
  )
  click('Save session')
  await screen.findByText(/Connection lost/)
  const firstPayload = JSON.parse(mockFetch.mock.calls[1][1]!.body as string)
  expect(firstPayload).toMatchObject({
    id,
    elapsed_ms: 75000.375,
    laps_ms: [60000.125],
  })
  expect(screen.getByTestId('lap-count')).toHaveTextContent('1')
  mockFetch.mockImplementation((_url, init) =>
    response({
      data:
        init?.method === 'POST'
          ? firstPayload
          : [{ ...firstPayload, created_at: firstPayload.finished_at }],
    }),
  )
  click('Retry save')
  await screen.findByText('Session saved.')
  expect(JSON.parse(mockFetch.mock.calls[2][1]!.body as string)).toEqual(
    firstPayload,
  )
  expect(screen.getByText(/1 laps · Average/)).toBeInTheDocument()
  click('New session')
  expect(screen.getByTestId('lap-count')).toHaveTextContent('0')
  expect(screen.getByTestId('average-time')).toHaveTextContent('—')
})

it('can record the first partial lap or save no completed laps', async () => {
  await mount()
  click('Start')
  repaint(1250.25)
  click('Finish')
  click('Record final lap')
  expect(screen.getByTestId('lap-count')).toHaveTextContent('1')
  expect(screen.getByTestId('average-time')).toHaveTextContent('00:01.25')
  jest.spyOn(window, 'confirm').mockReturnValue(true)
  click('Discard session')
  click('Start')
  click('Finish')
  expect(
    screen.getByRole('button', { name: 'Record final lap' }),
  ).toBeDisabled()
  click('Discard final lap')
  expect(screen.getByTestId('average-time')).toHaveTextContent('—')
  expect(screen.getByRole('button', { name: 'Save session' })).toBeEnabled()
})

it('reports history errors separately and supports loading older sessions', async () => {
  const saved = {
    id,
    started_at: '2026-10-21T10:00:00.000Z',
    finished_at: '2026-10-21T10:03:00.000Z',
    elapsed_ms: 180000,
    laps_ms: [60000, 65000, 55000],
    created_at: '2026-10-21T10:03:01.000Z',
  }
  jest
    .mocked(fetch)
    .mockImplementationOnce(() =>
      response({ error: 'History unavailable' }, false),
    )
  render(<LapTracker />)
  await screen.findByText('History unavailable')
  jest.mocked(fetch).mockImplementationOnce(() =>
    response({
      data: Array.from({ length: 20 }, (_, i) => ({ ...saved, id: `${i}` })),
    }),
  )
  click('Retry history')
  await screen.findByRole('button', { name: 'Load older sessions' })
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Load older sessions' }),
    ).toBeEnabled(),
  )
  jest
    .mocked(fetch)
    .mockImplementationOnce(() =>
      response({ data: [{ ...saved, id: 'older' }] }),
    )
  click('Load older sessions')
  await waitFor(() =>
    expect(fetch).toHaveBeenLastCalledWith('/api/lap-sessions?offset=20', {
      cache: 'no-store',
    }),
  )
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Load older sessions' }),
    ).not.toBeInTheDocument(),
  )
  expect(screen.getAllByText(/3 laps · Average 01:00.00/)).toHaveLength(21)
})
