<template>
  <div class="yeti-subpanel panelCourse">
    <subPanelTitle>Trace</subPanelTitle>
    <div v-if="features.length">
      <p class="featureTitle">
        <icon-route class="document-icon" />
        <span>{{ featuresTitle }}</span>
      </p>
      <div class="ml-5 mb-5">
        <p class="yetiform-info is-italic is-marginless">Portions de lignes</p>
        <featuresList :map="map" :features="features" />
      </div>
      <div class="has-text-right">
        <button class="button is-secondary" @click="onRemoveFeatures">Supprimer la trace</button>
        <button class="button is-primary" @click="onRemoveFeatures">Exporter la trace</button>
      </div>
      <div class="yetiform-note mt-5">
        <p>Astuces</p>
        <ul class="content-ul">
          <li><strong>Dessinez</strong> de nouvelles portions de lignes</li>
          <li><strong>Éditez</strong> les points en les déplaçant</li>
          <li><strong>Créez</strong> un nouveau point sur une ligne existante</li>
          <li><strong>Supprimez un point</strong> avec Alt + clic</li>
          <li><strong>Supprimez une portion de ligne</strong></li>
          <li><strong>Supprimez la trace</strong> pour en charger une nouvelle</li>
        </ul>
      </div>
    </div>
    <div v-else>
      <p>Pas de traces actuellement</p>
      <div class="loadGpx">
        <p>
          <button
            class="button is-primary"
            :class="{ 'is-loading': loading }"
            :disabled="loading"
            @click="onLoadGpx"
            v-translate
          >
            Charger une trace GPS
          </button>
          <span class="yetiform-info">Ou dessinez directement sur la carte !</span>
        </p>
        <div class="control upload-button">
          <input ref="gpxFileInput" type="file" @change="uploadGpx" accept=".gpx" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import featuresList from '@/components/yeti/FeaturesList.vue';
import subPanelTitle from '@/components/yeti/SubPanelTitle.vue';

export default {
  components: { featuresList, subPanelTitle },
  props: {
    map: {
      type: Object,
      default: null,
    },
    features: {
      type: Array,
      default: null,
    },
    featuresTitle: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      loading: false,
    };
  },
  methods: {
    onLoadGpx() {
      this.loading = true;
      this.$refs.gpxFileInput.click();
    },

    onRemoveFeatures() {
      if (confirm('Confirmez la suppression ?')) {
        this.map.removeFeatures();
      }
    },

    uploadGpx(event) {
      const reader = new FileReader();

      reader.onload = () => {
        this.loading = false;
        this.$emit('gpx', reader.result);
      };

      reader.readAsText(event.target.files[0]);

      // empty the input, because if user wan't to upload same trace
      // change event is not fired
      // and emit gpx event
      this.$refs.gpxFileInput.value = '';
      this.$emit('gpx', null);
    },
  },
};
</script>

<style scoped lang="scss">
.upload-button {
  position: relative;
}

input {
  opacity: 0; /* invisible but it's there! */
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
}

.loadGpx {
  margin-top: 2rem;
}
</style>
