<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  props: {
    flow: {
      required: true,
      type: Object
    },
    flowGroup: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      loading: false,
      optimisticIsScheduled: this.flow.is_schedule_active
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('license', ['hasPermissions']),
    archived() {
      return this.flow.archived
    },
    isScheduled() {
      if (this.archived) return false
      return this.optimisticIsScheduled
    },
    schedule() {
      return (
        this.flow.schedule?.clocks?.[0] || this.flowGroup.schedule?.clocks?.[0]
      )
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    async scheduleFlow() {
      try {
        this.loading = true
        let response
        if (this.isScheduled) {
          response = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/set-schedule-inactive.gql'),
            variables: {
              id: this.flow.id
            }
          })
          if (response.data.set_schedule_inactive.success) {
            this.alertShow = true
            this.alertMessage = 'Schedule paused'
            this.alertType = 'info'
            this.optimisticIsScheduled = false
          } else {
            this.alertShow = true
            this.alertMessage =
              '"Something went wrong. Please wait a few moments and try again."'
            this.alertType = 'error'
          }
        } else if (!this.isScheduled) {
          response = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/set-schedule-active.gql'),
            variables: {
              id: this.flow.id
            }
          })
          if (response.data.set_schedule_active.success) {
            this.alertShow = true
            this.alertMessage = 'Schedule activated'
            this.alertType = 'info'
            this.optimisticIsScheduled = true
          } else {
            this.alertShow = true
            this.alertMessage =
              '"Something went wrong. Please wait a few moments and try again."'
            this.alertType = 'error'
          }
        }
      } catch (error) {
        this.alertShow = true
        this.alertMessage =
          '"Something went wrong. Please wait a few moments and try again."'
        this.alertType = 'error'
        throw error
      } finally {
        this.loading = false
        this.setAlert({
          alertShow: this.alertShow,
          alertMessage: this.alertMessage,
          alertType: this.alertType,
          alertLink: this.alertLink
        })
      }
    }
  }
}
</script>

<template>
  <div class="position-relative">
    <v-tooltip bottom>
      <template #activator="{ on }">
        <div class="schedule-toggle" v-on="on">
          <v-badge
            :value="schedule == null && isScheduled"
            color="warning"
            icon="priority_high"
            overlap
            top
            left
          >
            <v-switch
              v-model="isScheduled"
              data-cy="schedule-toggle"
              class="small-switch"
              color="primary"
              :loading="loading"
              :disabled="
                !hasPermission('create', 'run') ||
                  (isScheduled && !hasPermission('delete', 'run')) ||
                  archived
              "
              inset
              dense
              hide-details
              @change="scheduleFlow"
            >
            </v-switch>
          </v-badge>
        </div>
      </template>
      <span v-if="!hasPermission('create', 'run')">
        You don't have permission to schedule flows.
      </span>
      <span v-else-if="schedule == null && isScheduled">
        This flow is trying to schedule runs but has no schedules! Visit this
        flow's
        <span class="font-weight-bold">Settings > Schedules</span> to set a new
        schedule.
      </span>
      <span v-else-if="archived">
        Archived flows cannot be scheduled.
      </span>
      <span v-else>
        Turn {{ isScheduled ? 'off' : 'on' }} this flow's schedule
      </span>
    </v-tooltip>
  </div>
</template>

<style lang="scss">
.schedule-toggle {
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
