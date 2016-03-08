'use strict';

var GoWebpackStarterApp = require('./GoWebpackStarterApp');
var React = require('react');
var Router = require('react-router');
var Route = Router.Route;

var content = document.getElementById('content');

var Routes = (
  <Route handler={GoWebpackStarterApp}>
    <Route name="/" handler={GoWebpackStarterApp}/>
  </Route>
);

Router.run(Routes, function (Handler) {
  React.render(<Handler/>, content);
});
