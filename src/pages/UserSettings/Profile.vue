<script>
import moment from 'moment-timezone'
import { mapActions, mapGetters, mapMutations } from 'vuex'

import Alert from '@/components/Alert'
import ManagementLayout from '@/layouts/ManagementLayout.vue'

const ERROR_ALERT =
  'Something went wrong while trying to update your user profile. Please try again. If this error persists, please contact help@prefect.io.'

export default {
  components: {
    Alert,
    ManagementLayout
  },
  data() {
    return {
      alertShow: false,
      alertMessage: '',
      alertType: null,
      isUpdatingProfile: false,
      selectedTimezone: null,
      tzs: [
        { text: 'Local', value: '' },
        'UTC',
        { divider: '-------' },
        ...moment.tz.names()
      ],
      updatedFirstName: '',
      updatedLastName: '',
      updateError: false,
      user: null
    }
  },
  computed: {
    ...mapGetters('user', ['firstName', 'lastName', 'timezone']),
    isProfileUpdatable() {
      return (
        this.selectedTimezone === this.timezone &&
        this.updatedFirstName === this.firstName &&
        this.updatedLastName === this.lastName
      )
    }
  },
  beforeMount() {
    this.selectedTimezone = this.timezone
    this.updatedFirstName = this.firstName
    this.updatedLastName = this.lastName
  },
  methods: {
    ...mapMutations('user', ['setUserSettings']),
    ...mapActions('user', ['getUser']),
    handleAlert(type, message) {
      this.alertMessage = message
      this.alertType = type
      this.alertShow = true
    },
    async updateTZ() {
      let settings = { timezone: this.selectedTimezone }

      if (this.user) {
        settings = { ...this.user.settings, ...settings }
      }

      this.setUserSettings(settings)

      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/User/update-user-settings.gql'),
          variables: {
            input: settings
          }
        })
        return true
      } catch (error) {
        this.handleAlert('error', ERROR_ALERT)
        return false
      }
    },
    async updateUserDetails() {
      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/User/update-user-details.gql'),
          variables: {
            firstName: this.updatedFirstName,
            lastName: this.updatedLastName
          }
        })
        await this.getUser()
        return true
      } catch (error) {
        this.handleAlert('error', ERROR_ALERT)
        return false
      }
    },
    async updateProfile() {
      this.isUpdatingProfile = true

      let updateTzSuccess = true
      let updateNameSuccess = true

      if (this.selectedTimezone !== this.timezone) {
        updateTzSuccess = await this.updateTZ()
      }

      if (
        this.updatedFirstName !== this.firstName ||
        this.updatedLastName !== this.lastName
      ) {
        updateNameSuccess = await this.updateUserDetails()
      }

      if (updateTzSuccess && updateNameSuccess) {
        this.handleAlert('success', 'Your profile has been updated!')
      }
      this.isUpdatingProfile = false
    }
  }
}
</script>

<template>
  <ManagementLayout class="mt-3">
    <template #title>Your Profile</template>

    <template #subtitle>
      Control how your actions are displayed and how timestamps appear in
      Prefect Cloud
    </template>

    <v-card tile max-width="720" class="mt-6 pa-12 mx-auto">
      <v-card-text>
        <v-text-field
          v-model="updatedFirstName"
          data-cy="first-name"
          label="First Name"
          type="text"
          outlined
          class="mb-6"
          prepend-inner-icon="account_circle"
        ></v-text-field>

        <v-text-field
          v-model="updatedLastName"
          data-cy="last-name"
          label="Last Name"
          type="text"
          outlined
          class="mb-6"
          prepend-inner-icon="account_circle"
        ></v-text-field>

        <v-autocomplete
          data-public
          v-model="selectedTimezone"
          :items="tzs"
          label="Time Zone"
          outlined
          prepend-inner-icon="access_time"
          :menu-props="{ offsetY: true }"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          id="updateProfileButton"
          data-cy="update-user"
          :disabled="isProfileUpdatable || isUpdatingProfile"
          :loading="isUpdatingProfile"
          color="primary darken-2"
          @click="updateProfile"
          >Save</v-btn
        >
      </v-card-actions>
    </v-card>

    <Alert
      v-model="alertShow"
      :type="alertType"
      :message="alertMessage"
      :offset-x="$vuetify.breakpoint.mdAndUp ? 256 : 56"
    ></Alert>
  </ManagementLayout>
</template>
