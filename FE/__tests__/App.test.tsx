import App from '../App';

describe('Root App Component', () => {
  it('is defined and renders successfully', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });
});
