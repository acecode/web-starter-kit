var path = require('path');
var fs = require('fs');
var _ = require('lodash');

 // AssetsExportPlugin Export assets Map
  // as:
  // ```json
  //    {
  //      "a.js": "a-e78567.js",
  //      "a.css": "a-3b27b7.css",
  //      "b.js": "b-e78567.js"
  //    }
  // ```

var AssetsExportPlugin = function(path){
    this.exportPath = path;
  }

  AssetsExportPlugin.prototype = {

    constructor: AssetsExportPlugin,

    apply: function( compiler ) {
      var self = this;

      // on `after-emit` Event
      // export the map
      compiler.plugin('after-emit', function(compilation, callback){
        console.log('webpack after-emit');
        var stats = compilation.getStats().toJson({
          hash: true,
          publicPath: true,
          assets: true,
          chunks: false,
          modules: false,
          source: false,
          errorDetails: false,
          timings: false
        });

        var json = {};
        _.forOwn(stats.assetsByChunkName, function(assets, key){

          // "a" : "a-xxxxx.js" => "a.js"

          function fullName(name, asset){
            return name + path.extname(asset);
          }

          // "a": ["a-xxx.js", "a-yyy.css"]
          if(_.isArray(assets)){
            _.each(assets, function(asset){
              if(asset.indexOf('.hot-update.')!== -1){
                return ;
              }
              json[fullName(key, asset)] = asset
            })

          // or "a": "a-xxx.js"
          }else{

            json[fullName(key, assets)] = assets;
          }
        })

        // save map to file

        fs.writeFile(
          self.exportPath,
          JSON.stringify(json, null, 4),
          {
            encoding: 'utf8',
            flag: 'w+'
          },
          function(err){
              if(err) {
                  console.error(err.message);
                  return;
              }
              setTimeout(callback, 2000)
          }
        );

      })
    }

  };

module.exports = AssetsExportPlugin
