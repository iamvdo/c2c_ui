<template>
  <div class="yeti-subpanel">
    <div class="layers-group">
      <sub-panel-title><span v-translate>Overlays</span></sub-panel-title>
      <div class="layer-items">
        <div v-for="layer of overlayLayersSelector" :key="layer.title" class="layer-item">
          <layer-button :checked="layer.checked" :image="layer.image" @change="layer.action">
            <span>{{ layer.title }}</span>
          </layer-button>
        </div>
      </div>
    </div>
    <div class="layers-group">
      <sub-panel-title><span>YETI</span></sub-panel-title>
      <div class="layer-items">
        <div v-for="layer of yetiLayersSelector" :key="layer.title" class="layer-item">
          <layer-button :checked="layer.checked" :disabled="layer.disabled" :image="layer.image" @change="layer.action">
            <span>{{ layer.title }}</span>
          </layer-button>
        </div>
      </div>
      <div class="layer-controls" v-if="showYeti">
        <div class="layer-control">
          <div>
            <sub-panel-sub-title>
              <fa-icon icon="gear" />
              <span>{{ $gettext(yetiLayer.title) }}</span>
            </sub-panel-sub-title>
            <div class="layer-control-item">
              <slider v-model="opacityYetiLayer" :min="0" :max="1" :interval="0.01" @change="onUpdateYetiOpacity">
                <span v-translate>Opacity</span>
              </slider>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="layers-group">
      <sub-panel-title><span v-translate>Slopes</span></sub-panel-title>
      <div class="layer-items">
        <div v-for="layer of dataLayersSelector" :key="layer.title" class="layer-item">
          <layer-button :image="layer.image" :country="layer.country" @change="setVisibleDataLayer(layer)">
            <span>{{ $gettext(layer.title, 'Map slopes layer') }}</span>
          </layer-button>
        </div>
      </div>
      <div class="layer-controls">
        <div v-for="(layer, i) of dataLayersSelectorActive" :key="layer.title" class="layer-control">
          <sub-panel-sub-title>
            <fa-icon icon="gear" />
            <span>{{ $gettext(layer.title, 'Map slopes layer') }}</span>
          </sub-panel-sub-title>
          <div class="layer-control-item">
            <slider
              v-model="opacityDataLayers[i]"
              :min="0"
              :max="1"
              :interval="0.01"
              @change="onUpdateOpacity(layer, i)"
            >
              <span v-translate>Opacity</span>
            </slider>
          </div>
          <div class="layer-control-item">
            <input-checkbox>
              <span>Blend pixels</span>
            </input-checkbox>
          </div>
        </div>
      </div>
    </div>
    <div class="layers-group">
      <sub-panel-title><span v-translate>Base layers</span></sub-panel-title>
      <div class="layer-items">
        <div v-for="layer of cartoLayersSelector" :key="layer.title" class="layer-item">
          <layer-button
            type="radio"
            :checked="layer.id == visibleCartoLayer.id"
            :image="layer.image"
            :country="layer.country"
            @change="setVisibleCartoLayer(layer)"
          >
            <span>{{ $gettext(layer.title, 'Map layer') }}</span>
          </layer-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import LayerButton from '@/components/yeti/LayerButton';
import Slider from '@/components/yeti/Slider.vue';
import SubPanelSubTitle from '@/components/yeti/SubPanelSubTitle.vue';
import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import Yetix from '@/components/yeti/Yetix';

