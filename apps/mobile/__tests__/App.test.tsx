import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

describe('App', () => {
  it('renders the provider and navigation root', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<App />);
    });

    expect(renderer?.toJSON()).not.toBeUndefined();
  });
});
