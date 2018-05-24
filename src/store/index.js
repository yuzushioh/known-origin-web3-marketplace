import Vue from 'vue';
import Vuex from 'vuex';
import * as actions from './actions';
import * as mutations from './mutation-types';
import _ from 'lodash';
import Web3 from 'web3';
import axios from 'axios';
import artistData from './artist-data';
import createLogger from 'vuex/dist/logger';
import {getNetIdString, getEtherscanAddress, isHighRes} from '../utils';
import contract from 'truffle-contract';
import knownOriginDigitalAssetJson from '../../build/contracts/KnownOriginDigitalAsset.json';

const KnownOriginDigitalAsset = contract(knownOriginDigitalAssetJson);

Vue.use(Vuex);

const store = new Vuex.Store({
  plugins: [createLogger()],
  state: {
    // connectivity
    web3: null,
    account: null,
    accountBalance: null,
    currentNetwork: null,
    currentUsdPrice: null,
    etherscanBase: null,
    assetsPurchasedByAccount: [],

    // contract metadata
    contractName: '',
    contractSymbol: '',
    contractAddress: '',

    // contract totals
    totalSupply: null,
    tokenIdPointer: null,
    totalPurchaseValueInWei: null,
    totalNumberOfPurchases: null,
    totalPurchaseValueInEther: null,

    // contract addresses
    curatorAddress: null,
    contractDeveloperAddress: null,

    // non-contract data
    artists: artistData,
    assets: [],
    assetsByEditions: [],
    assetsByArtistCode: [],
    editionSummary: [],

    // Frontend state
    purchaseState: {},
    highResDownload: {},
  },
  getters: {
    assetsForEdition: (state) => (edition) => {
      return state.assets.filter((asset) => asset.edition === edition);
    },
    availableAssetsForEdition: (state, getters) => (edition) => {
      let editions = getters.assetsForEdition(edition);
      return _.filter(editions, {purchased: 0});
    },
    firstAssetForEdition: (state) => (edition) => {
      return _.head(state.assets.filter((asset) => asset.edition === edition));
    },
    findNextAssetToPurchase: (state, getters) => (edition) => {
      let editions = getters.assetsForEdition(edition.edition);
      return _.chain(editions)
      // find cheapest next edition (some editions can have different prices)
        .orderBy(['priceInEtherSortable', 'editionNumber'])
        .filter({purchased: 0})
        .head()
        .value();
    },
    assetById: (state) => (tokenId) => {
      return _.find(state.assets, (asset) => asset.id.toString() === tokenId.toString());
    },
    findArtist: (state) => (artistCode) => {
      return _.find(state.artists, (artist) => artist.artistCode.toString() === artistCode);
    },
    liveArtists: (state) => {
      return state.artists.filter((a) => a.live);
    },
    isKnownOrigin: (state) => {
      if (state.curatorAddress && state.account) {
        return state.curatorAddress.toLowerCase() === state.account.toLowerCase() || state.contractDeveloperAddress.toLowerCase() === state.account.toLowerCase();
      }
      return false;
    },
    lookupAssetsByArtistCode: (state) => (artistCode) => {
      return _.filter(state.assetsByEditions, (value, key) => key.startsWith(artistCode));
    },
    featuredAssets: (state) => () => {
      const featuredAssets = [150, 55, 60, 73, 124, 136, 37, 146, 39];
      return _.filter(state.assets, (asset) => {
        return featuredAssets.indexOf(asset.id) >= 0;
      });
    },
    editionSummaryFilter: (state) => (showSold = false, priceFilter = 'asc', artistFilter = 'all') => {

      const soldOutEditions = (edition) => {
        return edition.totalSupply === edition.totalPurchased;
      };

      const availableEditions = (edition) => {
        return edition.totalSupply !== edition.totalPurchased;
      };

      const artistCodeFilter = (edition) => {
        if (artistFilter === 'all') {
          return true;
        }
        return edition.artistCode === artistFilter;
      };

      const filtered = state.editionSummary
        .filter(showSold ? soldOutEditions : availableEditions)
        .filter(artistCodeFilter);

      return _.orderBy(filtered, 'priceInEther', priceFilter);
    },
    assetPurchaseState: (state) => (assetId) => {
      return _.get(state.purchaseState, assetId);
    },
    isPurchaseTriggered: (state, getters) => (assetId) => {
      return _.get(getters.assetPurchaseState(assetId), 'state') === mutations.PURCHASE_TRIGGERED;
    },
    isPurchaseStarted: (state, getters) => (assetId) => {
      return _.get(getters.assetPurchaseState(assetId), 'state') === mutations.PURCHASE_STARTED;
    },
    isPurchaseSuccessful: (state, getters) => (assetId) => {
      return _.get(getters.assetPurchaseState(assetId), 'state') === mutations.PURCHASE_SUCCESSFUL;
    },
    isPurchaseFailed: (state, getters) => (assetId) => {
      return _.get(getters.assetPurchaseState(assetId), 'state') === mutations.PURCHASE_FAILED;
    },
    getTransactionForAsset: (state, getters) => (assetId) => {
      return getters.assetPurchaseState(assetId).transaction;
    },
    totalEditions: (state, getters) => () => {
      return _.size(_.uniqBy(state.assets, 'edition'));
    },
    totalListedArtists: (state, getters) => () => {
      return _.size(_.uniqBy(state.assets, 'artistCode'));
    },
    mostExpensivePiece: (state, getters) => () => {
      return _.head(_.orderBy(state.assets, 'priceInEtherSortable', 'desc'));
    },
    cheapestPiece: (state, getters) => () => {
      return _.head(_.orderBy(state.assets, 'priceInEtherSortable', 'asc'));
    },
    getDownloadLinkForTokenId: (state) => (tokenId) => {
      return state.highResDownload[tokenId];
    }
  },
  mutations: {
    [mutations.SET_COMMISSION_ADDRESSES](state, {curatorAddress, contractDeveloperAddress, contractAddress}) {
      state.curatorAddress = curatorAddress;
      state.contractDeveloperAddress = contractDeveloperAddress;
      state.contractAddress = contractAddress;
    },
    [mutations.SET_ASSETS](state, {assets, assetsByEditions, assetsByArtistCode, editionSummary}) {
      Vue.set(state, 'assets', assets);
      Vue.set(state, 'assetsByEditions', assetsByEditions);
      Vue.set(state, 'assetsByArtistCode', assetsByArtistCode);
      Vue.set(state, 'editionSummary', editionSummary);
    },
    [mutations.SET_ARTISTS](state, {artists}) {
      state.artists = artists;
    },
    [mutations.SET_ASSETS_PURCHASED_FROM_ACCOUNT](state, tokens) {
      Vue.set(state, 'assetsPurchasedByAccount', tokens.map(val => val.toString(10)));
    },
    [mutations.SET_TOTAL_PURCHASED](state, {totalPurchaseValueInWei, totalNumberOfPurchases, totalPurchaseValueInEther}) {
      state.totalPurchaseValueInWei = totalPurchaseValueInWei;
      state.totalNumberOfPurchases = totalNumberOfPurchases;
      state.totalPurchaseValueInEther = totalPurchaseValueInEther;
    },
    [mutations.SET_CONTRACT_DETAILS](state, {name, symbol, totalSupply, tokenIdPointer}) {
      state.tokenIdPointer = tokenIdPointer;
      state.totalSupply = totalSupply;
      state.contractSymbol = symbol;
      state.contractName = name;
    },
    [mutations.SET_ACCOUNT](state, {account, accountBalance}) {
      state.account = account;
      state.accountBalance = accountBalance;
      store.dispatch(actions.GET_ASSETS_PURCHASED_FOR_ACCOUNT);

      // Full story identification of account for tracking
      /* global FS:true */
      FS.identify(account, {
        accountBalance: accountBalance,
        currentNetwork: state.currentNetwork
      });
    },
    [mutations.SET_CURRENT_NETWORK](state, currentNetwork) {
      state.currentNetwork = currentNetwork;
    },
    [mutations.SET_USD_PRICE](state, currentUsdPrice) {
      state.currentUsdPrice = currentUsdPrice;
    },
    [mutations.SET_ETHERSCAN_NETWORK](state, etherscanBase) {
      state.etherscanBase = etherscanBase;
    },
    [mutations.PURCHASE_TRIGGERED](state, {tokenId, buyer}) {
      state.purchaseState = {
        ...state.purchaseState,
        [tokenId]: {tokenId: tokenId.toString(10), buyer, state: 'PURCHASE_TRIGGERED'}
      };
    },
    [mutations.PURCHASE_FAILED](state, {tokenId, buyer}) {
      // Guard against the timed account check winner and the event coming through as failed
      if (state.purchaseState[tokenId].state === 'PURCHASE_SUCCESSFUL') {
        return;
      }
      state.purchaseState = {
        ...state.purchaseState,
        [tokenId]: {tokenId: tokenId.toString(10), buyer, state: 'PURCHASE_FAILED'}
      };
    },
    [mutations.PURCHASE_SUCCESSFUL](state, {tokenId, buyer}) {
      state.purchaseState = {
        ...state.purchaseState,
        [tokenId]: {
          tokenId: tokenId.toString(10),
          buyer,
          transaction: state.purchaseState[tokenId].transaction,
          state: 'PURCHASE_SUCCESSFUL'
        }
      };
    },
    [mutations.PURCHASE_STARTED](state, {tokenId, buyer, transaction}) {
      // Guard against the timed account check beating the event callbacks
      if (state.purchaseState[tokenId].state === 'PURCHASE_SUCCESSFUL') {
        state.purchaseState = {
          ...state.purchaseState,
          [tokenId]: {
            tokenId: tokenId.toString(10), buyer, transaction: transaction, state: 'PURCHASE_SUCCESSFUL'
          }
        };
        return;
      }

      state.purchaseState = {
        ...state.purchaseState,
        [tokenId]: {tokenId: tokenId.toString(10), buyer, transaction, state: 'PURCHASE_STARTED'}
      };
    },
    [mutations.UPDATE_PURCHASE_STATE](state, {tokenId}) {
      delete state.purchaseState[tokenId];
      state.purchaseState = {...state.purchaseState};
    },
    [mutations.HIGH_RES_DOWNLOAD](state, {tokenId, url}) {
      state.highResDownload = {...state.highResDownload, [tokenId]: url};
    },
    [mutations.SET_WEB3](state, web3) {
      state.web3 = web3;
    },
  },
  actions: {
    [actions.UPDATE_PURCHASE_STATE_FOR_ACCOUNT]({commit, dispatch, state}) {

      // Get the tokens which are currently in the process of being purchased
      let currentAssetsBeingPurchased = _.keys(state.purchaseState);

      Vue.$log.debug(`Currently owned assets [${state.assetsPurchasedByAccount}] - accounts purchase state [${currentAssetsBeingPurchased}]`);

      // Match all which the assets which are current being purchased against the accounts balance from the blockchain
      let accountOwnedAssetsBeingPurchased = _.intersection(state.assetsPurchasedByAccount, currentAssetsBeingPurchased);

      if (accountOwnedAssetsBeingPurchased.length > 0) {

        _.forEach(accountOwnedAssetsBeingPurchased, function (asset) {
          // If the asset is not marked as PURCHASE_SUCCESSFUL force state to move to this
          if (state.purchaseState[asset].state !== 'PURCHASE_SUCCESSFUL') {
            Vue.$log.debug(`Purchase state for token [${asset}] is [${state.purchaseState[asset].state}] - updating state to [PURCHASE_SUCCESSFUL]`);
            commit(mutations.PURCHASE_SUCCESSFUL, {
              tokenId: asset,
              buyer: state.account,
              force: true // mark this as a force transaction for debugging
            });

            dispatch(actions.REFRESH_CONTRACT_DETAILS); // update state of asserts etc
          }
        });
      }
    },
    [actions.GET_ASSETS_PURCHASED_FOR_ACCOUNT]({commit, dispatch, state}) {
      KnownOriginDigitalAsset.deployed()
        .then((contract) => {
          return contract.tokensOf(state.account)
            .then((tokens) => {
              commit(mutations.SET_ASSETS_PURCHASED_FROM_ACCOUNT, tokens);

              // Note: this must happen after committing the accounts balance
              dispatch(actions.UPDATE_PURCHASE_STATE_FOR_ACCOUNT);
            });
        })
        .catch((e) => {
          console.error(e);
          // TODO handle errors
        });
    },
    [actions.GET_CURRENT_NETWORK]({commit, dispatch, state}) {
      getNetIdString()
        .then((currentNetwork) => {
          commit(mutations.SET_CURRENT_NETWORK, currentNetwork);
        });
      getEtherscanAddress()
        .then((etherscanBase) => {
          commit(mutations.SET_ETHERSCAN_NETWORK, etherscanBase);
        });
    },
    [actions.RESET_PURCHASE_STATE]: function ({commit, dispatch, state}, asset) {
      dispatch(actions.GET_ALL_ASSETS);
      commit(mutations.UPDATE_PURCHASE_STATE, {tokenId: asset.id});
    },
    [actions.GET_USD_PRICE]: function ({commit, dispatch, state}) {

      axios.get('https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=USD')
        .then((response) => {
          let currentPriceInUSD = response.data[0].price_usd;
          commit(mutations.SET_USD_PRICE, currentPriceInUSD);
        }, (response) => {
          console.error(response);
        });
    },
    [actions.INIT_APP]({commit, dispatch, state}, web3) {

      dispatch(actions.GET_USD_PRICE);

      // NON-ASYNC action - set web3 provider on init
      KnownOriginDigitalAsset.setProvider(web3.currentProvider);

      //dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
      if (typeof KnownOriginDigitalAsset.currentProvider.sendAsync !== "function") {
        KnownOriginDigitalAsset.currentProvider.sendAsync = function () {
          return KnownOriginDigitalAsset.currentProvider.send.apply(
            KnownOriginDigitalAsset.currentProvider, arguments
          );
        };
      }

      // Set the web3 instance
      commit(mutations.SET_WEB3, web3);

      // Find current network
      dispatch(actions.GET_CURRENT_NETWORK);

      web3.eth.getAccounts()
        .then((accounts) => {

          let account = accounts[0];

          const setAccountAndBalance = (account) => {
            return web3.eth.getBalance(account)
              .then((balance) => {
                let accountBalance = Web3.utils.fromWei(balance);
                // store the account details
                commit(mutations.SET_ACCOUNT, {account, accountBalance});
              });
          };

          const refreshHandler = () => {
            web3.eth.getAccounts()
              .then((updatedAccounts) => {
                if (updatedAccounts[0] !== account) {
                  account = updatedAccounts[0];
                  return setAccountAndBalance(account);
                }
              });
          };

          // Every second check if the main account has changed
          setInterval(refreshHandler, 1000);

          // init the KODA contract
          dispatch(actions.REFRESH_CONTRACT_DETAILS);

          if (account) {
            return setAccountAndBalance(account);
          }
        })
        .catch(function (error) {
          console.log('ERROR - account locked', error);
          // TODO handle locked metamask account
        });
    },
    [actions.GET_ALL_ASSETS]({commit, dispatch, state}) {

      const lookupIPFSData = (tokenUri) => {

        // Load root IPFS data
        return axios.get(`${tokenUri}`)
          .then((tokenMeta) => {

            let rootMeta = tokenMeta.data;

            // Load additional meta about asset from IPFS
            return axios.get(`${rootMeta.meta}`)
              .then((otherMeta) => {
                return {
                  tokenUri: tokenUri,
                  name: rootMeta.name,
                  description: rootMeta.description,
                  external_uri: _.get(rootMeta, 'external_uri', 'http://knownorigin.io'),
                  attributes: _.get(rootMeta, 'attributes'),
                  otherMeta: otherMeta.data,
                  lowResImg: rootMeta.image
                };
              });
          });
      };

      const mapAssetType = (rawType) => {
        switch (rawType) {
          case 'DIG':
          // ERROR - the following two types have been patched in live, this needs to stay
          case '001':
          case 'D01':
            return 'digital';
          case 'PHY':
            return 'physical';
          default:
            return rawType;
        }
      };

      const lookupAssetInfo = (contract, index) => {
        return Promise.all([
          contract.assetInfo(index),
          contract.editionInfo(index)
        ])
          .then((results) => {
            let assetInfo = results[0];
            let editionInfo = results[1];

            const rawEdition = editionInfo[1];
            const owner = assetInfo[1];

            // Handle burnt tokens by checking edition and owner are both blank
            if (rawEdition === "0x00000000000000000000000000000000" && owner === "0x0000000000000000000000000000000000000000") {
              return null; // return nulls for for so we can strip them out at the nxt stage
            }

            // should always be 16 chars long
            const edition = Web3.utils.toAscii(rawEdition);

            const tokenUri = editionInfo[3];

            // Populate all data - minus tokenURI data
            return {
              id: assetInfo[0].toNumber(),
              owner: owner.toString(),
              purchased: assetInfo[2].toNumber(),
              priceInWei: assetInfo[3].toString(),
              priceInEther: Web3.utils.fromWei(assetInfo[3].toString(), 'ether').valueOf(),
              priceInEtherSortable: Web3.utils.fromWei(assetInfo[3].toString(), 'ether'),
              auctionStartDate: assetInfo[4].toString(10),

              edition: edition,
              // Last 3 chars of edition are type
              type: mapAssetType(edition.substring(13, 16)),
              // First 3 chars of edition are artist code
              artistCode: edition.substring(0, 3),
              editionNumber: editionInfo[2].toNumber(),
              tokenUri: tokenUri
            };
          });
      };

      KnownOriginDigitalAsset.deployed()
        .then((contract) => {
          let supply = _.range(0, state.tokenIdPointer);

          /**
           * Functions takes a list of assets and loads all the metadata associated with them, preventing duplicate tokenUris
           */
          const populateTokenUriData = (assets) => {

            // find unique tokenUri's as editions will share the same metadata
            let uniqueTokenUri = _.map(_.uniqBy(assets, 'tokenUri'), 'tokenUri');

            // Look up each unique tokenUri
            let tokenUriLookups = _.map(uniqueTokenUri, (tokenUri) => lookupIPFSData(tokenUri));

            return Promise.all(tokenUriLookups).then((results) => {

              // flatten out the array of loading IPFS data into a map keyed by {tokenUri:data}
              let dataByTokenUri = _.keyBy(results, 'tokenUri');

              // find and set metadata onto each asset
              return _.map(assets, (asset) => {

                // grab data by tokenUri
                let ipfsMeta = dataByTokenUri[asset.tokenUri];

                // set IPFS lookup back on object
                _.set(asset, 'artworkName', ipfsMeta.name);
                _.set(asset, 'description', ipfsMeta.description);
                _.set(asset, 'lowResImg', ipfsMeta.lowResImg);
                _.set(asset, 'external_uri', ipfsMeta.external_uri);
                _.set(asset, 'otherMeta', ipfsMeta.otherMeta);
                _.set(asset, 'highResAvailable', isHighRes(ipfsMeta));

                if (ipfsMeta.attributes) {
                  _.set(asset, 'attributes', ipfsMeta.attributes);
                }

                return asset;
              });
            });
          };

          /**
           * Functions takes a set of assets, maps to various models and set on the store
           */
          const bindAssetsToStore = (assets) => {

            let assetsByEditions = _.groupBy(assets, 'edition');
            let assetsByArtistCode = _.groupBy(assets, 'artistCode');

            // flatten out the editions so we can easily work with them on the gallery page
            let editionSummary = _.map(assetsByEditions, function (assets, editionKey) {

              let editionSummary = {
                edition: editionKey,
                totalSupply: assets.length,
                totalPurchased: assets.filter((asset) => asset.purchased === 1 || asset.purchased === 2).length
              };

              // Add the first asset to the flat list
              _.extend(editionSummary, assets[0]);

              // chop the ID to ensure its not an asset
              delete editionSummary.id;
              delete editionSummary.purchased;

              return editionSummary;
            });

            commit(mutations.SET_ASSETS, {
              assets: assets,
              assetsByEditions: assetsByEditions,
              assetsByArtistCode: assetsByArtistCode,
              editionSummary: editionSummary,
            });
          };

          return Promise.all(_.map(supply, (index) => lookupAssetInfo(contract, index)))
            .then((assets) => {
              // Strip out burnt tokens which will appear as nulls in the list
              return _.without(assets, null);
            })
            .then(populateTokenUriData)
            .then(bindAssetsToStore);
        });
    },
    [actions.REFRESH_CONTRACT_DETAILS]({commit, dispatch, state}) {
      KnownOriginDigitalAsset.deployed()
        .then((contract) => {

          Promise.all([contract.curatorAccount(), contract.developerAccount(), contract.address])
            .then((results) => {
              commit(mutations.SET_COMMISSION_ADDRESSES, {
                curatorAddress: results[0],
                contractDeveloperAddress: results[1],
                contractAddress: results[2]
              });
            });

          Promise.all([contract.name(), contract.symbol(), contract.totalSupply(), contract.tokenIdPointer()])
            .then((results) => {
              commit(mutations.SET_CONTRACT_DETAILS, {
                name: results[0],
                symbol: results[1],
                totalSupply: results[2].toString(),
                tokenIdPointer: results[3].toString(),
              });

              // We require totalSupply to lookup all ASSETS
              dispatch(actions.GET_ALL_ASSETS);
            });

          Promise.all([contract.totalPurchaseValueInWei(), contract.totalNumberOfPurchases()])
            .then((results) => {
              commit(mutations.SET_TOTAL_PURCHASED, {
                totalPurchaseValueInEther: Web3.utils.fromWei(results[0].toString(10), 'ether'),
                totalPurchaseValueInWei: results[0].toString(10),
                totalNumberOfPurchases: results[1].toString(10)
              });
            });
        }).catch((error) => console.log("Something went bang!", error));
    },
    [actions.PURCHASE_ASSET]: function ({commit, dispatch, state}, assetToPurchase) {
      Vue.$log.debug(`Attempting purchase of ${assetToPurchase.type} asset - ID ${assetToPurchase.id}`);

      KnownOriginDigitalAsset.deployed()
        .then((contract) => {

          let _buyer = state.account;
          let _tokenId = assetToPurchase.id;

          let purchaseEvent = contract.PurchasedWithEther({_tokenId: _tokenId, _buyer: _buyer}, {
            fromBlock: web3.eth.blockNumber,
            toBlock: 'latest' // wait until event comes through
          });

          // Trigger a timer to check the accounts purchases - can provide update faster waiting for the event
          const timer = setInterval(function () {
            console.log("Dispatching GET_ASSETS_PURCHASED_FOR_ACCOUNT");
            dispatch(actions.GET_ASSETS_PURCHASED_FOR_ACCOUNT);
          }, 1000);

          purchaseEvent.watch(function (error, result) {
            if (!error) {
              // 3) Purchase succeeded
              console.log('Purchase successful', result);
              dispatch(actions.REFRESH_CONTRACT_DETAILS);
              dispatch(actions.GET_ASSETS_PURCHASED_FOR_ACCOUNT);
              commit(mutations.PURCHASE_SUCCESSFUL, {tokenId: _tokenId, buyer: _buyer});
            } else {
              console.log('Failure', error);
              // Purchase failure
              commit(mutations.PURCHASE_FAILED, {tokenId: _tokenId, buyer: _buyer});
              purchaseEvent.stopWatching();
            }
            if (timer) clearInterval(timer);
          });

          // 1) Initial purchase flow
          commit(mutations.PURCHASE_TRIGGERED, {tokenId: _tokenId, buyer: _buyer});

          let purchase = contract.purchaseWithEther(_tokenId, {
            from: _buyer,
            value: assetToPurchase.priceInWei
          });

          purchase
            .then((data) => {
              // 2) Purchase transaction submitted
              console.log('Purchase transaction submitted', data);
              commit(mutations.PURCHASE_STARTED, {tokenId: _tokenId, buyer: _buyer, transaction: data.tx});
            })
            .catch((error) => {
              // Purchase failure
              console.log('Purchase rejection/error', error);
              commit(mutations.PURCHASE_FAILED, {tokenId: _tokenId, buyer: _buyer});
              if (timer) clearInterval(timer);
            });
        })
        .catch((e) => {
          console.log('Failure', e);
          commit(mutations.PURCHASE_FAILED, {tokenId: assetToPurchase.id, buyer: state.account});
        });
    },
    [actions.PURCHASE_ASSET_WITH_FIAT]({commit, dispatch, state} = controls, assetToPurchase) {

      let _buyer = state.account;
      let _tokenId = assetToPurchase.id;

      return KnownOriginDigitalAsset.deployed()
        .then((contract) => {

          let purchaseEvent = contract.PurchasedWithFiat({_tokenId: _tokenId}, {
            fromBlock: web3.eth.blockNumber,
            toBlock: 'latest' // wait until event comes through
          });

          purchaseEvent.watch(function (error, result) {
            if (!error) {
              // 3) Purchase succeeded
              dispatch(actions.REFRESH_CONTRACT_DETAILS);
              dispatch(actions.GET_ASSETS_PURCHASED_FOR_ACCOUNT);
              commit(mutations.PURCHASE_SUCCESSFUL, {tokenId: _tokenId, buyer: _buyer});
            } else {
              // Purchase failure
              commit(mutations.PURCHASE_FAILED, {tokenId: _tokenId, buyer: _buyer});
              purchaseEvent.stopWatching();
              console.log('Failure', error);
            }
          });

          // 1) Initial purchase flow
          commit(mutations.PURCHASE_TRIGGERED, {tokenId: _tokenId, buyer: _buyer});

          let purchase = contract.purchaseWithFiat(_tokenId, {from: _buyer});

          purchase
            .then((data) => {
              // 2) Purchase transaction submitted
              console.log('Purchase transaction submitted', data);
              commit(mutations.PURCHASE_STARTED, {tokenId: _tokenId, buyer: _buyer, transaction: data.tx});
            })
            .catch((error) => {
              // Purchase failure
              console.log('Purchase rejection/error', error);
              commit(mutations.PURCHASE_FAILED, {tokenId: _tokenId, buyer: _buyer});
            });
        })
        .catch((e) => {
          console.log('Failure', e);
          commit(mutations.PURCHASE_FAILED, {tokenId: assetToPurchase.id, buyer: state.account});
        });
    },
    [actions.REVERSE_PURCHASE_ASSET_WITH_FIAT]({commit, dispatch, state}, assetToPurchase) {

      let _buyer = state.account;
      let _tokenId = assetToPurchase.id;

      return KnownOriginDigitalAsset.deployed()
        .then((contract) => {

          let purchaseEvent = contract.PurchasedWithFiatReversed({_tokenId: _tokenId}, {
            fromBlock: web3.eth.blockNumber,
            toBlock: 'latest' // wait until event comes through
          });

          purchaseEvent.watch(function (error, result) {
            if (!error) {
              // 3) Purchase succeeded
              dispatch(actions.REFRESH_CONTRACT_DETAILS);
              dispatch(actions.GET_ASSETS_PURCHASED_FOR_ACCOUNT);
              commit(mutations.PURCHASE_SUCCESSFUL, {tokenId: _tokenId, buyer: _buyer});
            } else {
              // Purchase failure
              commit(mutations.PURCHASE_FAILED, {tokenId: _tokenId, buyer: _buyer});
              purchaseEvent.stopWatching();
              console.log('Failure', error);
            }
          });

          // 1) Initial purchase flow
          commit(mutations.PURCHASE_TRIGGERED, {tokenId: _tokenId, buyer: _buyer});

          let purchase = contract.reverseFiatPurchase(_tokenId, {from: _buyer});

          purchase
            .then((data) => {
              // 2) Purchase transaction submitted
              console.log('Purchase transaction submitted', data);
              commit(mutations.PURCHASE_STARTED, {tokenId: _tokenId, buyer: _buyer, transaction: data.tx});
            })
            .catch((error) => {
              // Purchase failure
              console.log('Purchase rejection/error', error);
              commit(mutations.PURCHASE_FAILED, {tokenId: _tokenId, buyer: _buyer});
            });
        })
        .catch((e) => {
          console.log('Failure', e);
          commit(mutations.PURCHASE_FAILED, {tokenId: assetToPurchase.id, buyer: state.account});
        });
    },
    [actions.HIGH_RES_DOWNLOAD]({commit, dispatch, state}, asset) {

      const requestHighResDownload = ({originalMessage, signedMessage}) => {
        return state.web3.eth.net.getId()
          .then((networkId) => {

            const options = {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-Requested-By': `${window.href}`
              },
              data: {
                address: state.account,
                tokenId: asset.id,
                originalMessage,
                signedMessage,
                networkId
              },
              // TODO switch this out for live firebase function once hosted
              url: 'http://localhost:5000/known-origin-io/us-central1/highResDownload',
            };

            return axios(options);
          });
      };

      const validateResponse = (response) => {
        console.log(response);
        if (response.status === 202 && response.data.url) {
          // TODO can we open a download link to this?
          // window.open(response.data.url, '_blank');
          commit(mutations.HIGH_RES_DOWNLOAD, {url: response.data.url, tokenId: asset.id});
        } else {
          // TODO handle failure
        }
      };

      let message =
        `I verify that I [${state.account}] have purchased this asset from KnownOrigin\n\nKnownOrigin edition=[${asset.edition}] assetId=[${asset.id}]\n\nBy signing this transaction you adhear to the license agreement found here https://knownorigin.io/license and to not infringe copyright associated to this asset`;

      state.web3.eth.personal
        .sign(message, state.account)
        .then((result) => requestHighResDownload({
          originalMessage: message,
          signedMessage: result
        }))
        .then((response) => validateResponse(response));
    }
  }
});

export default store;