export default {
  components: {
    LayerButton,
    Slider,
    SubPanelSubTitle,
    SubPanelTitle,
  },
  data() {
    return {
      showAreasWasTrue: null,
      opacityYetiLayer: null,
      opacityDataLayers: [],
    };
  },
  computed: {
    mapZoom() {
      return Yetix.mapZoom;
    },
    cartoLayersSelector() {
      return Yetix.cartoLayersSelector;
    },
    dataLayersSelector() {
      return Yetix.dataLayersSelector;
    },
    dataLayersSelectorActive() {
      return this.dataLayersSelector.filter((layer) => {
        return this.visibleDataLayersId.includes(layer.id);
      });
    },
    overlayLayersSelector() {
      return [
        {
          title: this.$gettext('Avalanche bulletins'),
          checked: this.showAvalancheBulletins,
          action: this.onShowAvalancheBulletins,
          image: 'avalanche.jpg',
        },
        {
          title: this.$gettext('Nivose beacons'),
          checked: this.showNivoses,
          action: this.onShowNivoses,
          image: 'nivose.png',
        },
        {
          title: this.$gettext('ROMMA stations'),
          checked: this.showRomma,
          action: this.onShowRomma,
          image: 'romma.png',
        },
        {
          title: this.$gettext('FlowCapt sensors'),
          checked: this.showFlowcapt,
          action: this.onShowFlowcapt,
          image: 'flowcapt.png',
        },
      ];
    },
    yetiLayersSelector() {
      return [
        {
          title: this.$gettext('YETI Risk'),
          checked: this.showYeti,
          action: this.onShowYeti,
          disabled: {
            condition: !this.yetiOk,
            title: this.$gettext('No risk to show yet'),
            message: this.$gettext('Compute one for a specific zone from the “Risk” tab'),
          },
          opacity: this.opacity,
          image: 'yeti-risk.jpg',
        },
        {
          title: this.$gettext('YETI extent'),
          checked: this.showAreas,
          action: this.onShowAreas,
          disabled: {
            condition: this.mapZoom > Yetix.BLEND_MODES_MAX_ZOOM,
            title: this.$gettext('Disabled at this zoom level'),
            message: this.$gettext('Zoom out and it will be OK'),
          },
          image: 'yeti-extent.jpg',
        },
      ];
    },
    yetiLayer() {
      return this.yetiLayersSelector[0];
    },
    visibleCartoLayer() {
      return Yetix.visibleCartoLayer;
    },
    visibleDataLayers() {
      return Yetix.visibleDataLayers;
    },
    visibleDataLayersId() {
      return this.visibleDataLayers.map((layer) => layer.id);
    },
    showAvalancheBulletins() {
      return Yetix.showAvalancheBulletins;
    },
    showAreas() {
      return Yetix.showAreas;
    },
    showNivoses() {
      return Yetix.showNivoses;
    },
    showRomma() {
      return Yetix.showRomma;
    },
    showFlowcapt() {
      return Yetix.showFlowcapt;
    },
    showYeti() {
      return Yetix.showYeti;
    },
    yetiOk() {
      return Yetix.yetiOk;
    },
  },
  watch: {
    mapZoom() {
      // uncheck yeti extent checkbox when zoom is reached
      // store old state if true, and revert back when zoom is valid
      // (good for perf because only 2 layers max will be visible instead of 4)
      if (this.mapZoom > Yetix.BLEND_MODES_MAX_ZOOM) {
        if (this.showAreas) {
          this.showAreasWasTrue = this.showAreas;
        }
        Yetix.setShowAreas(false);
      } else if (this.showAreasWasTrue) {
        Yetix.setShowAreas(true);
        this.showAreasWasTrue = null;
      }
    },
    dataLayersSelector() {
      this.dataLayersSelector.map((layer, i) => {
        this.opacityDataLayers[i] = layer.opacity;
      });
    },
    yetiOk() {
      this.opacityYetiLayer = Yetix.getYetiLayer().getOpacity();
    },
  },
  methods: {
    setVisibleCartoLayer(layer) {
      Yetix.setVisibleCartoLayer(layer);
    },
    setVisibleDataLayer(layer) {
      //layer.setVisible(!layer.getVisible());
      Yetix.setVisibleDataLayer(layer);
    },
    onShowAvalancheBulletins() {
      Yetix.setShowAvalancheBulletins(!this.showAvalancheBulletins);
    },
    onShowAreas() {
      Yetix.setShowAreas(!this.showAreas);
    },
    onShowNivoses() {
      Yetix.setShowNivoses(!this.showNivoses);
    },
    onShowRomma() {
      Yetix.setShowRomma(!this.showRomma);
    },
    onShowFlowcapt() {
      Yetix.setShowFlowcapt(!this.showFlowcapt);
    },
    onShowYeti() {
      Yetix.setShowYeti(!this.showYeti);
    },
    onUpdateOpacity(layer, i) {
      let dataLayer = Yetix.getDataLayer(layer);
      dataLayer.setOpacity(this.opacityDataLayers[i]);
    },
    onUpdateYetiOpacity() {
      let yetiLayer = Yetix.getYetiLayer();
      yetiLayer.setOpacity(this.opacityYetiLayer);
    },
  },
};
</script>

<style scoped lang="scss">
.layers-group {
  margin-bottom: 1.5rem;
}
.layer-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5.714rem, 1fr));
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
}
.layer-item {
}
.layer-controls {
}
.layer-control {
  border: solid 1px $grey-lighter;
  border-radius: 4px;
  padding: 0.5rem;
  margin-bottom: 1rem;
}
.layer-control-item {
  margin: 0.5rem 1rem;
}
</style>
