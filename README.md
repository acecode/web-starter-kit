web-starter-kit
-----

Use Go, Webpack to build and package web application starter kit.

1. Use sweb to make web server
1. Use webpack to package all the frontend assets
1. Depends on GNU Make and fswatch

Demo:

1. Use [material-design-lite](https://getmdl.io) SCSS version as the basic style templates and customize the color and themes
1. Use React to build a MDL Component button
1. run `make dev` to start a local development watcher, auto watch assets change and go code change, restart the go web server
1. run `make dist` to create distribution packages, including all the assets, templates and binary which can be deployed
1. A `DemoApi` controller rendering JSON response
1. A `DemoController` controller rendering HTML response using templates

Big thanks to:

1. [go-starter-kit](https://github.com/olebedev/go-starter-kit)
1. [Webpack your bags](http://blog.madewithlove.be/post/webpack-your-bags/)
1. [react-transform-hmr](https://github.com/gaearon/react-transform-hmr)
1. [babel-preset-react-hmre](https://github.com/danmartinez101/babel-preset-react-hmre)

Hot module reload

[See webpack-dev-server doc](http://webpack.github.io/docs/webpack-dev-server.html#combining-with-an-existing-server)

1. `GO Web Server` should render all aseets with prefix the dev-server domain `http://localhost:8000`
2. As config in `webpack.config.js`, all the request (except the hot-update ones ) is proxied to `GO web Server`

Missing Parts:

1. Sprite images management and auto-generation
2. Config the port of both **Go Web Server** and **webpack-dev-server**, and config each one for the other