<template>
  <div v-if="assetId">
    <button type="button" class="btn btn-sm btn-info" @click="verifyPurchase">
      High-res download
    </button>
  </div>
</template>

<script>
  /* global web3:true */
  import * as actions from '../../store/actions';

  export default {
    name: 'highResDownload',
    props: ['assetId'],
    methods: {
      verifyPurchase: function () {
        this.$store.dispatch(actions.HIGH_RES_DOWNLOAD, this.assetId);
      }
    }
  };
</script>

<style>
</style>
