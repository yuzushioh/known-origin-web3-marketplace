const KnownOriginDigitalAsset = artifacts.require('KnownOriginDigitalAsset');

const loadSeedData = require('../../scripts/migrations/loadSeedData');
const loadContractCredentials = require('../../scripts/migrations/loadContractCredentials');
const blocktimestampPlusOne = require('../../scripts/migrations/blocktimestampPlusOne');

const ARTWORK = {
  "ipfsPath": "stan_ragets_treating_the_symptoms",
  "edition": "STRTRTSYM0001DIG",
  "costInEth": 0.109 //$65
};

const galleryData = {
  "artists": [
    {
      'name': 'Stan Ragets',
      "artworks": [ARTWORK]
    }
  ]
};

const artistAccount = "0x96DEAD6149f580884410c873F6dA8d3DDE16F13C";

module.exports = function (deployer, network, accounts) {

  const {_curatorAccount, _developerAccount, _artistAccount} = loadContractCredentials(network, accounts, artistAccount);

  deployer
    .then(() => KnownOriginDigitalAsset.deployed())
    .then((instance) => {
      console.log(`Deployed contract to address = [${instance.address}] to network [${network}]`);

      return blocktimestampPlusOne(web3).then((_openingTime) => {
        return {
          instance,
          _openingTime
        }
      });
    })
    .then(({instance, _openingTime}) => {

      if (network === 'ganache' || network === 'live' || network === 'ropsten' || network === 'rinkeby') {
        return loadSeedData(instance, _artistAccount, _openingTime, galleryData, _developerAccount);
      } else {
        console.log(`SKIPPING loading seed data as running on ${network}`);
      }

      return instance;
    });

};
