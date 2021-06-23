<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('license', ['permissions', 'license', 'planType']),
    multitenancy() {
      return this.license?.terms?.tenants > 1
    }
  }
}
</script>

<template>
  <div>
    <v-container
      v-if="!multitenancy"
      class="text-h5 text-center blue-grey--text d-flex align-center justify-center"
      style="height: 400px;"
      fluid
    >
      <div>
        <i class="fad fa-lock-alt fa-3x" />
        <div class="mt-6">
          <span v-if="planType('ENTERPRISE')">
            Your plan doesn't include multi-tenancy;
          </span>
          <span v-else
            >Multi-tenancy is only available on Enterprise plans;</span
          >
          <br />contact
          <a class="font-weight-medium" href="sales@prefect.io"
            >sales@prefect.io</a
          >
          to learn more.
        </div>
      </div>
    </v-container>

    <transition v-else name="quick-fade" mode="out-in">
      <router-view />
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.teams-wrapper {
  height: 100vh;
  pointer-events: none;
  position: fixed;
  width: 100%;
  z-index: 1000;

  .snackbars-snack {
    pointer-events: auto;
    transition: all 0.5s;
  }

  &-enter,
  &-leave-to,
  &-leave-active {
    opacity: 0;
    transform: translateY(30px);
  }

  &-leave-active {
    position: absolute;
  }
}

.new-team-button {
  border-style: dotted;
  border-width: 2px;
  max-width: 400px;
}
</style>
