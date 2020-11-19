<template>
  <v-app-bar
    elevate-on-scroll
    height="80"
    color="appBackground"
    style="
    position: fixed;
    width: 100%;
    z-index: 5;"
  >
    <v-row
      no-gutters
      class="d-flex align-center mx-auto pb-3"
      style="max-width: 1440px;"
    >
      <v-col :sm="$slots['page-actions'] ? 8 : 12">
        <v-row>
          <v-col
            cols="12"
            class="d-flex align-center justify-space-between pb-1"
          >
            <div>
              <div
                ><span class="overline"><slot name="page-type"></slot></span>
                <span
                  v-if="$slots.breadcrumbs"
                  class="pl-2"
                  style="font-size: 0.875rem;"
                  ><slot name="breadcrumbs"></slot
                ></span>
              </div>
              <div class="headline"><slot name="page-title"></slot></div>
            </div>
          </v-col>
        </v-row>
      </v-col>
      <v-col
        v-if="$slots['page-actions']"
        cols="12"
        sm="4"
        class="align-self-end text-right"
        :class="$vuetify.breakpoint.smAndDown ? 'text-center' : ''"
      >
        <slot name="page-actions"></slot>
      </v-col>
    </v-row>
    <template v-if="$slots.tabs && $vuetify.breakpoint.mdAndUp" slot="extension"
      ><slot name="tabs"></slot
    ></template>
  </v-app-bar>
</template>
