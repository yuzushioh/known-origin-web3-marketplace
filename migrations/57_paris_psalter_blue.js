const Promise = require('bluebird');

const KnownOriginDigitalAsset = artifacts.require('KnownOriginDigitalAsset');

const loadSeedData = require('../scripts/migrations/loadSeedData');
const loadContractCredentials = require('../scripts/migrations/loadContractCredentials');

const galleryData = {
  "artists": [
    {
      "name": "Paris Psalter",
      "artworks": [
        {
          "ipfsPath": "paris_salter_blue",
          "edition": "PSPBLUE000000DIG",
          "numberOfEditions": 1,
          "costInEth": 0.2
        },
        {
          "ipfsPath": "paris_salter_blue",
          "edition": "PSPBLUE000000DIG",
          "numberOfEditions": 1,
          "costInEth": 0.2
        },
        {
          "ipfsPath": "paris_salter_blue",
          "edition": "PSPBLUE000000DIG",
          "numberOfEditions": 1,
          "costInEth": 0.2
        },
        {
          "ipfsPath": "paris_salter_blue",
          "edition": "PSPBLUE000000DIG",
          "numberOfEditions": 1,
          "costInEth": 0.2
        },
        {
          "ipfsPath": "paris_salter_blue",
          "edition": "PSPBLUE000000DIG",
          "numberOfEditions": 1,
          "costInEth": 0.2
        }
      ]
    }
  ]
};

let promisifyGetBlockNumber = Promise.promisify(web3.eth.getBlockNumber);
let promisifyGetBlock = Promise.promisify(web3.eth.getBlock);

module.exports = async function (deployer, network, accounts) {

  const {_developerAccount} = loadContractCredentials(network, accounts);

  const _curatorAccount = "0x32f04bedd52f32576a0d7fa8e3ca79d6ccdfe568";

  console.log(`Running within network = ${network}`);
  console.log(`_curatorAccount = ${_curatorAccount}`);
  console.log(`_developerAccount = ${_developerAccount}`);

  let instance = await KnownOriginDigitalAsset.deployed();
  let blockNumber = await  promisifyGetBlockNumber();
  let block = await  promisifyGetBlock(blockNumber);

  console.log(`Deployed contract to address = [${instance.address}] to network [${network}]`);

  if (network === 'ganache' || network === 'live' || network === 'ropsten' || network === 'rinkeby') {
    console.log(`Loading in seed data`);
    const _openingTime = block.timestamp + 1; // one second in the future

    return loadSeedData(instance, _curatorAccount, _openingTime, galleryData);
  } else {
    console.log(`SKIPPING loading seed data as running on ${network}`);
  }

  return instance;

};
