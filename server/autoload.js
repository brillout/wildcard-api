const {projectDir, findFiles} = require('@brillout/project-files');

[
  ...findFiles('*.endpoints.*'),
  ...findFiles('endpoints.*'),
].forEach(endpointFile => {
  require(endpointFile);
});
