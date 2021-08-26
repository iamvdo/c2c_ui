<template>
  <div class="yeti-subpanel">
    <sub-panel-title><span v-translate>Route</span></sub-panel-title>
    <div v-if="features.length">
      <div class="columns is-mobile">
        <div class="column">
          <p class="features-title">
            <icon-route class="icon document-icon" />
            <fa-icon icon="pen" class="icon edit-icon" />
            <span
              v-show="!hasFeaturesTitle"
              class="features-title-text features-title-placeholder"
              @click="onEditNewFeaturesTitle"
              v-translate
            >
              Add title…
            </span>
            <span
              v-show="hasFeaturesTitle"
              class="features-title-text features-title-content"
              ref="featuresTitle"
              tabindex="0"
              contenteditable
              spellcheck="false"
              @blur="onEditFeaturesTitle"
              @keypress.13.prevent
              >{{ featuresTitle }}</span
            >
          </p>
        </div>
        <div class="column is-narrow">
          <button class="button is-secondary is-small" @click="onRemoveFeatures">
            <fa-icon icon="trash" class="trash-icon" />
            <span v-translate>Delete route</span>
          </button>
        </div>
      </div>
      <div class="ml-5 mb-5">
        <p class="is-size-7 is-italic mb-1 has-text-grey" v-translate>Lines chunks</p>
        <features-list :features="features" />
      </div>
      <dropdown-content class="mb-5">
        <span v-translate>Simplify</span>
        <fa-icon
          icon="exclamation-circle"
          v-if="validToleranceDistance"
          class="has-text-danger ml-1"
          :title="$gettext('Not simplified yet')"
        />
        <template #content>
          <p v-translate>Select tolerance (preview result on map)</p>
          <div class="is-flex is-justify-content-center my-3">
            <div v-for="(tolerance, i) of tolerances" :key="tolerance">
              <input
                :id="'tolerance' + i"
                class="is-checkradio is-primary"
                type="radio"
                name="tolerances"
                :value="tolerance"
                v-model="toleranceDistance"
                @change="onPreviewSimplify"
              />
              <label :for="'tolerance' + i">{{ tolerancesText[i] }}</label>
            </div>
          </div>
          <div class="is-flex is-justify-content-space-between is-align-items-center">
            <info>
              {{ featuresFullNbPoints }} <span v-translate>points</span> <strong v-if="validToleranceDistance">(<span v-translate>after:</span> {{ featuresSimplifiedNbPoints }} <span v-translate>points</span>)</strong>
            </info>
            <button class="button is-primary" :disabled="!validToleranceDistance" @click="onSimplify" v-translate>Simplify</button>
          </div>
          <info type="warning" v-if="validToleranceDistance" >
            <strong v-translate>Be careful,</strong> <span v-translate>this is a preview. Geometry is not simplified yet. Map interactions are disabled.</span>
          </info>
          <info type="help" class="mt-5">
            <span v-translate>Create a simplified version of the geometry by reducing the amount of points</span>
          </info>
        </template>
      </dropdown-content>
      <info type="help">
        <p v-translate>Drawing tips</p>
        <ul class="content-ul">
          <li><strong v-translate translate-context="yeti">Draw</strong> <span v-translate>new lines chunks</span></li>
          <li>
            <strong v-translate translate-context="yeti">Delete</strong>
            <span v-translate>last point with the Backspace key</span>
          </li>
        </ul>
        <p v-translate>On a drawn line</p>
        <ul class="content-ul">
          <li>
            <strong v-translate translate-context="yeti">Edit</strong> <span v-translate>points by moving them</span>
          </li>
          <li>
            <strong v-translate translate-context="yeti">Create</strong>
            <span v-translate>a new point on an existing line</span>
          </li>
          <li><strong v-translate>Delete a point</strong> <span v-translate>with Alt + clic</span></li>
        </ul>
        <p v-translate>From the interface</p>
        <ul class="content-ul">
          <li><strong v-translate>Delete a line chunk</strong></li>
          <li><strong v-translate>Delete route</strong> <span v-translate>to start or load a new one</span></li>
        </ul>
      </info>
      <sub-panel-title><span v-translate>Export</span></sub-panel-title>
      <div class="columns is-vcentered is-mobile">
        <div class="column">
          <ul class="form-export">
            <li v-for="type of formats" :key="type" class="control is-flex">
              <input
                :id="'format' + type"
                type="radio"
                name="exportFormat"
                class="is-checkradio is-primary"
                :value="type"
                v-model="format"
              />
              <label :for="'format' + type">{{ type }}</label>
            </li>
          </ul>
        </div>
        <div class="column is-narrow">
          <button class="button is-primary" @click="downloadCourse" v-translate>Export route</button>
        </div>
      </div>
    </div>
    <div v-else>
      <p v-translate>No route right now</p>
      <div class="load-gpx">
        <button
          class="button is-primary"
          :class="{ 'is-loading': loading }"
          :disabled="loading"
          @click="onLoadGpx"
          v-translate
        >
          Upload a GPS track
        </button>
        <div class="control upload-button">
          <input ref="gpxFileInput" type="file" @change="uploadGpx" accept=".gpx" />
        </div>
        <info type="help" class="mt-5">
          <p><strong v-translate>Draw right on the map</strong> <span v-translate>to start a new route</span></p>
        </info>
      </div>
    </div>
  </div>
</template>

<script>
import { format } from 'date-fns';

