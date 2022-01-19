<script>
import LogRocket from 'logrocket'
import { mapActions, mapGetters } from 'vuex'
import {
  GROUP_COLORS,
  STATES,
  openCloudHookTypes,
  featureFlaggedCloudHookTypes
} from '@/utils/cloudHooks'

const PROVIDE_CONFIG_ERROR =
  'You must provide a configuration for the Cloud Hook'

const obfuscatedFields = [
  'account_sid',
  'auth_token',
  'messaging_service_sid',
  'api_token',
  'routing_key'
]

const cloudHookLabels = {
  account_sid: 'Account SID',
  auth_token: 'Auth Token',
  email: 'Email',
  messaging_service_sid: 'Messaging Service SID',
  to: 'To',
  url: 'URL',
  routing_key: 'Integration Key',
  api_token: 'API Token',
  severity: 'Severity'
}

const newCloudHookTemplate = () => {
  return {
    name: 'Cloud Hook',
    states: STATES['All'],
    config: { url: null },
    type: 'WEBHOOK'
  }
}

export default {
  filters: {
    obfuscate: function(val) {
      if (!val || val == 'None') return val
      return `••••••••••••••••${val.substring(val.length - 4)}`
    },
    capitalize: function(value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
  },
  props: {
    editable: {
      default: () => true,
      required: false,
      type: Boolean
    },
    editOnRender: {
      default: () => false,
      required: false,
      type: Boolean
    },
    hook: {
      default: () => newCloudHookTemplate(),
      required: false,
      type: Object
    },
    showControls: {
      default: () => false,
      required: false,
      type: Boolean
    },
    versionGroupIdProp: {
      required: false,
      type: String,
      default: ''
    }
  },
  data() {
    return {
      canEdit: this.editOnRender,
      tempConfig: this.hook?.config ? this.hook.config : { url: null },
      severityLevels: [
        { text: 'Info', value: 'info' },
        { text: 'Warning', value: 'warning' },
        { text: 'Error', value: 'error' },
        { text: 'Critical', value: 'critical' }
      ],
      versionGroupIdSelect: '',
      configError: false,
      error: null,
      valid: false,
      loading: false,
      tempName: this.hook.name,
      rules: {
        email: val => {
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          return (
            val.split(',').every(email => pattern.test(email.trim())) ||
            'Invalid e-mail.'
          )
        },
        required: val => !!val || 'Required.',
        requiredCombo: val =>
          (!!val && val.length > 0) || 'At least one number is required',
        url: val => {
          const pattern = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,256}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/
          return pattern.test(val) || 'Invalid URL.'
        }
      },
      tempStates: this.hook.states,
      tempType: this.hook ? this.hook.type : 'WEBHOOK',
      testCloudHookLoading: false,
      flowError: ''
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('api', ['isCloud']),
    stateGroupAll() {
      return this.cloudHookStateGroup('All')
    },
    versionGroupId() {
      if (this.versionGroupIdProp) return this.versionGroupIdProp
      return this.versionGroupIdSelect
    },
    stateGroupCustom() {
      return (
        !this.stateGroupAll &&
        !this.stateGroupFailed &&
        !this.stateGroupFinished &&
        !this.stateGroupSuccess
      )
    },
    stateGroupFailed() {
      return this.cloudHookStateGroup('Failed')
    },
    stateGroupFinished() {
      return this.cloudHookStateGroup('Finished')
    },
    stateGroupSuccess() {
      return this.cloudHookStateGroup('Success')
    },
    states() {
      return this.canEdit && this.editable
        ? STATES['All']
        : STATES['All'].filter(s =>
            this.hook?.states?.includes(s.toUpperCase())
          )
    },
    cloudHookTypes() {
      let allHooks
      if (
        this.canEdit &&
        this.editable &&
        this.tenant.prefectAdminSettings?.notifications
      ) {
        allHooks = featureFlaggedCloudHookTypes
      } else {
        allHooks =
          this.canEdit && this.editable
            ? openCloudHookTypes
            : openCloudHookTypes.filter(t => t.type == this.hook.type)
      }
      return allHooks.filter(
        t => (t.requiresCloud && this.isCloud) || !t.requiresCloud
      )
    }
  },
  watch: {
    loading(val) {
      this.$emit('update:loading', val)
    },
    tempConfig() {
      this.configError = false
      this.error = ''
    },
    versionGroupId(val) {
      if (val) {
        this.flowError = ''
      }
    },
    tempType(val) {
      this.tempConfig = this.cloudHookTypes.find(t => t.type == val).config
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    _handleCancel() {
      this.$emit('close')
      this.flowError = ''
      this.canEdit = false
    },
    async _handleSaveCloudHook() {
      if (this.hook.id) await this.deleteCloudHook()
      await this.createCloudHook()
    },
    _handleCloudHookStatesAll() {
      this.tempStates = STATES.All
    },
    _handleCloudHookStatesCustom() {
      this.tempStates = []
    },
    _handleCloudHookStatesFailed() {
      this.tempStates = STATES.Failed
    },
    _handleCloudHookStatesFinished() {
      this.tempStates = STATES.Finished
    },
    _handleCloudHookStatesSuccess() {
      this.tempStates = STATES.Success
    },
    async createCloudHook() {
      if (!this.tempConfig) {
        this.configError = true
        this.error = PROVIDE_CONFIG_ERROR
        return
      }

      if (!this.versionGroupId) {
        this.flowError =
          'You have not selected a flow to attach your Cloud Hook to'
        return
      }

      this.configError = false
      this.error = null

      this.loading = true
      try {
        let input = {
          version_group_id: this.versionGroupId,
          name: this.tempName,
          states: this.tempStates,
          config: this.tempConfig,
          type: this.tempType,
          tenant_id: this.tenant.id
        }

        const createCloudHookResult = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-cloud-hook.gql'),
          variables: {
            input: input
          },
          errorPolicy: 'all'
        })

        setTimeout(() => {
          if (createCloudHookResult?.data?.create_cloud_hook?.id) {
            this.$emit('update')
            this.loading = false
            this.$emit('close')
            this.canEdit = false
          } else {
            this.error = createCloudHookResult.errors[0].message
            this.loading = false
          }
        }, 1000)
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Flow Settings',
            stage: 'Create State Hook'
          }
        })
        this.loading = false
        this.error = e
      }
    },
    async deleteCloudHook() {
      this.loading = true
      try {
        let input = {
          cloud_hook_id: this.hook.id
        }

        const deleteCloudHookResult = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/delete-cloud-hook.gql'),
          variables: {
            input: input
          },
          errorPolicy: 'all'
        })

        setTimeout(() => {
          if (deleteCloudHookResult?.data?.delete_cloud_hook?.success) {
            this.$emit('update')
            this.loading = false
            this.$emit('delete')
            this.canEdit = false
          } else {
            this.error = deleteCloudHookResult.errors[0].message
            this.loading = false
          }
        }, 1000)
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Flow Settings',
            stage: 'Delete Cloud Hook'
          }
        })
        this.loading = false
        this.error = e
      }
    },
    async testCloudHook() {
      this.testCloudHookLoading = true

      try {
        let input = {
          cloud_hook_id: this.hook.id,
          state_type: 'SUCCESS'
        }

        const testCloudHookResult = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/test-cloud-hook.gql'),
          variables: {
            input: input
          },
          errorPolicy: 'all'
        })
        setTimeout(() => {
          if (testCloudHookResult?.data?.test_cloud_hook?.success) {
            this.testCloudHookLoading = false
            this.setAlert(
              {
                alertShow: true,
                alertMessage: 'Cloud Hook test dispatched.',
                alertType: 'success'
              },
              3000
            )
            this.$emit('test')
          } else {
            this.setAlert(
              {
                alertShow: true,
                alertMessage: `Cloud Hook test failed with the following message: <strong>${testCloudHookResult?.data?.test_cloud_hook?.error}</strong>`,
                alertType: 'error'
              },
              3000
            )
            this.testCloudHookLoading = false
          }
        }, 1000)
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Flow Settings',
            stage: 'Test Cloud Hook'
          }
        })
        this.testCloudHookLoading = false
        this.error = e
      }
    },
    cloudHookKeyLabel(key) {
      return cloudHookLabels[key]
    },
    cloudHookStateGroup(group) {
      return (
        STATES[group] &&
        STATES[group].every(state => this.tempStates?.includes(state)) &&
        STATES[group].length == this.tempStates.length
      )
    },
    shouldObfuscate(key) {
      return obfuscatedFields?.includes(key)
    },
    stateGroupColor(group) {
      return GROUP_COLORS[group]
    },
    projectNamePrefix() {
      return item => `${item.name} (${item.project.name})`
    }
  },
  apollo: {
    flows: {
      query: require('@/graphql/TeamSettings/flows.gql'),
      result({ data }) {
        if (!data) return
        this.flowsLoaded = true
      },
      error() {
        this.handleError(
          'Something went wrong while trying to fetch your flows.'
        )
      },
      update(data) {
        return data.flow
      },
      fetchPolicy: 'no-cache'
    }
  }
}
</script>

