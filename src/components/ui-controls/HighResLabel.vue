<template>
  <span class="high-res-container" v-if="asset.highResAvailable">
    <span class="badge badge-secondary">
      high res
    </span>
    <high-res-download :asset="asset" :v-if="asset.owner === account"></high-res-download>
  </span>
</template>

<script>
  import FontAwesomeIcon from '@fortawesome/vue-fontawesome';
  import HighResDownload from "./HighResDownload.vue";
  import {mapGetters, mapState} from 'vuex';

  export default {
    components: {
      HighResDownload,
      FontAwesomeIcon
    },
    name: 'highResLabel',
    props: ['asset'],
    computed: {
      ...mapState([
        'account',
      ]),
    },
  };
</script>

<style scoped>

</style>
