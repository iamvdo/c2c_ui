<template>

  <document-link :document="image" class="has-hover-background columns">
    <div class="column">
      <figure class="image is-96x96">
        <img :src="getUrl(image)" :title="image.locales[0].title">
      </figure>
    </div>
    <div class="column is-hidden-mobile">
      <document-title :document="image" />
      {{image.author}}
    </div>
  </document-link>

</template>

<script>
  import imageUrls from '@/js/image-urls';

  export default {
    props: {
      image: {
        type: Object,
        required: true
      }
    },

    methods: {
      getUrl(image) {
        return imageUrls.getSquared(image);
      }
    }
  };
</script>

<style scoped lang="scss">


</style>
