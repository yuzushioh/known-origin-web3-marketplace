<template>
  <div>
    <div class="row">
      <div class="col lead-section">
        <h1>Rare<br/>digital<br/>assets.</h1>
        <p class="lead">Discover, buy and collect digital artwork by some of the worlds most respected artists, illustrators and creative practitioners.</p>
        <router-link :to="{ name: 'gallery' }" class="btn btn-outline-primary btn-lg">Open gallery</router-link>
      </div>
    </div>

    <div class="row bg-primary" id="brand_logo">
      <div class="col text-center">
        <img src="../../../static/KO_dots.jpg" height="300px"/>
      </div>
    </div>

    <div class="row">
      <div class="col mt-4">
        <h5 class="text-center pb-4">Featured artists</h5>
        <div class="card-columns">
          <galleryEdition
            v-for="assetEdition, key in lookupAssetsByArtistCode('AKP')"
            :edition="assetEdition[0]"
            :key="key">
          </galleryEdition>

          <galleryEdition
            v-for="assetEdition, key in lookupAssetsByArtistCode('89A')"
            :edition="assetEdition[0]"
            :key="key">
          </galleryEdition>
        </div>

      </div>
    </div>

    <hr/>

    <div class="row">
      <div class="col mt-4 mb-4 text-center">
        <h2><strong>Join the collective</strong></h2>
        <p>Head over to our artist micro-site to learn how to get involved...</p>
        <router-link :to="{ name: 'gallery' }" class="btn btn-outline-primary btn-lg">I want to be a KnownOrigin Artist</router-link>
      </div>
    </div>

    <!--<div class="row">-->
      <!--<div class="col bg-primary text-white">-->
        <!--<h4>Getting started: A quick guide to buying art with Ethereum.</h4>-->
        <!--<p>We have created a short guide for those new to cryptocurrencies and Ethereum wallets.</p>-->
        <!--<p>This will give you the basics you need to purchase Artwork via KnownOrigin.io</p>-->
        <!--<router-link :to="{ name: 'gallery' }" class="btn btn-outline-primary btn-lg">I want to be a KnownOrigin Artist</router-link>-->
      <!--</div>-->
    <!--</div>-->

    <!--<hr/>-->

    <!--<div class="row">-->
      <!--<div class="col mt-4">-->
        <!--<p class="lead quote m-4">Can we use the power of Ethereum blockchain and the integrity of digital assets in the art world to improve the proof of ownership, provenance, authenticity and reducing forgery of artwork?</p>-->
        <!--<router-link :to="{ name: 'gallery' }">Read full article</router-link>-->
      <!--</div>-->
    <!--</div>-->

  </div>

</template>

<script>

  import { mapGetters, mapState } from 'vuex';
  import ArtistShortBio from '../ui-controls/ArtistShortBio';
  import Asset from '../Asset';
  import GalleryEdition from '../GalleryEdition';

  export default {
    name: 'home',
    components: {ArtistShortBio, GalleryEdition},
    computed: {
      ...mapGetters(['lookupAssetsByArtistCode'])
    },
    methods: {
      lookupArtist: function () {
        return this.$store.getters.findArtist(this.$route.params.artistCode);
      }
    }
  };
</script>

<style scoped lang="scss">
  $body-bg: #f2f5fb;
  $body-color: #545454;
  $primary: #3e27d9;

  h1 {
    color: #000;
    line-height: 85%;
    font-size: 100px;
    font-weight: 700;
    font-family: 'Poppins', sans-serif;
  }

  h2 {
    font-size: 78px;
  }

  h5 {
    text-transform: uppercase;
    color: $primary;
  }

  .lead-section {
      margin-left: 250px;
      margin-bottom: 50px;
      margin-top: 25px;
  }

  .bg-primary {
    margin-top: 50px;
  }

  .quote {
    font-style: italic;
  }

  /* mobile only */
  @media screen and (max-width: 767px) {
    h1 {
      font-size: 48px;
    }

    .lead {
      font-size: 1rem;
    }

    .lead-section {
      margin-left: 50px;
    }
  }
</style>
