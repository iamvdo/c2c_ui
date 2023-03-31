<template>
  <icon-layer :name="name" :color="color">
    <span v-translate>Data Avalanche</span>
    <template #overlay>
      <a :href="overlay.url" target="_blank">
        {{ overlay.title }}
        <fa-icon icon="external-link-alt" class="overlay-link-icon" />
      </a>
    </template>
  </icon-layer>
</template>

<script>
import IconLayer from './IconLayer.vue';

export default {
  components: {
    IconLayer,
  },
  data() {
    return {
      name: 'dataAvalanche',
      color: 'hsl(247, 20%, 57%)',
      overlay: {
        title: null,
        url: null,
      },
    };
  },
  methods: {
    setOverlay(feature) {
      this.overlay.title = feature.get('title');
      this.overlay.url = feature.get('link');
    },
    unsetOverlay() {
      this.overlay.title = null;
      this.overlay.url = null;
    },
  },
};
</script>
