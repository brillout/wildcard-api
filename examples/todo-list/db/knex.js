const Knex = require('knex');

const knexfile = require('./knexfile');

const knex = Knex(knexfile);
module.exports = knex;
