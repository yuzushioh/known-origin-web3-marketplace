<template>
  <div class="container">
    <h1>Assets <span class="badge badge-primary" v-if="assets.length > 0">{{ assets.length }}</span></h1>

    <loading-spinner v-if="!hasFinishedLoading()"></loading-spinner>

    <div class="row justify-content-sm-center" v-if="!hasFinishedLoading()">
      <div class="col text-center mt-5">
        <p>We are loading assets from the Blockchain.</p>
        <p>Please be patient as we are fully decentralised.</p>
      </div>
    </div>

    <div class="form-row mb-4" v-if="hasFinishedLoading()">
      <div class="col">
        <input type="text" class="form-control" v-model="search" placeholder="Search assets..."/>
      </div>
      <div class="col d-none d-md-block">
        <select class="form-control" title="artist filter" v-model="artistFilter">
          <option value="all">Artists...</option>
          <option v-for="{artistCode, name} in orderedArtists" :value="artistCode">{{name}}</option>
        </select>
      </div>
      <div class="col-1">
        <toggle-button :value="showSold"
                       :labels="{checked: 'Sold', unchecked: 'All'}"
                       :sync="true" color="#82C7EB" :width="70"
                       @change="onSoldToggleChanged">
        </toggle-button>
      </div>
    </div>

    <div class="card-columns" v-if="assets.length > 0">
      <asset v-for="asset in filteredAssets"
             :asset="asset"
             :key="asset.id">
      </asset>
    </div>

  </div>
</template>

<script>

  import {mapGetters, mapState} from 'vuex';
  import Artist from '../Artist';
  import Gallery from './Gallery';
  import Asset from '../Asset';
  import AddressIcon from '../ui-controls/AddressIcon';
  import EthAddress from '../ui-controls/EthAddress';
  import LoadingSpinner from "../ui-controls/LoadingSpinner.vue";
  import _ from 'lodash';

  export default {
    name: 'assets',
    components: {
      LoadingSpinner,
      Asset
    },
    data() {
      return {
        showSold: false,
        priceFilter: 'asc',
        artistFilter: 'all',
        search: ''
      };
    },
    methods: {
      onSoldToggleChanged: function ({value}) {
        this.showSold = value;
      },
      hasFinishedLoading: function () {
        // Use the lack of assets in the store to determine initial loading state
        if (this.assets === null) {
          return false;
        }
        return this.assets.length > 0;
      },
    },
    computed: {
      ...mapState([
        'assets',
        'artists'
      ]),
      orderedArtists: function () {
        return _.orderBy(this.artists, 'name');
      },
      filteredAssets: function () {
        return this.$store.getters.editionSummaryFilter(this.showSold, this.priceFilter, this.artistFilter)
          .filter(function (item) {

            if (this.search.length === 0) {
              return true;
            }

            let matchesName = item.artworkName.toLowerCase().indexOf(this.search.toLowerCase()) >= 0;
            let matchesDescription = item.description.toLowerCase().indexOf(this.search.toLowerCase()) >= 0;
            let matchesArtist = item.otherMeta.artist.toLowerCase().indexOf(this.search.toLowerCase()) >= 0;

            return matchesName || matchesDescription || matchesArtist;
          }.bind(this));
      }
    }
  };
</script>

<style scoped>
</style>
