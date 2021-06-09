<script>
import { mapGetters } from 'vuex'

import InviteUsers from '@/pages/Admin/InviteUsers'
import TeamForm from '@/pages/Admin/TeamForm'

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

    <v-container v-else>
      <div class="d-flex justify-space-around align-center">
        <div>(1) Create team</div>
        <v-divider />
        <div>(2) Invite users</div>
      </div>
      <TeamForm />
      <InviteUsers />
    </v-container>
  </div>
</template>

<style lang="scss" scoped>
/* */
</style>
