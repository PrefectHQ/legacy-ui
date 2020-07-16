<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  props: {
    schedules: {
      required: true,
      type: Array
    },
    showDescription: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loading: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['role']),
    schedule() {
      if (this.schedules.length) {
        return this.schedules[0]
      }
      return null
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    async toggleScheduleActive() {
      try {
        this.loading = true
        let response

        if (this.schedule.active) {
          response = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/set-schedule-inactive.gql'),
            variables: {
              id: this.schedule.id
            }
          })

          if (response.data.setScheduleInactive.success) {
            this.setAlert(
              {
                alertShow: true,
                alertMessage: 'Schedule set to paused.',
                alertType: 'info'
              },
              3000
            )
          } else {
            this.setAlert({
              alertShow: true,
              alertMessage: 'There was a problem.  Please try again.',
              alertType: 'error'
            })
          }
        } else if (!this.schedule.active) {
          response = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/set-schedule-active.gql'),
            variables: {
              id: this.schedule.id
            }
          })

          if (response.data.setScheduleActive.success) {
            this.setAlert(
              {
                alertShow: true,
                alertMessage: 'Schedule set to active.',
                alertType: 'info'
              },
              3000
            )
          } else {
            this.setAlert({
              alertShow: true,
              alertMessage: 'There was a problem.  Please try again.',
              alertType: 'error'
            })
          }
        }
      } catch (error) {
        this.setAlert({
          alertShow: true,
          alertMessage: 'There was a problem.  Please try again.',
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
  <span v-if="loading" class="flex-span">
    <v-progress-circular indeterminate color="primary" />
  </span>

  <span v-else-if="schedule" class="flex-span">
    <v-btn
      v-disable-read-only-user
      class="ml-0 mr-1"
      text
      small
      icon
      @click="toggleScheduleActive"
    >
      <v-icon v-if="schedule.active" color="accent">
        toggle_on
      </v-icon>
      <v-icon v-else-if="!schedule.active">toggle_off</v-icon>
    </v-btn>
  </span>

  <span v-else class="flex-span">
    <span v-if="showDescription">
      None
    </span>
  </span>
</template>

<style lang="scss" scoped>
.flex-span {
  align-items: center;
  display: inline-flex;
}
</style>
