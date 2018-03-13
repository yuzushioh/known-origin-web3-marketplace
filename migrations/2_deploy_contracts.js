const _ = require('lodash');
const Eth = require('ethjs');

const KnownOriginDigitalAsset = artifacts.require('KnownOriginDigitalAsset');

const ipfsUploader = require('../scripts/ipfs-uploader');

const gallery_data = require('../config/data/gallery.json');

module.exports = function (deployer, network, accounts) {

  let _curatorAccount = accounts[0];
  let _commissionAccount = accounts[1];
  let _contractDeveloper = accounts[2];

  deployer
    .then(() => {
      return KnownOriginDigitalAsset.new(_commissionAccount, _contractDeveloper, {from: _curatorAccount})
    })
    .then((instance) => {

      console.log(`Deployed contract to address = [${instance.address}] to network [${network}]`);

      if (network === 'development') {
        return loadSeedData(instance, _curatorAccount)
          .then(() => instance)
      }
      return instance
    })

};

const loadSeedData = (instance, _curatorAccount) => {

  let flatInserts = flattenTestData();

  return Promise.all(_.map(flatInserts, (insert) => {
    console.log(`Seeding test data for [${insert.artworkName}]`);

    return ipfsUploader.uploadMetaData(insert)
      .then((res) => {

        // mint edition
        return instance.mintEdition(
          res.hash,
          insert.edition,
          insert.artistName,
          insert.artworkName,
          insert.type,
          insert.numberOfEditions,
          insert.costInWei.toString(10),
          insert.auctionStartDate,
          {
            from: _curatorAccount,
          }
        )
      })
  }));
};

const flattenTestData = () => {
  let flatInserts = [];

  _.forEach(gallery_data.artists, (artist) => {

    let artistName = artist.name;

    _.forEach(artist.artworks, (artwork) => {

      let artworkName = artwork.artworkName;
      let ipfsPath = artwork.ipfsPath;

      let type = artwork.type;

      let numberOfEditions = artwork.numberOfEditions;
      let edition = artwork.edition;

      let fiatCost = artwork.fiatCost;
      let costInWei = Eth.toWei(artwork.costInEth, 'ether');

      let auctionStartDate = 123; // TODO ability to convert start date to timestamp

      flatInserts.push({
        numberOfEditions,
        artworkName,
        fiatCost,
        costInWei,
        auctionStartDate,
        ipfsPath,
        edition,
        type,
        artistName
      })

    })
  });

  return flatInserts
};

/*
 "5777": {
 "events": {},
 "links": {},
 "address": "0x345ca3e014aaf5dca488057592ee47305d9b3e10",
 "transactionHash": "0x5494484f9242d926c550fa95e4b03ee3e961fb5350b44f329aad7f1274fe561c"
 }
 */
