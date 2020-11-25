<template>
  <v-container
    style="
      max-width: 1440px;
      padding-top: 60px;
    "
    class="pb-12"
  >
    <v-row class="mt-0">
      <v-col v-if="$slots['col-1']" cols="12" sm="4" md="3">
        <slot name="col-1" />
      </v-col>

      <v-col cols="12" sm="8" md="9">
        <slot />
      </v-col>
    </v-row>
  </v-container>
</template>
