const _ = require('lodash');

const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraApikey = 'nbCbdzC6IG9CF6hmvAVQ';
let mnemonic = require('../../mnemonic');

module.exports = (network, accounts, artistAccount) => {

  let _developerAccount = accounts[0];
  let _curatorAccount = accounts[1];

  if (network === 'ropsten' || network === 'rinkeby') {
    _developerAccount = new HDWalletProvider(mnemonic, `https://${network}.infura.io/${infuraApikey}`, 0).getAddress();
    _curatorAccount = '0x5bFFf3CB3231cF81487E80358b644f1A670Fd98b';
  }

  if (network === 'live') {
    let mnemonicLive = require('../../mnemonic_live');
    _developerAccount = new HDWalletProvider(mnemonicLive, `https://mainnet.infura.io/${infuraApikey}`, 0).getAddress();
    _curatorAccount = '0x5bFFf3CB3231cF81487E80358b644f1A670Fd98b';
  }

  let _artistAccount = _curatorAccount;

  // if supplied use as easier for us - and they get ETH direct!
  if (artistAccount) {
    _artistAccount = artistAccount;
  }

  console.log(`_curatorAccount = ${_curatorAccount}`);
  console.log(`_developerAccount = ${_developerAccount}`);
  console.log(`_artistAccount = ${_artistAccount}`);

  return {
    _curatorAccount,
    _developerAccount,
    _artistAccount
  };
};
