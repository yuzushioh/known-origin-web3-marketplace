<template>
  <div>
    <div class="row">
      <div class="col p-4">
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
        <h5 class="text-center">Featured artists</h5>
        <h2 class="text-center">89-A</h2>
      </div>
    </div>

    <!--<div class="row bg-primary text-white">-->
      <!--<div class="col">Getting started</div>-->
      <!--<div class="col">A quick guide to buying art with Ethereum.</div>-->
    <!--</div>-->
  </div>

</template>

<script>

  import { mapGetters, mapState } from 'vuex';
  import Artist from '../Artist';
  import Gallery from './Gallery';

  export default {
    name: 'home',
    components: {},
    computed: {
      ...mapState([])
    },
    mounted() {

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
  }

  #brand_logo {
  }

  /* mobile only */
  @media screen and (max-width: 767px) {
    h1 {
      font-size: 48px;
    }

    .lead {
      font-size: 1rem;
    }
  }
</style>
