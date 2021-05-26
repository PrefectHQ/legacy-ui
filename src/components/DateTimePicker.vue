<script>
export default {
  data() {
    return {
      hour: 1,
      minute: 1
    }
  }
}
</script>

<template>
  <div class="px-4 py-2 d-flex">
    <div>
      <v-text-field
        v-model="hour"
        type="number"
        min="1"
        max="12"
        step="1"
        hide-details
      />
    </div>
    <div>:</div>
    <div>
      <v-text-field
        v-model="minute"
        type="number"
        min="0"
        max="59"
        step="1"
        hide-details
      />
    </div>
    <div>
      <div>AM</div>
      <div>PM</div>
    </div>
  </div>
</template>

<style lang="scss">
// /* Chrome, Safari, Edge, Opera */
// input::-webkit-outer-spin-button,
// input::-webkit-inner-spin-button {
//   -webkit-appearance: none;
//   margin: 0;
// }

// /* Firefox */
// input[type='number'] {
//   -moz-appearance: textfield;
// }
</style>
