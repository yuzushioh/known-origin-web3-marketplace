const KnownOriginDigitalAsset = artifacts.require('KnownOriginDigitalAsset');

const loadSeedData = require('../../scripts/migrations/loadSeedData');
const loadContractCredentials = require('../../scripts/migrations/loadContractCredentials');
const blocktimestampPlusOne = require('../../scripts/migrations/blocktimestampPlusOne');

const ARTWORK = {
  "ipfsPath": "franky_aguilar_hype_death_of_the_scotty",
  "edition": "FKAHYPDTHSTY0DIG",
  "costInEth": 0.033 //$20
};


const galleryData = {
  "artists": [
    {
      'name': 'Franky Aguilar',
      "artworks": [ARTWORK, ARTWORK, ARTWORK, ARTWORK, ARTWORK/*, ARTWORK, ARTWORK, ARTWORK, ARTWORK, ARTWORK*/]
    }
  ]
};

const artistAccount = "0x2Eb9b439Ffb7dC587198e1534e465a6242192b24";

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
