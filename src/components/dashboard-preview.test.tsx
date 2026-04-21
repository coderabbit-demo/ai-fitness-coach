import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { WeightProgressChart } from './dashboard-preview'

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
}))

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Bar: () => <div data-testid="bar" />,
  Line: ({ dataKey, strokeDasharray, strokeWidth }: any) => (
    <div
      data-testid={`line-${dataKey}`}
      data-datakey={dataKey}
      data-stroke-dasharray={strokeDasharray ?? ''}
      data-stroke-width={strokeWidth ?? ''}
    />
  ),
  ReferenceLine: ({ y, strokeDasharray, strokeWidth }: any) => (
    <div
      data-testid="target-reference-line"
      data-y={y}
      data-stroke-dasharray={strokeDasharray}
      data-stroke-width={strokeWidth}
    />
  ),
}))

describe('WeightProgressChart', () => {
  it('renders the goal as a dashed horizontal reference line instead of a target series', () => {
    const markup = renderToStaticMarkup(<WeightProgressChart />)

    expect(markup).toContain('data-testid="line-weight"')
    expect(markup).not.toContain('data-testid="line-target"')
    expect(markup).toContain('data-testid="target-reference-line"')
    expect(markup).toContain('data-y="175"')
    expect(markup).toContain('data-stroke-dasharray="6 6"')
    expect(markup).toContain('data-stroke-width="2"')
  })
})
