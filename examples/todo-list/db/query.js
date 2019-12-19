const fs = require('fs-extra');

module.exports = query;

async function query(...args) {
  await ensureDatabase();
  const knex = require('./knex');
  const ret = await knex.raw(...args);
  return ret;
}

var databaseExists;
async function ensureDatabase() {
  if( databaseExists ) {
    return;
  }
  if( ! await fs.pathExists(__dirname+'/data.sqlite') ) {
    await require('./reset');
  }
  databaseExists = true;
}