import DropdownContent from '@/components/yeti/DropdownContent.vue';
import FeaturesList from '@/components/yeti/FeaturesList.vue';
import Info from '@/components/yeti/Info.vue';
import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import { state, mutations, bus } from '@/components/yeti/yetix';
import ol from '@/js/libs/ol';
import utils from '@/js/utils';

export default {
  components: { DropdownContent, FeaturesList, Info, SubPanelTitle },
  data() {
    return {
      newFeaturesTitle: false,
      loading: false,
      formats: ['GPX', 'KML'],
      format: 'GPX',
      tolerances: [0, 25, 50, 100, 200],
      tolerancesText: [this.$gettext('No'), '25m', '50m', '100m', '200m'],
      toleranceDistance: 0,
    };
  },
  computed: {
    features() {
      return state.features;
    },
    featuresTitle() {
      return state.featuresTitle;
    },
    hasFeaturesTitle() {
      return !(!this.featuresTitle.length && !this.newFeaturesTitle);
    },
    featuresFullNbPoints() {
      // geometry key is the initial geometry
      return this.features.map((feature) => {
        return feature.get('geometry').getCoordinates().length;
      }).reduce((acc, value) => acc + value);
    },
    featuresSimplifiedNbPoints() {
      // simplified is default geometry while simplifying
      return this.features.map((feature) => {
        return feature.getGeometry().getCoordinates().length;
      }).reduce((acc, value) => acc + value);
    },
    validToleranceDistance() {
      return this.toleranceDistance !== 0;
    },
  },
  watch: {
    toleranceDistance() {
      if (this.toleranceDistance === 0) {
        bus.$emit('allowInteractions');
      } else {
        bus.$emit('disableInteractions');
      }
    },
  },
  methods: {
    onEditFeaturesTitle(e) {
      if (!e.target.innerText.length) {
        this.newFeaturesTitle = false;
      }
      mutations.setFeaturesTitle(e.target.innerText);
    },
    onEditNewFeaturesTitle() {
      this.newFeaturesTitle = true;
      this.$nextTick(() => {
        this.$refs.featuresTitle.focus();
      });
    },
    onLoadGpx() {
      this.$refs.gpxFileInput.click();
    },
    onRemoveFeatures() {
      if (confirm(this.$gettext('Confirm delete'))) {
        bus.$emit('removeFeatures');
        // go back to init
        this.initializeSimplifyTool();
      }
    },
    uploadGpx(event) {
      this.loading = true;

      const reader = new FileReader();

      reader.onload = () => {
        this.loading = false;
        bus.$emit('gpx', reader.result);
      };

      reader.readAsText(event.target.files[0]);

      // empty the input, because if user wan't to upload same trace
      // change event is not fired
      // and emit gpx event
      this.$refs.gpxFileInput.value = '';
      bus.$emit('gpx', null);
    },
    downloadCourse() {
      // first, check if simplify is active
      if (this.toleranceDistance !== 0 && 
        confirm(this.$gettext('You’re trying to export the initial geometry, not the one visible on map (confirm simplification instead). Export anyway?'))) {
        if (this.format === 'GPX') {
          this.downloadFeatures(new ol.format.GPX(), '.gpx', 'application/gpx+xml');
        } else if (this.format === 'KML') {
          this.downloadFeatures(new ol.format.KML(), '.kml', 'application/vnd.google-earth.kml+xml');
        }
      }
    },
    downloadFeatures(olFormat, extension, mimetype) {
      const features = this.features;
      features[0].set('name', this.featuresTitle);

      const filename = this.setFilename(extension);

      const content = olFormat.writeFeatures(features, {
        featureProjection: 'EPSG:3857',
      });

      utils.download(content, filename, mimetype + ';charset=utf-8');
    },
    setFilename(ext) {
      return format(new Date(), 'yyyy-MM-dd_HH-mm-ss') + ext;
    },
    onPreviewSimplify() {
      // delay simplify to prevent UI freeze
      // => 120ms (input radio transiton is 100ms)
      setTimeout(() => {
        bus.$emit('previewSimplify', this.toleranceDistance);
      }, 120);
    },
    onSimplify() {
      if (confirm(this.$gettext('Simplify route? You will lose initial geometry.'))) {
        bus.$emit('simplify');
        // go back to init
        this.initializeSimplifyTool();
      }
    },
    initializeSimplifyTool() {
      this.toleranceDistance = 0;
    }
  },
};
</script>

<style scoped lang="scss">
.features-title {
  display: flex;
  line-height: 1.4;

  &-text {
    min-width: 100px;
    border: solid 1px transparent;
    border-radius: 2px;
    padding: 2px 2em 2px 2px;
    box-decoration-break: clone;

    &:hover,
    &:focus {
      border-color: #b5b5b5;
    }
  }

  &-placeholder {
    font-style: italic;
  }

  &-content {
    font-weight: bold;
  }
}

.icon {
  margin-top: 2px;
}

.edit-icon {
  order: 1;
  opacity: 0;
  margin-left: -1.5em;
  pointer-events: none;
  transform: scale(0.75);
}

.features-title:hover .edit-icon {
  opacity: 0.75;
}

.document-icon {
  margin-right: 3px;
}

.trash-icon {
  margin-right: 3px;
}

.upload-button {
  position: relative;
}

input[type='file'] {
  opacity: 0; /* invisible but it's there! */
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
}

.load-gpx {
  margin-top: 2rem;
}

.form-export {
  display: flex;
}

.control {
  align-items: center;

  .is-checkradio[type='radio'] + label {
    line-height: 1.2rem;
  }
}

@media screen and (max-width: 350px) {
  .form-export {
    display: block;
  }
}
</style>
