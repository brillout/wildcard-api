const {projectDir, findFiles} = require('@brillout/project-files');

const endpointFiles = findFiles('*.endpoints.*');

endpointFiles.forEach(endpointFile => {
  require(endpointFile);
});
