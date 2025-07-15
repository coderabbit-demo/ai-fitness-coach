import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Custom render function that can be extended with providers if needed
const customRender = (ui: React.ReactElement, options?: RenderOptions) => {
  return render(ui, options);
};

// Re-export everything from testing-library/react
export * from '@testing-library/react';

// Override render method
export { customRender as render };