<template>
  <div class="container">
    <h1>Gallery</h1>

    <loading-spinner v-if="!hasFinishedLoading()"></loading-spinner>

    <div class="row justify-content-sm-center" v-if="!hasFinishedLoading()">
      <div class="col text-center mt-5">
        <p>We are loading assets from the Blockchain.</p>
        <p>Please be patient as we are fully decentralised.</p>
      </div>
    </div>

    <div class="form-row mb-4" v-if="hasFinishedLoading()">
      <div class="col">
        <select class="form-control" title="price filter" v-model="priceFilter">
          <option value="asc">Low to high</option>
          <option value="desc">High to low</option>
        </select>
      </div>
      <div class="col d-none d-md-block">
        <select class="form-control" title="artist filter" v-model="artistFilter">
          <option value="all">Artists...</option>
          <option v-for="{artistCode, name} in orderedArtists" :value="artistCode">{{name}}</option>
        </select>
      </div>
      <div class="col">
        <input type="text" class="form-control" v-model="search" placeholder="Search assets..."/>
      </div>
    </div>

    <div class="card-columns" v-if="editions.length > 0">
      <galleryEdition
        v-for="edition in editions"
        :edition="edition"
        :key="edition.edition">
      </galleryEdition>
    </div>

    <div class="form-row mb-4" v-if="hasFinishedLoading()">
      <div class="col">
        <toggle-button :value="showSold"
                       :labels="{checked: 'Sold', unchecked: 'Unsold'}"
                       :sync="true" color="#82C7EB" :width="65"
                       @change="onSoldToggleChanged">
        </toggle-button>
      </div>
    </div>
  </div>
</template>

<script>

  import {mapGetters, mapState} from 'vuex';
  import GalleryEdition from '../GalleryEdition';
  import LoadingSpinner from "../ui-controls/LoadingSpinner.vue";
  import _ from 'lodash';

  export default {
    name: 'gallery',
    components: {
      LoadingSpinner,
      GalleryEdition
    },
    data() {
      return {
        showSold: false,
        finishedLoading: false,
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
        if (this.assets.length === 0) {
          return false;
        }
        return this.editions.length > 0 || this.finishedLoading === true;
      },
    },
    computed: {
      ...mapState([
        'artists',
        'editionSummary',
        'assets',
      ]),
      orderedArtists: function () {
        return _.orderBy(this.artists, 'name');
      },
      editions: function () {
        this.finishedLoading = false;

        let results = this.$store.getters.editionSummaryFilter(this.showSold, this.priceFilter, this.artistFilter)
          .filter(function (item) {

            if (this.search.length === 0) {
              return true;
            }

            let matchesName = item.artworkName.toLowerCase().indexOf(this.search.toLowerCase()) >= 0;
            let matchesDescription = item.description.toLowerCase().indexOf(this.search.toLowerCase()) >= 0;
            let matchesArtist = item.otherMeta.artist.toLowerCase().indexOf(this.search.toLowerCase()) >= 0;

            return matchesName || matchesDescription || matchesArtist;
          }.bind(this));
        this.finishedLoading = true;
        return results;
      }
    }
  };
</script>

<style scoped lang="scss">
</style>
