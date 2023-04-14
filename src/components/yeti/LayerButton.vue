<template>
  <div class="layer-button" v-on="disabled?.condition ? { click: warnIfDisabled } : {}">
    <input
      :id="'layer-checkbox' + _uid"
      class="is-checkradio is-primary"
      :type="type"
      :checked="checked"
      :disabled="disabled?.condition"
      @change="$emit('change')"
    />
    <label :for="'layer-checkbox' + _uid" class="layer-label">
      <div
        class="layer-image"
        :style="{
          'background-image': backgroundImage,
        }"
      >
        <span
          class="layer-country"
          :class="'layer-country-' + country"
          v-if="country"
          :style="{ 'background-image': 'url(' + require('../../assets/img/flags/' + country + '.svg') + ')' }"
        ></span>
      </div>
      <div :class="{ 'has-text-primary': checked }">
        <slot />
      </div>
    </label>
  </div>
</template>

<script>
import Yetix from '@/components/yeti/Yetix';

export default {
  props: {
    type: {
      type: String,
      default: 'checkbox',
    },
    checked: {
      type: Boolean,
      default: null,
    },
    disabled: {
      type: Object,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
  },
  computed: {
    backgroundImage() {
      let img;
      try {
        img = require('../../assets/img/yeti/layers/' + this.image);
        img = 'url(' + img + ')';
      } catch (e) {
        img = 'none';
      }
      return img;
    },
  },
  methods: {
    warnIfDisabled() {
      Yetix.toast({
        title: this.disabled.title,
        message: this.disabled.message,
        type: 'is-info',
      });
    },
  },
};
</script>

<style scoped lang="scss">
.layer-button {
  text-align: center;
}
.layer-image {
  position: relative;
  width: 5.714rem;
  min-height: 3.571rem;
  background: #dbdbdb;
  box-shadow: 0 0 0 2px white, 0 0 0 3px #dbdbdb;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  background-size: cover;
}
.layer-label {
  display: flex !important;
  flex-direction: column;
  align-items: center;
  padding: 0 !important;
  margin: 0 0 1rem 0 !important;
}
.layer-country {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 12px;
  background-size: cover;
  background-position: center;
}
.layer-country-ch {
  width: 12px;
}
.layer-button {
  .is-checkradio[type='checkbox'] + label::before,
  .is-checkradio[type='radio'] + label::before,
  .is-checkradio[type='checkbox'] + label::after,
  .is-checkradio[type='radio'] + label::after {
    z-index: 1;
    left: calc(50% - 2.857rem);
  }
  .is-checkradio[type='checkbox'] + label::before,
  .is-checkradio[type='radio'] + label::before {
    background: #0000;
    border-color: #0000;
  }
  .is-checkradio[type='checkbox'] + label::after,
  .is-checkradio[type='radio'] + label::after {
    left: calc(50% - 2.357rem) !important;
  }
  .is-checkradio:hover:not([disabled]) + label .layer-image,
  .is-checkradio:focus-visible + label .layer-image {
    box-shadow: 0 0 0 2px $white, 0 0 0 4px $primary;
  }
  .is-checkradio:checked:not([disabled]) + label::before {
    box-shadow: 0 0 0 2px $white;
  }
  .is-checkradio:not(:checked):hover:not([disabled]) + label::before,
  .is-checkradio:not(:checked):focus-visible + label::before {
    border-width: 1px;
    border-color: #dbdbdb !important;
    background: white;
    box-shadow: none;
  }
  .is-checkradio:checked:not([disabled]) + label .layer-image {
    box-shadow: 0 0 0 2px $white, 0 0 0 4px $primary;
  }
  .is-checkradio:checked:focus-visible + label .layer-image {
    box-shadow: 0 0 0 2px $white, 0 0 0 4px $primary, 0 0 0 6px $secondary !important;
  }
}
</style>
