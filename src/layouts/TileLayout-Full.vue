<template>
  <v-sheet color="transparent" class="pt-0 pb-12">
    <v-row v-if="$slots['row-1-tile']" no-gutters>
      <v-col cols="12" class="pb-0">
        <v-row>
          <v-col class="pb-0">
            <slot name="row-1-tile" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="12" class="py-0 px-4">
        <v-row>
          <v-col class="pa-0" cols="12">
            <slot name="row-2-tile" />
          </v-col>
          <v-col>
            <slot name="row-2a-tile" cols="12" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-sheet>
</template>
