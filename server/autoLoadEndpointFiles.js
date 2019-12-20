const {projectDir, findFiles} = require('@brillout/project-files');

module.exports = autoLoadEndpointFiles;

function autoLoadEndpointFiles() {
  [
    ...findFiles('*.endpoints.js'),
    ...findFiles('endpoints.js'),
  ].forEach(endpointFile => {
    require(endpointFile);
  });
}
