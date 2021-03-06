<template>
  <div class="card shadow-sm" v-if="asset">
    <img class="card-img-top" :src="asset.lowResImg"/>

    <ul class="list-group list-group-flush">
      <li class="list-group-item bg-danger text-center text-white" v-if="asset.purchased != 0 || availableAssetsForEdition(asset.edition).length == 0">
        SOLD
      </li>
    </ul>

    <div class="card-body">

      <p class="card-text">

        <token-id :value="asset.id"></token-id>

        <high-res-label :asset="asset"></high-res-label>

        <rarity-indicator :assets-in-edition="assetsForEdition(asset.edition)"></rarity-indicator>

        <span class="badge badge-light">1 of {{ assetsForEdition(asset.edition).length }}</span>

        <metadata-attributes :attributes="asset.attributes"></metadata-attributes>

        <span class="float-right">
          <tweet-asset-button :edition="asset" v-if="individual"></tweet-asset-button>
        </span>
      </p>

      <edition-name-by-artist :edition="asset"></edition-name-by-artist>

      <p class="card-text" v-if="individual">{{ asset.otherMeta.description }}</p>
    </div>

    <ul class="list-group list-group-flush">
      <li class="list-group-item">
        <small>
          <span class="text-muted">Owner:</span>
          <clickable-address :eth-address="asset.owner"></clickable-address>
        </small>
      </li>

      <li class="list-group-item text-center no-bottom-border">
        <price-in-eth :value="asset.priceInEther"></price-in-eth>
      </li>
    </ul>

    <div class="card-footer" v-if="!individual">
      <router-link :to="{ name: 'assetDetailView', params: { tokenId: asset.id} }" tag="button" class="btn btn-outline-primary btn-block">
        View asset
      </router-link>
    </div>

    <!-- disabled for now until we know more -->
    <!--<hr/>-->
    <!--<div>-->
    <!--<verify-purchase :asset-id="asset.id"></verify-purchase>-->

  </div>
</template>

<script>
  import { mapGetters, mapState } from 'vuex';
  import _ from 'lodash';
  import PurchaseState from './ui-controls/PurchaseState';
  import AddressIcon from './ui-controls/AddressIcon';
  import PriceInEth from './ui-controls/PriceInEth';
  import TokenId from './ui-controls/TokenId';
  import EditionNameByArtist from './ui-controls/EditionNameByArtist';
  import TweetPurchaseButton from "./ui-controls/TweetPurchasedAssetButton";
  import VerifyPurchase from "./ui-controls/VerifyPurchase";
  import ClickableAddress from './ui-controls/ClickableAddress';
  import TweetAssetButton from "./ui-controls/TweetAssetButton";
  import RarityIndicator from "./ui-controls/RarityIndicator";
  import MetadataAttributes from "./ui-controls/MetadataAttributes";
  import HighResLabel from "./ui-controls/HighResLabel.vue";

  export default {
    components: {
      HighResLabel,
      MetadataAttributes,
      RarityIndicator,
      VerifyPurchase,
      TweetPurchaseButton,
      AddressIcon,
      PurchaseState,
      PriceInEth,
      EditionNameByArtist,
      TokenId,
      ClickableAddress,
      TweetAssetButton
    },
    name: 'asset',
    props: {
      asset: {
        type: Object
      },
      individual: {
        type: Boolean
      }
    },
    computed: {
      ...mapGetters([
        'assetsForEdition',
        'availableAssetsForEdition'
      ]),
    }
  };
</script>

<style scoped lang="scss">
  li.no-bottom-border {
    border-bottom: 0 none;
  }
</style>
