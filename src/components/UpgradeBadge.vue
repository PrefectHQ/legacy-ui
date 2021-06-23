<script>
import MenuTooltip from '@/components/MenuTooltip'
export default {
  components: {
    MenuTooltip
  },
  props: {
    inline: {
      type: Boolean,
      default: false,
      required: false
    },
    elevate: {
      type: Boolean,
      default: true,
      required: false
    }
  }
}
</script>

<template>
  <MenuTooltip
    hide-close
    :nudge-top="inline ? '-4px' : '16px'"
    :nudge-left="inline ? '-4px' : null"
    transition="slide-x-transition"
  >
    <template #activator>
      <router-link :to="'/plans'">
        <v-badge
          color="accentPink"
          offset-y="-12"
          origin="center"
          :inline="inline"
          class="pa-0 upgrade-badge"
          :class="{ elevate: elevate }"
        >
          <template #badge>
            <div class="white--text d-flex align-center justify-center px-1">
              <div class="appearable text-none font-weight-medium">
                Upgrade
              </div>
              <v-icon>fa-fw fa-sm fa-cloud</v-icon>
            </div>
          </template>
        </v-badge>
      </router-link>
    </template>

    <div class="utilGrayMid--text text-h6 font-weight-light">
      <slot />

      <br />
      <br />
      <div>
        <router-link :to="'/plans'">Upgrade now</router-link> to get access!
      </div>
    </div>
  </MenuTooltip>
</template>

<style lang="scss">
.upgrade-badge {
  &.elevate {
    .v-badge__badge {
      box-shadow: 0px 2px 4px -1px rgb(0 0 0 / 20%),
        0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%) !important;
    }
  }

  /* stylelint-disable */
  .v-badge__badge {
    left: unset;
    max-width: 31px;
    right: 0;
    transition: 250ms ease-in-out;
    z-index: 4;
  }
  /* stylelint-enable */

  .appearable {
    margin-right: 0;
    overflow: hidden;
    transition: width 250ms ease-in-out, margin-right 250ms ease-in-out;
    width: 0;
  }

  &:hover,
  &:focus {
    /* stylelint-disable */
    .v-badge__badge {
      max-width: 83px;
    }
    /* stylelint-enable */

    .appearable {
      margin-right: 6px;
      width: 100%;
    }
  }
}
</style>
