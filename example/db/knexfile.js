
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: resolve('./data.sqlite'),
  },
  seeds: {
    directory: resolve('./seeds'),
  },
  migrations: {
    directory: resolve('./migrations'),
  },
  useNullAsDefault: true,
};

function resolve(relativePath) {
  const path = require('path');

  return path.resolve(__dirname, relativePath);
}
