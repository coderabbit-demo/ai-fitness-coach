import { renderToStaticMarkup } from 'react-dom/server'
import Page from './page'
import { createClient } from '@/utils/supabase/server'

jest.mock('@/utils/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('redirect')
  }),
}))
jest.mock('@/components/lap-tracker/LapTracker', () => ({
  __esModule: true,
  default: () => <div>Timer controls</div>,
}))

it('redirects unauthenticated visitors before rendering the tracker', async () => {
  jest.mocked(createClient).mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  } as never)
  await expect(Page()).rejects.toThrow('redirect')
})

it('renders the authenticated tracker with navigation', async () => {
  jest.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: async () => ({ data: { user: { id: 'user' } }, error: null }),
    },
  } as never)
  const html = renderToStaticMarkup(await Page())
  expect(html).toContain('Lap tracker')
  expect(html).toContain('Timer controls')
})
