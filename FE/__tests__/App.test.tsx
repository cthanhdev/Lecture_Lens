import React from 'react';
import App from '../App';

describe('App Root Component', () => {
  it('renders as a valid function component', () => {
    expect(typeof App).toBe('function');
    const element = React.createElement(App);
    expect(React.isValidElement(element)).toBe(true);
  });
});
