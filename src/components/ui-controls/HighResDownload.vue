<template>
  <div v-if="asset">
    <font-awesome-icon :icon="['fas', 'cloud-download-alt']" @click="verifyPurchase"></font-awesome-icon>
    <span v-if="getDownloadLinkForTokenId(asset.id)">
      <a :href="getDownloadLinkForTokenId(asset.id)" target="_blank">Download</a>
    </span>
  </div>
</template>

<script>
  /* global web3:true */
  import * as actions from '../../store/actions';
  import FontAwesomeIcon from '@fortawesome/vue-fontawesome';
  import {mapGetters, mapState} from 'vuex';

  export default {
    name: 'highResDownload',
    components: {FontAwesomeIcon},
    props: ['asset'],
    computed: {
      ...mapGetters([
        'getDownloadLinkForTokenId',
      ]),
    },
    methods: {
      verifyPurchase: function () {
        this.$store.dispatch(actions.HIGH_RES_DOWNLOAD, this.asset);
      }
    }
  };
</script>

<style>
</style>