<template>
  <v-form v-model="valid">
    <v-card flat>
      <v-card-text class="pa-0">
        <v-row>
          <v-col cols="12">
            <v-row>
              <v-col cols="12" md="8" class="pb-0">
                <v-autocomplete
                  data-public
                  v-if="canEdit && !versionGroupIdProp"
                  id="item"
                  v-model="versionGroupIdSelect"
                  data-cy="flow-list"
                  item-value="version_group_id"
                  :item-text="projectNamePrefix()"
                  label="Flow (Version Group)"
                  class="text-h5 overflow"
                  :items="flows"
                >
                  <template #item="{ item }">
                    <v-list-item-content>
                      <v-list-item-title>{{ item.name }}</v-list-item-title>
                      <v-list-item-subtitle
                        >({{ item.project.name }})</v-list-item-subtitle
                      >
                    </v-list-item-content>
                  </template>
                </v-autocomplete>
                <v-text-field
                  v-if="canEdit"
                  v-model="tempName"
                  data-cy="hook-name"
                  label="Name"
                  class="text-h5"
                  hide-details
                />
                <div v-else>
                  <div class="text-caption">Name</div>
                  <div class="text-h5 black--text">{{ tempName }}</div>
                </div>
                <div class="text-subtitle-1 pt-2">
                  This is a non-unique shorthand identifier for your Cloud Hook.
                </div>
              </v-col>

              <v-col
                v-if="showControls"
                class="d-flex justify-end"
                cols="12"
                md="4"
                order-sm="1"
              >
                <v-tooltip v-if="!canEdit && editable" top>
                  <template #activator="{ on }">
                    <div style="display: inline-block;" v-on="on">
                      <v-btn
                        :loading="testCloudHookLoading"
                        class="mr-4"
                        color="warning"
                        small
                        depressed
                        @click="testCloudHook"
                      >
                        <v-icon>bug_report</v-icon>
                        Test
                      </v-btn>
                    </div>
                  </template>
                  <span v-if="!editable">
                    Read-only users cannot modify Cloud Hooks
                  </span>
                  <span v-else>
                    Test this Cloud Hook (will send a test call to your
                    endpoint)
                  </span>
                </v-tooltip>

                <v-tooltip v-if="!canEdit && editable" top>
                  <template #activator="{ on }">
                    <div style="display: inline-block;" v-on="on">
                      <v-btn icon @click="canEdit = true">
                        <v-icon color="primary lighten-1">edit</v-icon>
                      </v-btn>
                    </div>
                  </template>
                  <span v-if="!editable">
                    Read-only users cannot modify Cloud Hooks
                  </span>
                  <span v-else>
                    Modify this Cloud Hook
                  </span>
                </v-tooltip>

                <!-- <v-btn
                  v-if="canEdit"
                  color="primary"
                  depressed
                  :loading="loading"
                  :disabled="loading || !!error || !valid"
                  @click="_handleSaveCloudHook"
                >
                  Save
                </v-btn> -->

                <v-tooltip v-if="editable && !canEdit" top>
                  <template #activator="{ on }">
                    <div style="display: inline-block;" v-on="on">
                      <v-btn
                        icon
                        :loading="loading"
                        :disabled="loading"
                        @click="deleteCloudHook"
                      >
                        <v-icon color="red darken-1">delete</v-icon>
                      </v-btn>
                    </div>
                  </template>
                  <span v-if="!editable">
                    Read-only users cannot delete Cloud Hooks
                  </span>
                  <span v-else>
                    Delete this Cloud Hook
                  </span>
                </v-tooltip>
              </v-col>
            </v-row>

            <v-row class="mt-2">
              <v-col cols="12" class="pt-2">
                <div class="text-h5 primary--text">
                  Type
                </div>
              </v-col>
              <v-col cols="12" class="pt-0">
                <v-chip-group
                  v-if="canEdit"
                  v-model="tempType"
                  column
                  mandatory
                >
                  <v-chip
                    v-for="type in cloudHookTypes"
                    :key="type.title"
                    :data-cy="type.type"
                    active-class="primary"
                    class="px-6"
                    label
                    :value="type.type"
                    large
                  >
                    <v-icon left class="mr-2">
                      {{ type.icon }}
                    </v-icon>
                    {{ type.title }}
                  </v-chip>
                </v-chip-group>

                <div v-else>
                  <v-chip
                    v-for="type in cloudHookTypes"
                    :key="type.title"
                    color="primary"
                    class="px-6"
                    label
                    :value="type.type"
                    large
                  >
                    <v-icon left class="mr-2">
                      {{ type.icon }}
                    </v-icon>
                    {{ type.title }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>

            <v-row
              class="mt-2"
              :style="{
                'border-left': configError
                  ? '2px solid var(--v-Failed-base) !important'
                  : ''
              }"
            >
              <v-col cols="12" class="pt-2">
                <div
                  v-if="tempType !== 'PREFECT_MESSAGE'"
                  class="text-h5 primary--text"
                >
                  Configuration
                </div>
                <div class="subtitle pt-2">
                  <span v-if="tempType == 'EMAIL'">
                    Input emails separated by commas; Prefect Cloud will send an
                    email to these addresses when your flow's State changes.
                  </span>
                  <span v-else-if="tempType == 'SLACK_WEBHOOK'">
                    Prefect Cloud will send a notification via Slack Webhook to
                    this endpoint when your flow's State changes. To read more
                    about Slack Webhooks, you can visit the
                    <a
                      href="https://api.slack.com/messaging/webhooks"
                      target="_blank"
                      >Slack API Docs</a
                    >.
                  </span>
                  <span v-else-if="tempType == 'TWILIO'">
                    Prefect Cloud will send a message via the
                    <a href="https://www.twilio.com/docs" target="_blank">
                      Twilio SMS API
                    </a>
                    on your behalf when your flow's State changes. You can
                    retrieve the <code class="my-1 mx-1">ACCOUNT SID</code> and
                    <code class="my-1 mx-1">AUTH TOKEN</code> from the dashboard
                    of your Twilio account. You'll need to configure a
                    <a
                      href="https://www.twilio.com/docs/sms/services/api#messaging-services-resource"
                      target="_blank"
                    >
                      Messaging Service
                    </a>
                    to recieve messages.
                  </span>
                  <span v-else-if="tempType == 'WEBHOOK'">
                    Prefect Cloud will send a JSON payload to this endpoint when
                    your flow's State changes.
                  </span>
                  <span v-else-if="tempType == 'PAGERDUTY'">
                    Prefect Cloud will send a PagerDuty notification when your
                    flow's State changes. Create your
                    <a
                      href="https://support.pagerduty.com/docs/generating-api-keys"
                      target="_blank"
                      >Pager Duty API token</a
                    >
                    in the Pager Duty app by visiting Configuration > API
                    Access. You'll also need an Integration Key, which can be
                    created by visiting the Integrations tab of the Service
                    Details page and setting up an
                    <a
                      href="https://support.pagerduty.com/docs/services-and-integrations"
                      target="_blank"
                      >Events API v2</a
                    >
                    integration.
                  </span>
                </div>
              </v-col>
              <v-col v-if="editable && canEdit" cols="12" class="pt-0 pr-8">
                <v-text-field
                  v-if="tempType == 'EMAIL'"
                  v-model="tempConfig.to"
                  :rules="[rules.required, rules.email]"
                  type="email"
                  label="To"
                  dense
                />
                <v-text-field
                  v-if="tempType == 'SLACK_WEBHOOK'"
                  v-model="tempConfig.url"
                  :rules="[rules.required, rules.url]"
                  label="Slack URL"
                  dense
                />

                <v-combobox
                  v-if="tempType == 'TWILIO'"
                  v-model="tempConfig.to"
                  :items="tempConfig.to"
                  :rules="[rules.requiredCombo]"
                  label="To"
                  multiple
                  chips
                  dense
                  hint="To add a number to the list, type the number and press enter."
                  persistent-hint
                >
                  <template #no-data>
                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title>
                          To add a new number, type the number and press enter.
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </template>
                </v-combobox>

                <v-text-field
                  v-if="tempType == 'TWILIO'"
                  v-model="tempConfig.auth_token"
                  class="my-8"
                  :rules="[rules.required]"
                  label="Auth Token"
                  dense
                />

                <v-text-field
                  v-if="tempType == 'TWILIO'"
                  v-model="tempConfig.account_sid"
                  :rules="[rules.required]"
                  label="Account SID"
                  class="mb-8"
                  dense
                />

                <v-text-field
                  v-if="tempType == 'TWILIO'"
                  v-model="tempConfig.messaging_service_sid"
                  :rules="[rules.required]"
                  label="Messaging service SID"
                  dense
                />

                <v-text-field
                  v-if="tempType == 'WEBHOOK'"
                  v-model="tempConfig.url"
                  :rules="[rules.required, rules.url]"
                  label="URL"
                  dense
                />
                <v-text-field
                  v-if="tempType == 'PAGERDUTY'"
                  v-model="tempConfig.api_token"
                  :rules="[rules.required]"
                  label="API Token"
                  class="my-8"
                  dense
                />
                <v-text-field
                  v-if="tempType == 'PAGERDUTY'"
                  v-model="tempConfig.routing_key"
                  :rules="[rules.required]"
                  label="Integration key"
                  dense
                  class="mb-8"
                />
                <v-select
                  v-if="tempType == 'PAGERDUTY'"
                  v-model="tempConfig.severity"
                  :items="severityLevels"
                  label="Severity"
                  dense
                />

                <div v-if="error && configError" class="error--text">
                  {{ error }}
                </div>
              </v-col>

              <v-col v-else cols="12" md="6" class="pt-0">
                <div
                  v-for="key in Object.keys(hook.config)"
                  :key="key"
                  class="my-4"
                >
                  <div class="text-caption">
                    {{ cloudHookKeyLabel(key) }}
                  </div>
                  <div class="text-h6">
                    <span v-if="shouldObfuscate(key)">
                      {{ hook.config[key] || 'None' | obfuscate }}
                    </span>
                    <span v-else-if="typeof hook.config[key] == 'object'">
                      <v-chip v-for="item in hook.config[key]" :key="item">
                        {{ item }}
                      </v-chip>
                    </span>
                    <span v-else-if="hook.config && hook.config.severity">
                      {{ hook.config.severity | capitalize }}
                    </span>
                    <span v-else>
                      {{ hook.config[key] || 'None' }}
                    </span>
                  </div>
                </div>
              </v-col>
            </v-row>

            <v-row class="mt-2">
              <v-col cols="12" class="pt-2">
                <div class="text-h5 primary--text">
                  States
                </div>
                <div class="text-subtitle-1">
                  Prefect Cloud will send information to your Cloud Hook when
                  your flow transitions to any of these states.
                  <div v-if="editable && canEdit" class="mt-2">
                    You can use state group presets or set custom notifiers.
                  </div>
                </div>
              </v-col>
              <v-col
                v-if="editable && canEdit"
                cols="12"
                class="pt-0 d-flex flex-space-around align-center"
              >
                <v-btn
                  class="ma-auto"
                  :color="stateGroupAll ? stateGroupColor('All') : ''"
                  depressed
                  :dark="stateGroupAll"
                  :disabled="!canEdit"
                  @click="_handleCloudHookStatesAll"
                >
                  All
                </v-btn>

                <v-btn
                  class="ma-auto"
                  :color="stateGroupFinished ? stateGroupColor('Finished') : ''"
                  depressed
                  :dark="stateGroupFinished"
                  :disabled="!canEdit"
                  @click="_handleCloudHookStatesFinished"
                >
                  Finished
                </v-btn>

                <v-btn
                  class="ma-auto"
                  :color="stateGroupSuccess ? stateGroupColor('Success') : ''"
                  depressed
                  :dark="stateGroupSuccess"
                  :disabled="!canEdit"
                  @click="_handleCloudHookStatesSuccess"
                >
                  Success
                </v-btn>

                <v-btn
                  class="ma-auto"
                  :color="stateGroupFailed ? stateGroupColor('Failed') : ''"
                  depressed
                  :dark="stateGroupFailed"
                  :disabled="!canEdit"
                  @click="_handleCloudHookStatesFailed"
                >
                  Failed
                </v-btn>

                <v-btn
                  class="ma-auto"
                  :color="stateGroupCustom ? stateGroupColor('Custom') : ''"
                  depressed
                  :dark="stateGroupCustom"
                  :disabled="!canEdit"
                  @click="_handleCloudHookStatesCustom"
                >
                  Custom
                </v-btn>
              </v-col>

              <v-col cols="12" class="mt-1 pt-0">
                <v-divider />

                <v-chip-group
                  v-if="canEdit"
                  v-model="tempStates"
                  column
                  multiple
                >
                  <v-chip
                    v-for="state in states"
                    :key="state"
                    active-class="primary"
                    class="capitalize"
                    label
                    :value="state"
                    :disabled="!canEdit"
                  >
                    {{ state.toLowerCase() }}
                  </v-chip>
                </v-chip-group>
                <v-chip-group v-else column>
                  <v-chip
                    v-for="state in states"
                    :key="state"
                    color="primary"
                    class="capitalize"
                    label
                    :value="state"
                  >
                    {{ state.toLowerCase() }}
                  </v-chip>
                </v-chip-group>

                <div v-if="states.length == 0 && !canEdit">
                  This Cloud Hook doesn't have any states configured.
                  <a @click="canEdit = true">Configure</a>
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <div v-if="error && !configError" class="error--text">
          {{ error }}
        </div>
        <div v-if="flowError" class="error--text">
          {{ flowError }}
        </div>
      </v-card-text>

      <v-divider class="mt-2"></v-divider>

      <v-card-actions v-if="canEdit">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          depressed
          data-cy="save-hook"
          :loading="loading"
          :disabled="loading || configError || !valid"
          @click="_handleSaveCloudHook"
        >
          Save
        </v-btn>
        <v-btn depressed @click="_handleCancel">
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>

<style>
.capitalize {
  text-transform: capitalize !important;
}
/* stylelint-disable */
.v-autocomplete__content.v-menu__content .v-select-list {
  border-radius: 0 0 4px 4px;
  max-width: 400px;
}
/* stylelint-enable */
</style>
