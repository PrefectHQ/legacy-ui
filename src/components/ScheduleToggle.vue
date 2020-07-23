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
      loading: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role']),
    archived() {
      return this.flow.archived
    },
    isReadOnlyUser() {
      return this.role === 'READ_ONLY_USER'
    },
    isScheduled: {
      get() {
        if (this.archived) return false
        return this.flow.is_schedule_active
      },
      set() {
        return
      }
    },
    schedule() {
      return this.flow.schedule?.clocks[0] || this.flowGroup.schedule?.clocks[0]
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
  <v-tooltip bottom>
    <template v-slot:activator="{ on }">
      <div v-on="on">
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
            :disabled="isReadOnlyUser || archived"
            inset
            hide-details
            @change="scheduleFlow"
          >
          </v-switch>
        </v-badge>
      </div>
    </template>
    <span v-if="isReadOnlyUser">
      Read-only users cannot schedule flows.
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
</template>

<style lang="scss">
.small-switch.v-input {
  margin-top: 0 !important;
  padding-top: 0 !important;
  transform: scale(0.8);
}
</style>
