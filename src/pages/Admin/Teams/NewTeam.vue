<script>
import { mapGetters } from 'vuex'

import InviteUsers from '@/pages/Admin/Teams/InviteUsers'
import TeamForm from '@/pages/Admin/Teams/TeamForm'

export default {
  components: { TeamForm, InviteUsers },
  data() {
    return {
      step: 1
    }
  },
  computed: {
    ...mapGetters('license', ['permissions', 'license', 'planType']),
    multitenancy() {
      return this.license?.terms?.tenants > 1
    }
  },
  watch: {},
  methods: {}
}
</script>

<template>
  <div style="min-height: 400px;">
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

    <v-container v-else fluid>
      <div
        class="d-flex justify-center align-center mx-auto mb-4"
        style="max-width: 400px;"
      >
        <div
          class="rounded-circle d-flex align-center justify-center step text-h5"
          :class="{ active: step == 1 }"
        >
          <v-icon>people_alt</v-icon>
        </div>
        <v-divider
          style="border-width: 1px;"
          :style="{
            'border-color': step == 2 ? 'var(--v-primary-base)' : null
          }"
        />
        <div
          class="rounded-circle d-flex align-center justify-center step text-h5"
          :class="{ active: step == 2 }"
        >
          <v-icon>person_add_alt_1</v-icon>
        </div>
      </div>

      <transition name="quick-fade" mode="out-in">
        <TeamForm v-if="step === 1" :key="1" />
        <InviteUsers v-else-if="step === 2" :key="2" />
      </transition>
    </v-container>
  </div>
</template>

<style lang="scss" scoped>
.step {
  border: 2px solid rgba(0, 0, 0, 0.12);
  height: 34px;
  transition: all 200ms;
  width: 34px;

  &.active {
    border-color: var(--v-primary-base);
    border-width: 3px;
  }
}
</style>
