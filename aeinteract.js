const ae = require("after-effects");
const path = require("path");
ae.options.errorHandling = true;
ae.options.minify = false;
ae.options.includes = [
  "./node_modules/after-effects/lib/includes/console.jsx",
  "./node_modules/after-effects/lib/includes/es5-shim.jsx",
  "./node_modules/after-effects/lib/includes/get.jsx",
  "./es6-shims.jsx",
];

// ae.options.program = path.join('OtherAppDirectory','Adobe After Effects 2015');

/**
 * @param  {String} filePath - path of aep or aepx file
 */
const getProjectStructure = (filePath) =>
  ae
    .execute((fp) => {
      // don't open file if already loaded
      if (!(app.project.file && app.project.file.toString().includes(fp)))
        app.open(new File(fp));

      const staticAssets = [];

      get([FootageItem]).each((x) => {
        if (
          x.mainSource.missingFootagePath &&
          !staticAssets.includes(x.mainSource.missingFootagePath)
        )
          staticAssets.push(x.mainSource.missingFootagePath);
      });

      function getCompStructure(compName) {
        if (!compName) return;
        // return if no comp with such name
        if (!get(CompItem, compName).count()) return null;

        const textLayers = [];
        const imageLayers = [];
        const comps = {};

        get(
          [AVLayer, TextLayer],
          get(CompItem, compName).selection(0).layers
        ).each((x) => {
          const item = {};
          if (x) {
            if (x.source && x.source.constructor === CompItem) {
              comps[x.name] = getCompStructure(x.name);
            } else {
              if (x.constructor === AVLayer) {
                if (x.source.mainSource.isStill) {
                  item["name"] = new String(x.name);
                  item["height"] = x.height;
                  item["width"] = x.width;
                  imageLayers.push(item);
                } else {
                  //handle video file here
                }
              } else if (x.constructor === TextLayer) {
                const item = {};
                item["index"] = x.index;
                item["name"] = new String(x.name);
                item["text"] = new String(x.property("Source Text").value);
                item["font"] = x.property("Source Text").value.font;
                textLayers.push(item);
              }
            }
          }
        });
        return { textLayers, imageLayers, comps };
      }

      //purge memory
      app.purge(PurgeTarget.ALL_CACHES);

      result = {};

      const comps = [];
      get(CompItem).each((x) => comps.push(x.name));
      comps.map((c) => {
        result[c] = getCompStructure(c);
      });
      return { compositions: result, staticAssets };
    }, path.resolve(filePath))
    .catch(console.error);
module.exports = { getProjectStructure };
