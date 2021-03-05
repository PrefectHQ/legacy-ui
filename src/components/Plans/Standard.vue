<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: () => false
    },
    hideDetails: {
      type: Boolean,
      required: false,
      default: () => false
    }
  },
  computed: {
    ...mapGetters('license', ['license']),
    isCurrent() {
      return this.license?.terms?.plan === 'STANDARD_2021'
    }
  },
  methods: {
    select() {
      if (this.isCurrent || this.disabled) return
      this.$emit('click')
    }
  }
}
</script>

<template>
  <div class="plan-card white rounded elevation-7">
    <div class="font-weight-regular text-center py-8 plan-title">
      Standard
      <div v-if="!hideDetails" class="text-body-1 prefect--text text-none">
        Recommended
      </div>
    </div>
    <v-divider class="divider-dark" />
    <div
      class="text-h6 text-md-subtitle-1 text-lg-h6 font-weight-regular text-center"
    >
      <div class="px-4">
        <div class="mt-8 blue-grey--text text--darken-2">
          A complete workflow automation platform
        </div>
        <div
          class="mt-8 text-h2 font-weight-regular blue-grey--text text--darken-3 plan-task-run-price d-flex align-center justify-center"
        >
          <span class="mr-2 font-weight-light d-inline-block plan-cent">
            $ </span
          >0.0050
        </div>
        <div class="mt-2 text-h6 font-weight-light">
          per successful task run
        </div>

        <div
          class="my-12 my-md-8 my-lg-12 text-left plan-body d-flex align-start justify-center flex-column"
        >
          <div class="d-flex align-center justify-center">
            <span class="rounded-circle plans-feature-icon">
              <v-icon small>
                fad fa-users
              </v-icon>
            </span>
            <span class="ml-2">
              Up to 10 users
            </span>
          </div>

          <div class="mt-3 d-flex align-center justify-center">
            <span class="rounded-circle plans-feature-icon">
              <v-icon small>
                fad fa-history
              </v-icon>
            </span>
            <span class="ml-2">
              2 weeks of run history
            </span>
          </div>

          <div class="mt-3 d-flex align-center justify-center">
            <span class="rounded-circle plans-feature-icon">
              <v-icon small>
                fad fa-user-shield
              </v-icon>
            </span>
            <span class="ml-2">Basic role-based permissioning</span>
          </div>

          <!-- <div class="mt-3 d-flex align-center justify-center">
            <span class="rounded-circle plans-feature-icon">
              <v-icon small>
                fad fa-toolbox
              </v-icon>
            </span>
            <span class="ml-2">
              Seamlessly integrate your existing tools
            </span>
          </div> -->

          <div class="mt-3 d-flex align-center justify-center">
            <span class="rounded-circle plans-feature-icon">
              <v-icon small>
                fad fa-siren-on
              </v-icon>
            </span>
            <span class="ml-2">Workflow and infrastructure SLAs</span>
          </div>

          <div class="mt-3 d-flex align-center justify-center">
            <span class="rounded-circle plans-feature-icon">
              <v-icon small>
                fad fa-random
              </v-icon>
            </span>
            <span class="ml-2">Customizable stateful actions</span>
          </div>

          <div class="mt-3 d-flex align-center justify-center">
            <span class="rounded-circle plans-feature-icon">
              <v-icon small>
                fad fa-shield
              </v-icon>
            </span>
            <span class="ml-2">Best-in-class automatic security</span>
          </div>
        </div>
      </div>
      <div v-if="hideDetails" class="py-7 mt-12 mt-md-8 mt-lg-12 o-0">
        {{
          isCurrent
            ? 'Current'
            : disabled
            ? 'Contact your team admin to upgrade'
            : 'Get started now'
        }}
      </div>

      <div
        v-else
        class="plan-cta py-7 mt-12 mt-md-8 mt-lg-12"
        :class="{ 'cursor-pointer': !isCurrent }"
        @click="select"
      >
        {{
          isCurrent
            ? 'Current'
            : disabled
            ? 'Contact your team admin to upgrade'
            : 'Get started now'
        }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.plan-card {
  height: min-content;
  overflow: hidden;
  transition: all 150ms;
  width: 450px;

  .plan-title {
    font-size: 1.15rem;
    letter-spacing: 0.15rem;
    text-transform: uppercase;
  }

  .divider-dark {
    border-color: #eee;
  }

  .divider-light {
    border-color: #3f515a;
  }

  .plan-body {
    // font-size: 1.2rem !important;
    font-weight: 400 !important;
    margin: auto;
    max-width: 375px;
    width: max-content;
  }

  .plan-feature-icon {
    align-items: center;
    display: inline-flex;
    height: 20px;
    justify-content: center;
    width: 20px;
  }

  .plan-cent {
    font-size: 3rem !important;
    vertical-align: middle;
  }

  .plan-table {
    column-gap: 2px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    row-gap: 2px;

    div {
      background-color: #455a64;
    }
  }

  .plan-cta {
    background-color: #f7fcfd;
    color: inherit !important;
    display: block;
    font-size: 1rem;
    letter-spacing: 0.15rem;
    text-decoration: none;
    text-transform: uppercase;
    transition: all 50ms;

    &.plan-cta-dark {
      background-color: #546e7a;

      &:focus,
      &:hover {
        background-color: #5a7581 !important;
        color: #fff;
      }
    }

    &:focus,
    &:hover {
      background-color: #e9f7fc !important;
      font-weight: 500 !important;
    }
  }
}
</style>
