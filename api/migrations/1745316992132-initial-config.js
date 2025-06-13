// @eslint-disable no-unused-vars
// @ts-ignore
const mongoose = require('mongoose');
const db = mongoose.connection;

module.exports.up = function (next) {
  db.collection('settings')
    .insertMany(
      [
        {
          name: 'partisiaClientUrl',
          value: 'https://node1.testnet.partisiablockchain.com',
        },
        {
          name: 'contractAddress',
          value: '03d2db81b2651e3b1cdc95ff73a7f8706b794288c8',
        },
        {
          name: 'network',
          value: 'testnet',
        },
        { name: 'tokenContractAddress', value: '021ec086dad3486eef2446bea29b64dc14616a4eb3' },
        { name: 'tokenName', value: 'Test Token' },
        { name: 'tokenSymbol', value: 'TT' },
        { name: 'tokenDecimals', value: '8' },
        { name: 'explorerUrl', value: 'https://browser.testnet.partisiablockchain.com' },
      ],
      { ordered: false }
    )
    .then(() => {
      console.log('Initial config added');
      next();
    })
    .catch((err) => {
      if (err && err.code === 11000) {
        // Duplicate key error, safe to ignore
        console.log('Some config already exists, ignoring duplicates.');
        next();
      } else {
        next(err);
      }
    });
};

module.exports.down = function (next) {
  next();
};
