const path = require('path');

module.exports = startAllServers;

async function startAllServers(wildcardApiHolder) {
  const servers = (
    await Promise.all(
      [
        /*
        {serverFramework: 'express', httpPort: 3441},
        {serverFramework: 'koa', httpPort: 3442},
        */
        {serverFramework: 'hapi', httpPort: 3443},
      ]
      .map(async ({serverFramework, httpPort}) => {
        const startServer = require('./'+serverFramework);
        const staticDir = path.resolve(__dirname+'/../browser/dist/');
        const stop = await startServer({wildcardApiHolder, httpPort, staticDir});
        return {serverFramework, httpPort, stop};
      })
    )
  );
  return servers;
}
