<script>
export default {
  computed: {
    extendedSlots() {
      return Object.keys(this.$slots).filter(key => key.includes('extended'))
    }
  }
}
</script>

<template>
  <v-container fluid class="mx-auto pt-0 px-3 pb-12">
    <v-row v-if="$slots['row-0']" no-gutters>
      <v-col class="pa-0">
        <slot name="row-0" />
      </v-col>
    </v-row>

    <v-row
      v-if="
        $slots['row-1-col-1-tile-1'] ||
          $slots['row-1-col-2-tile-1'] ||
          $slots['row-1-col-3-tile-1'] ||
          $slots['row-1-col-4-tile-1']
      "
      no-gutters
      class="justify-start"
    >
      <v-col
        :class="{
          'pb-0':
            $slots['row-2-col-1-row-1-tile-1'] ||
            $slots['row-2-col-1-row-2-tile-1'] ||
            $slots['row-2-col-1-row-3-tile-1'] ||
            $slots['row-2-col-1-row-4-tile-1'],
          'pt-0': $slots['row-0']
        }"
      >
        <v-row class="mt-0">
          <v-col
            cols="12"
            md="4"
            :class="{
              'pt-1': $slots['row-0']
            }"
          >
            <slot name="row-1-col-1-tile-1" />
          </v-col>
          <v-col
            cols="12"
            md="4"
            sm="6"
            :class="{
              'pt-1': $slots['row-0']
            }"
          >
            <slot name="row-1-col-2-tile-1" />
          </v-col>
          <v-col
            cols="12"
            md="4"
            sm="6"
            :class="{
              'pt-1': $slots['row-0']
            }"
          >
            <slot name="row-1-col-3-tile-1" />
          </v-col>
        </v-row>
      </v-col>
      <v-row v-if="$slots['row-2-col-1-row-2-tile-a']" class="pt-1">
        <v-col cols="12">
          <slot name="row-2-col-1-row-2-tile-a" />
        </v-col>
      </v-row>
    </v-row>
  </v-container>
</template>
