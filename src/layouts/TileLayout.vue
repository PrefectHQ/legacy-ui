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
        <v-row
          class="mt-0"
          :style="{ height: $vuetify.breakpoint.mdAndUp ? '350px' : '' }"
        >
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

          <!-- This col is just used to push col-4 to the right -->
          <v-col v-if="$vuetify.breakpoint.mdAndUp" cols="4"> </v-col>

          <v-col cols="12" md="8">
            <slot name="row-1-col-4-tile-1" />
          </v-col>
        </v-row>
        <v-row class="mt-4">
          <v-col
            cols="12"
            :class="{
              'pt-8': $slots['row-0']
            }"
          >
            <slot name="row-2-col-1-row-2-tile-a" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-row class="justify-start mt-4">
      <v-col
        v-if="
          $slots['row-2-col-1-row-1-tile-1'] ||
            $slots['row-2-col-1-row-2-tile-1'] ||
            $slots['row-2-col-1-row-3-tile-1'] ||
            $slots['row-2-col-1-row-4-tile-1']
        "
        cols="12"
        md="4"
        :class="
          $slots['row-1-col-1-tile-1'] ||
          $slots['row-1-col-2-tile-1'] ||
          $slots['row-1-col-3-tile-1'] ||
          $slots['row-1-col-4-tile-1']
            ? 'pt-0'
            : ''
        "
      >
        <v-row v-if="$slots['row-2-col-1-row-1-tile-1']">
          <v-col>
            <slot name="row-2-col-1-row-1-tile-1" />
          </v-col>
        </v-row>

        <v-row v-if="$slots['row-2-col-1-row-2-tile-1']">
          <v-col>
            <slot name="row-2-col-1-row-2-tile-1" />
          </v-col>
        </v-row>

        <v-row v-if="$slots['row-2-col-1-row-3-tile-1']">
          <v-col>
            <slot name="row-2-col-1-row-3-tile-1" />
          </v-col>
        </v-row>

        <v-row v-if="$slots['row-2-col-1-row-4-tile-1']">
          <v-col
            :class="{
              'pt-1': $slots['row-0']
            }"
          >
            <slot name="row-2-col-1-row-4-tile-1" />
          </v-col>
        </v-row>
      </v-col>

      <v-col
        v-if="
          $slots['row-2-col-2-row-1-tile-1'] ||
            $slots['row-2-col-2-row-2-tile-1'] ||
            $slots['row-2-col-2-row-2-tile-2'] ||
            $slots['row-2-col-2-row-3-tile-1']
        "
        cols="12"
        md="8"
        :class="
          $slots['row-1-col-1-tile-1'] ||
          $slots['row-1-col-2-tile-1'] ||
          $slots['row-1-col-3-tile-1']
            ? 'pt-0'
            : ''
        "
      >
        <v-row v-if="$slots['row-2-col-2-row-1-tile-1']" no-gutters>
          <v-col>
            <slot name="row-2-col-2-row-1-tile-1" />
          </v-col>
        </v-row>

        <v-row
          v-if="
            $slots['row-2-col-2-row-2-tile-1'] ||
              $slots['row-2-col-2-row-2-tile-2']
          "
        >
          <v-col cols="12" md="6">
            <slot name="row-2-col-2-row-2-tile-1" />
          </v-col>

          <v-col cols="12" md="6">
            <slot name="row-2-col-2-row-2-tile-2" />
          </v-col>
        </v-row>

        <v-row v-if="$slots['row-2-col-2-row-3-tile-1']">
          <v-col>
            <slot name="row-2-col-2-row-3-tile-1" />
          </v-col>
        </v-row>

        <v-row>
          <v-col v-for="slot in extendedSlots" :key="slot">
            <slot :name="slot" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
