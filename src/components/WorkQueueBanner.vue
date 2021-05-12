<script>
import { mapActions, mapGetters } from 'vuex'
export default {
  data() {
    return {
      loading: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    paused() {
      return this.tenant?.settings?.work_queue_paused
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapActions('tenant', ['getTenants']),
    async resumeWork() {
      this.loading = true

      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Nav/resume-tenant-work-queue.gql'),
          variables: {
            tenantId: this.tenant.id
          }
        })

        if (data?.tenant_work_queue_result?.success) {
          this.getTenants()
        }
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage: e,
          alertType: 'error'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<template>
  <v-snackbar
    color="amber lighten-5"
    :value="paused"
    app
    rounded
    bottom
    content-class="py-1"
    elevation="24"
    :timeout="-1"
  >
    <div class="d-flex align-center justify-start">
      <v-avatar rounded>
        <div class="banner-icon">
          <i class="fad fa-list-ul" />
        </div>
      </v-avatar>

      <span class="utilGrayDark--text text-body-1 ml-3">
        Work is paused - no runs will be released to your agents.
      </span>

      <v-spacer />

      <v-btn
        class="ml-4"
        text
        depressed
        color="primary"
        :loading="loading"
        @click="resumeWork"
      >
        Resume work
      </v-btn>
    </div>
  </v-snackbar>
</template>

<style lang="scss">
.v-avatar {
  border-radius: 0 !important;
}
</style>
