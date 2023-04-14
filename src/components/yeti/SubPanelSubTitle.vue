<template>
  <h3 class="title is-6">
    <slot></slot>
  </h3>
</template>

<style scoped lang="scss">
@import '@/assets/sass/variables';

h3 {
  display: inline-block;
  margin: 0 !important;
  padding: 0.25rem 0.5rem 0.25rem 0;
  color: $grey;
  text-transform: uppercase;
}
</style>
