<template>
  <div
    class="plan-card blue-grey darken-2 white--text mt-8 rounded elevation-4"
  >
    <div class="font-weight-regular text-center py-8 plan-title">
      Starter
    </div>
    <v-divider class="divider-light" />
    <div
      class="text-h6 font-weight-regular text-center grey--text text--lighten-3"
    >
      <div class="mt-8">
        Cloud-native workflow orchestration
      </div>
      <div
        class="mt-4 text-h2 font-weight-regular white--text plan-task-run-price d-flex align-center justify-center"
      >
        <span class="mr-2 font-weight-light d-inline-block plan-cent"> $ </span
        >0.0025
      </div>
      <div class="mt-2 text-h6 font-weight-light">
        per successful task run
      </div>

      <div
        class="mt-16 text-left plan-body d-flex align-start justify-center flex-column"
      >
        <div class="d-flex align-center justify-center">
          <span
            class="rounded-circle plans-feature-icon plans-feature-icon-light"
          >
            <v-icon small>
              fad fa-users
            </v-icon>
          </span>
          <span class="ml-2">Up to 3 users</span>
        </div>

        <div class="mt-3 d-flex align-center justify-center">
          <span
            class="rounded-circle plans-feature-icon plans-feature-icon-light"
          >
            <v-icon small>
              fad fa-history
            </v-icon>
          </span>
          <span class="ml-2">1 week of run history</span>
        </div>

        <div class="mt-3 d-flex align-center justify-center">
          <span
            class="rounded-circle plans-feature-icon plans-feature-icon-light"
          >
            <v-icon small>
              fad fa-tasks
            </v-icon>
          </span>
          <span class="ml-2">10,000 free task runs per month</span>
        </div>
      </div>

      <div v-if="hideDetails" class="py-7 mt-16" />

      <div v-else class="plan-cta plan-cta-dark py-7 mt-16" @click="select">
        Get started now
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    hideDetails: {
      type: Boolean,
      required: false,
      default: () => false
    }
  },
  methods: {
    select() {
      this.$emit('click')
    }
  }
}
</script>

<style lang="scss" scoped>
.plan-card {
  height: min-content;
  overflow: hidden;
  transition: all 150ms;
  width: 425px;

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
    font-size: 1.2rem !important;
    font-weight: 400 !important;
    margin: auto;
    max-width: 350px;
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
    cursor: pointer;
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
