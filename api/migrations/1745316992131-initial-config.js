// @eslint-disable no-unused-vars
// @ts-ignore
const mongoose = require('mongoose');
const db = mongoose.connection;

module.exports.up = function (next) {
  db.collection('settings')
    .insertMany([
      {
        name: 'partisiaClientUrl',
        value: 'https://node1.testnet.partisiablockchain.com',
      },
      {
        name: 'contractAddress',
        value: '03c9e747c630ff245ed552288542968b8b71f8b41d',
      },
      {
        name: 'network',
        value: 'testnet',
      },
    ])
    .then(() => {
      console.log('Initial config added');
      next();
    });
};

module.exports.down = function (next) {
  next();
};
