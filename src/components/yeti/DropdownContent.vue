<template>
  <div class="dropdown-content">
    <div>
      <p class="dropdown-content-title" @click="opened = !opened">
        <slot />
        <fa-icon
          class="dropdown-content-arrow is-size-6 is-pulled-right has-cursor-pointer no-print"
          icon="angle-down"
          :rotation="opened ? 180 : undefined"
        />
      </p>
    </div>
    <div v-if="opened" class="p-3">
      <slot name="content" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      opened: false,
    };
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.dropdown-content {
  border: 1px solid #dbdbdb;
  padding: 0;
  box-shadow: none;

  &:hover {
    border-color: #b5b5b5;
  }
}
.dropdown-content-title {
  cursor: pointer;
  padding: 0.25rem 0.75rem;
}
.dropdown-content-arrow {
  color: $primary;
  margin-top: 0.25rem;
}
</style>
