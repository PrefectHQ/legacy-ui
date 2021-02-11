<template>
  <div
    class="plan-card blue-grey darken-3 white--text mt-16 rounded elevation-3"
  >
    <div class="font-weight-regular text-center py-8 plan-title">
      Enterprise
    </div>

    <v-divider class="divider-light" />
    <div class="text-h6 font-weight-regular text-center">
      <div class="mt-8">
        Built for your business

        <div class="mt-2 font-weight-light">
          Get in touch to build your Prefect Cloud
        </div>
      </div>

      <div class="mt-16 d-flex align-center justify-center flex-column">
        <div class="plan-table">
          <div class="py-2 px-4">100+ users</div>
          <div class="py-2 px-4">Custom RBAC / SSO</div>
          <div class="py-2 px-4">Volume discounts</div>
          <div class="py-2 px-4">Audit trail</div>
        </div>
      </div>

      <a
        class="plan-cta plan-cta-dark py-7 mt-16 d-flex align-center justify-center"
        href="https://www.prefect.io/get-prefect#contact"
        target="_blank"
      >
        Contact sales
        <v-icon class="mb-1" color="grey lighten-2">arrow_right</v-icon>
      </a>
    </div>
  </div>
</template>

<script>
export default {}
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
