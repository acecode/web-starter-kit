'use strict';

describe('GoWebpackStarterApp', () => {
  let React = require('react/addons');
  let GoWebpackStarterApp, component;

  beforeEach(() => {
    let container = document.createElement('div');
    container.id = 'content';
    document.body.appendChild(container);

    GoWebpackStarterApp = require('components/GoWebpackStarterApp.js');
    component = React.createElement(GoWebpackStarterApp);
  });

  it('should create a new instance of GoWebpackStarterApp', () => {
    expect(component).toBeDefined();
  });
});
