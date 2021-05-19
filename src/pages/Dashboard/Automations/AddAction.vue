<script>
import { actionTypes } from '@/utils/automations'
import { mapGetters } from 'vuex'
import ListInput from '@/components/CustomInputs/ListInput'
import JsonInput from '@/components/CustomInputs/JsonInput'

export default {
  components: {
    ListInput,
    JsonInput
  },
  props: {
    eventType: {
      type: String,
      required: false,
      default: ''
    }
  },
  data() {
    return {
      steps: {
        selectActionType: { name: 'selectActionType', complete: false },
        openMessageText: { name: 'openMessageText', complete: false },
        openToConfig: { name: 'openToConfig', complete: false },
        addTwilioConfig: { name: 'addTwilioConfig', complete: false },
        addMSTeamsConfig: { name: 'addMSTeamsConfig', complete: false },
        addName: { name: 'addName', complete: false }
      },
      saving: false,
      enableSave: false,
      actionType: { title: 'Send' },
      step: null,
      actionConfig: null,
      actionConfigArray: [],
      messageName: 'message',
      secretName: '',
      messageText: '',
      openTwilioConfig: false,
      newSaveAs: '',
      authToken: '',
      accountSid: '',
      apiToken: '',
      jsonPayload: null,
      validJson: true,
      jsonPlaceholder: { 'event-id': '{event.id}' },
      routingKey: '',
      webhookUrlSecret: null,
      severity: '',
      severityLevels: [
        { text: 'Info', value: 'info' },
        { text: 'Warning', value: 'warning' },
        { text: 'Error', value: 'error' },
        { text: 'Critical', value: 'critical' }
      ],
      messagingService: '',
      menu: false,
      bothMessages: false,
      errorMessage: '',
      rules: {
        SLACK_WEBHOOK: () => true,
        PAGERDUTY: () => true,
        MS_TEAMS: () => true,
        WEBHOOK: () => true,
        EMAIL: val => {
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          if (!val) return 'Email is required.'
          if (!Array.isArray(val))
            return pattern.test(val.trim()) || 'Invalid e-mail.'
          return (
            val.every(email => pattern.test(email.trim())) || 'Invalid e-mail.'
          )
        },
        TWILIO: val => {
          const pattern = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/
          if (!val) return 'Phone number is required.'
          else if (!Array.isArray(val)) {
            return (
              pattern.text(val.trim()) || 'Entries must be a valid phone number'
            )
          } else {
            const check =
              val.every(item => pattern.test(item.trim())) ||
              'Entries must be a valid phone number'
            return check
          }
        },
        required: val => !!val || 'Required',
        requiredCombo: val =>
          (!!val && val.length > 0) || 'At least one number is required',
        url: val => {
          const pattern = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/
          return pattern.test(val) || 'Invalid URL.'
        }
      }
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('user', ['user']),
    messageConfigLabel() {
      return this.actionType?.type === 'EMAIL'
        ? 'Email address(es)'
        : this.actionType?.type === 'WEBHOOK'
        ? 'Web address'
        : this.actionType?.type === 'TWILIO'
        ? 'Twilio Phone Numbers'
        : this.actionType?.type === 'SLACK_WEBHOOK'
        ? 'Slack Webhook Secret Name'
        : 'config details'
    },
    messagePlaceholder() {
      let messageText
      switch (this.eventType) {
        case 'CHANGES_STATE':
          messageText =
            'Run {flow_run_name} of flow {flow_name} entered state {state} with message {state_message}. See {flow_run_link} for more details.'
          break
        case 'SCHEDULED_NOT_STARTED':
          messageText =
            'Run {flow_run_name} ({flow_run_id}) of flow {flow_name} failed {kind} SLA {flow_sla_config_id} after {duration_seconds} seconds. See {flow_run_link} for more details.'
          break
        case 'STARTED_NOT_FINISHED':
          messageText =
            'Run {flow_run_name} ({flow_run_id}) of flow {flow_name} failed {kind} SLA {flow_sla_config_id} after {duration_seconds} seconds. See {flow_run_link} for more details.'
          break
        case 'AGENT':
          messageText =
            'Agents sharing the config {agent_config_id} have failed the minimum healthy count of {sla_min_healthy}. The following agents are unhealthy: {agent_ids}'
          break
        default:
          'You have a notification from Prefect Cloud'
      }
      return messageText
    },
    messageConfigRules() {
      return []
    },
    disableNext() {
      if (this.step.name === 'openToConfig') {
        if (
          this.isPagerDuty &&
          this.apiToken &&
          this.routingKey &&
          this.severity
        )
          return false
        if (!this.actionConfigArray.length) return true
        else return false
      } else {
        if (this.jsonPayload && !this.validJson) return true
        if (this.step.name === 'addTwilioConfig') {
          if (!!this.authToken && !!this.messagingService && !!this.accountSid)
            return false
          return true
        }
        return false
      }
    },
    allowSave() {
      const type = this.actionType.type
      const allow = this.isPagerDuty
        ? !!this.actionType &&
          !!this.apiToken &&
          !!this.routingKey &&
          !!this.severity
        : this.isTwilio
        ? !!this.actionConfigArray &&
          !!this.authToken &&
          !!this.messagingService &&
          this.accountSid
        : this.isMSTeams
        ? !!this.webhookUrlSecret
        : this.isWebhook
        ? !!this.webhookUrlSecret
        : !!this.actionType &&
          (!!this.secretName ||
            (!!this.actionConfigArray.length &&
              this.actionConfigArray.filter(
                item => this.rules[type](item) !== true
              ).length < 1))
      return allow && this.step.name === 'addName'
    },
    saveAs: {
      get() {
        const whoTo = this.actionConfigArray.length
          ? this.actionConfigArray
          : this.secretName || this.webhookUrlSecret
        return `${this.actionType.verb} ${whoTo}`
      },
      set(x) {
        this.newSaveAs = x
      }
    },
    to() {
      const configTo =
        this.actionConfigArray.length > 0
          ? `to ${this.actionConfigArray.toString()}`
          : this.secretName
          ? `to ${this.secretName}`
          : ''
      const config =
        !this.isTwilio && this.actionType?.config?.to
          ? `to ${this.actionType?.config?.to}`
          : this.isTwilio && this.actionType?.config?.to.length
          ? this.actionType?.config?.to.toString()
          : false
      return this.actionType?.type === 'EMAIL'
        ? configTo || config || 'to this email address.'
        : this.actionType.type === 'WEBHOOK'
        ? config || 'to this web address.'
        : this.actionType?.type === 'TWILIO'
        ? configTo || config || 'to this phone number'
        : this.actionType?.type === 'SLACK_WEBHOOK'
        ? configTo || config || 'here.'
        : this.actionType.type === 'PAGERDUTY'
        ? 'using this config.'
        : this.actionType.type === 'MS_TEAMS'
        ? 'using this config.'
        : 'to who?'
    },
    isTwilio() {
      return this.actionType.type === 'TWILIO'
    },
    isPagerDuty() {
      return this.actionType.type === 'PAGERDUTY'
    },
    isWebhook() {
      return this.actionType.type === 'WEBHOOK'
    },
    isMSTeams() {
      return this.actionType.type === 'MS_TEAMS'
    }
    // needsNext() {
    //   if (
    //     this.step === 'openToConfig' &&
    //     this.actionType.type === 'SLACK_WEBHOOK'
    //   )
    //     return false
    //   switch (this.step) {
    //     case 'openMessageText':
    //     case 'addTwilioConfig':
    //     case 'openToConfig':
    //       return true
    //     default:
    //       return false
    //   }
    // }
  },
  created() {
    this.step = this.steps['selectActionType']
  },
  methods: {
    buttonColor(selectedStep) {
      return this.step.name === selectedStep ? 'codePink' : 'utilGrayDark'
    },
    format(selectedStep, otherStep) {
      const stepComplete = this.steps[selectedStep]
      const otherComplete = this.steps[otherStep]
      return this.step.name === selectedStep || this.step.name === otherStep
        ? 'font-weight-dark'
        : stepComplete?.complete || otherComplete?.complete
        ? 'font-weight-light'
        : ''
    },
    switchStep(selectedStep) {
      if (this.step.name === 'openMessageText')
        this.steps['openMessageText'].complete = true
      this.step = this.steps[selectedStep]
    },
    handleJsonValidation(event) {
      this.validJson = !event
    },
    handleNext() {
      if (this.step.name === 'openMessageText') {
        this.steps['openMessageText'].complete = true
        this.switchStep('openToConfig')
      } else if (this.step.name === 'openToConfig') {
        if (this.actionType.type === 'TWILIO') {
          if (this.actionConfigArray.length)
            this.steps['openToConfig'].complete = true
          this.switchStep('addTwilioConfig')
        } else {
          if (this.actionType.type === 'EMAIL' && this.actionConfigArray.length)
            this.steps['openToConfig'].complete = true
          else if (
            this.isPagerDuty &&
            this.apiToken &&
            this.routingKey &&
            this.severity
          ) {
            this.steps['openToConfig'].complete = true
          }
          this.switchStep('addName')
        }
      } else {
        this.switchStep('addName')
      }
    },
    selectActionType(type) {
      this.actionType = type
      this.actionConfigArray = []
      this.steps = {
        selectActionType: { name: 'selectActionType', complete: false },
        openMessageText: { name: 'openMessageText', complete: false },
        openToConfig: { name: 'openToConfig', complete: false },
        addTwilioConfig: { name: 'addTwilioConfig', complete: false },
        addName: { name: 'addName', complete: false }
      }
      this.steps.selectActionType.complete = true
      this.switchStep('openMessageText')
    },
    handleClose() {
      this.$emit('close-action')
    },
    handleListInput(val) {
      this.actionConfigArray = val
      this.steps['openToConfig'].complete = true
    },
    handleWebHookURLSecretInput(val) {
      this.actionConfigArray = val
      this.steps['openToConfig'].complete = true
    },
    saveConfig() {
      const type = this.actionType.type
      const checked =
        type != 'EMAIL'
          ? this.rules[type](this.actionConfigArray)
          : this.actionConfigArray.filter(
              email => this.rules['EMAIL'](email) !== true
            ).length < 1
      if (checked === true) {
        if (this.actionConfigArray) {
          switch (this.actionType.type) {
            case 'SLACK_WEBHOOK':
              {
                this.actionConfig = {
                  webhook_url_secret: this.secretName
                }
                if (this.messageText) {
                  this.actionConfig.message = this.bothMessages
                    ? `{} ${this.messageText}`
                    : this.messageText
                }
              }
              break
            case 'EMAIL':
              {
                this.actionConfig = { to_emails: this.actionConfigArray }
                if (this.messageText) {
                  this.actionConfig.body = this.bothMessages
                    ? `{} ${this.messageText}`
                    : this.messageText
                }
              }
              break
            case 'TWILIO':
              {
                this.actionConfig = {
                  phone_numbers: this.actionConfigArray,
                  auth_token_secret: this.authToken,
                  account_sid: this.accountSid,
                  messaging_service_sid: this.messagingService
                }
                if (this.messageText) {
                  this.actionConfig.message = this.bothMessages
                    ? `{} ${this.messageText}`
                    : this.messageText
                }
              }
              break
            case 'PAGERDUTY':
              {
                this.actionConfig = {
                  api_token_secret: this.apiToken,
                  routing_key: this.routingKey,
                  severity: this.severity
                }
                if (this.messageText) {
                  this.actionConfig.message = this.bothMessages
                    ? `{} ${this.messageText}`
                    : this.messageText
                }
              }
              break
            case 'MS_TEAMS':
              {
                this.actionConfig = {
                  webhook_url_secret: this.webhookUrlSecret
                }
                if (this.messageText) {
                  this.actionConfig.message = this.bothMessages
                    ? `{} ${this.messageText}`
                    : this.messageText
                }
              }
              break
            case 'WEBHOOK': {
              this.actionConfig = {
                url: this.webhookUrlSecret
              }
              if (this.jsonPayload) {
                this.actionConfig.payload = JSON.parse(this.jsonPayload)
              }
            }
          }
        }
      } else {
        this.errorMessage = checked
      }
    },
    selectSecret(secretName) {
      this.secretName = secretName
      this.steps['openToConfig'].complete = true
      this.switchStep('addName')
    },
    // openTwilioConfigSection() {
    //   this.openTwilioConfig = !this.openTwilioConfig
    // },
    saveMessage() {
      this.steps['openMessageText'].complete = true
      this.switchStep('openToConfig')
    },
    actionTypes() {
      let allHooks
      allHooks = actionTypes
      return allHooks.filter(
        t => (t.requiresCloud && this.isCloud) || !t.requiresCloud
      )
    },
    createAction() {
      this.saving = true
      this.saveConfig()
      let config
      switch (this.actionType.type) {
        case 'SLACK_WEBHOOK':
          config = {
            slack_notification: this.actionConfig
          }
          break
        case 'EMAIL':
          config = {
            email_notification: this.actionConfig
          }
          break
        case 'TWILIO':
          config = {
            twilio_notification: this.actionConfig
          }
          break
        case 'PAGERDUTY':
          config = {
            pagerduty_notification: this.actionConfig
          }
          break
        case 'MS_TEAMS':
          config = {
            teams_webhook_notification: this.actionConfig
          }
          break
        case 'WEBHOOK':
          config = {
            webhook: this.actionConfig
          }
          break
        default:
          config = {}
      }
      const name = this.newSaveAs || this.saveAs
      const input = { name: name, config }
      this.$emit('new-action', input)
    }
  },
  apollo: {
    secretNames: {
      query: require('@/graphql/Tenant/tenant-secret-names.gql'),
      update: data => data.secret_names
    }
  }
}
</script>

<template>
  <v-card elevation="0">
    <v-card-text class="text-h6 font-weight-light">
      <v-row>
        <v-col cols="9" lg="10">
          <span v-if="actionType.sendText" class="mr-1">{{
            actionType.sendText
          }}</span>
          <v-btn
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            :color="buttonColor('selectActionType')"
            :class="format('selectActionType')"
            class="px-0 pb-1 text-h6"
            text
            @click="switchStep('selectActionType')"
            ><span>{{ actionType.title }}</span></v-btn
          >
          {{ ' ' }}
          <span>
            <v-btn
              v-if="!messageText"
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              class="px-0 pb-1 text-h6 d-inline-block text-truncate"
              max-width="300px"
              text
              :disabled="!actionType.type"
              :color="buttonColor('openMessageText')"
              :class="format('openMessageText')"
              @click="switchStep('openMessageText')"
            >
              <span v-if="isWebhook" class="mr-1"> JSON </span> message</v-btn
            >
            <v-tooltip v-else top>
              <template #activator="{ on, attrs }">
                <v-btn
                  :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                  class="px-0 pb-1 text-h6 d-inline-block text-truncate"
                  max-width="300px"
                  text
                  :disabled="!actionType.type"
                  :color="buttonColor('openMessageText')"
                  :class="format('openMessageText')"
                  v-bind="attrs"
                  @click="switchStep('openMessageText')"
                  v-on="on"
                >
                  message</v-btn
                ></template
              >{{ messageText }}</v-tooltip
            >
          </span>
          <span>
            <v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              class="pb-1 px-0 ml-1 text-h6"
              text
              :disabled="!actionType.type"
              :color="buttonColor('openToConfig')"
              :class="format('openToConfig')"
              @click="switchStep('openToConfig')"
              >{{ to }}</v-btn
            >
            <span v-if="isTwilio">
              using this
              <v-btn
                :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                class="px-0 pb-1 text-h6"
                text
                :color="buttonColor('addTwilioConfig')"
                :class="format('openToConfig')"
                @click="switchStep('addTwilioConfig')"
              >
                config.</v-btn
              ></span
            ></span
          ></v-col
        >
        <v-col cols="3" lg="2" class="text-right">
          <v-btn
            text
            color="utilGrayMid"
            class="light-weight-text mr-1 px-2"
            @click="handleClose"
          >
            <span style="text-transform: none;">Cancel</span></v-btn
          ><v-btn
            color="primary"
            elevation="0"
            :loading="saving"
            :disabled="!allowSave"
            @click="createAction"
            ><span style="text-transform: none;">Save</span></v-btn
          ></v-col
        >
      </v-row>
    </v-card-text>

    <v-card-text v-if="step.name === 'selectActionType'">
      <v-row>
        <v-col
          v-for="type in actionTypes()"
          :key="type.title"
          cols="6"
          sm="4"
          md="2"
        >
          <div
            v-ripple
            class="chip-bigger d-flex align-center justify-start pa-2 cursor-pointer text-body-1"
            :class="{ active: actionType === type }"
            @click="selectActionType(type)"
            ><v-icon left class="mx-4">
              {{ type.icon }}
            </v-icon>
            {{ type.title }}</div
          ></v-col
        ></v-row
      >
    </v-card-text>
    <v-card-text v-else-if="step.name === 'openMessageText'" class="pt-0">
      <div>
        <span v-if="!isWebhook" class="primary--text"
          >Type your message here or leave blank to send a default message.
        </span>
        <span v-else class="primary--text"
          >Enter custom JSON payload to send as part of your webhook or leave
          blank to send data from the event that triggers the
          notification.</span
        ><v-menu
          v-model="menu"
          :close-on-content-click="false"
          :open-on-hover="true"
        >
          <template #activator="{ on, attrs }">
            <v-btn icon small v-bind="attrs" v-on="on">
              <v-icon color="primary" small>info</v-icon>
            </v-btn>
          </template>

          <v-card width="30vW">
            <v-card-text
              ><div class="mb-2"
                >The default message varies depending on what type of event you
                attach the action to.
              </div>
              <div>
                For a state change event the message would be:
                <span class="font-weight-light"
                  >"Run {flow_run_name} of flow {flow_name} entered state
                  {state} with message {state_message}. See {flow_run_link} for
                  more details."</span
                ></div
              >
              <div
                >For a flow SLA event the default message would be:
                <span class="font-weight-light"
                  >"Run {flow_run_name} ({flow_run_id}) of flow {flow_name}
                  failed {kind} SLA ({flow_sla_config_id}) after
                  {duration_seconds} seconds. See {flow_run_link} for more
                  details."</span
                ></div
              >
              <div
                >For an agent SLA event, the default message would be:
                <span class="font-weight-light"
                  >"Agents sharing the config {agent_config_id} have failed the
                  minimum healthy count of {sla_min_healthy}. The following
                  agents are unhealthy: {agent_ids}"</span
                ></div
              ></v-card-text
            >
          </v-card>
        </v-menu>
        <v-textarea
          v-if="!isWebhook"
          v-model="messageText"
          class="pt-0"
          outlined
          :placeholder="messagePlaceholder"
          @keydown.enter="saveMessage"
        />

        <JsonInput
          v-else
          v-model="jsonPayload"
          selected-type="json"
          :placeholder-text="jsonPlaceholder"
          @invalid-secret="handleJsonValidation"
        />
      </div>
    </v-card-text>
    <v-card-text v-else-if="step.name === 'openToConfig'">
      <v-row v-if="actionType.type === 'SLACK_WEBHOOK'" class="py-3 px-1">
        <div v-if="!secretNames || !secretNames.length" class="mx-2">
          To set up a slack webhook, you'll need to create a
          <router-link :to="{ name: 'secrets' }">secret</router-link> with your
          slack webhook url.
        </div>
        <div v-else class="mx-2">
          Select the name of the
          <router-link :to="{ name: 'secrets' }">secret</router-link> for your
          Slack webhook url.
        </div>
      </v-row>
      <v-row v-if="actionType.type === 'SLACK_WEBHOOK'" class="px-1">
        <div
          v-for="name in secretNames"
          :key="name"
          v-ripple
          class="chip-small px-2 pb-2 pt-1 ma-2 cursor-pointer text-body-1"
          :class="{ active: secretName === name }"
          @click="selectSecret(name)"
          ><div class="text-truncate">
            {{ name }}
          </div></div
        >
      </v-row>

      <div v-else-if="isPagerDuty">
        <span>
          Prefect Cloud will send a PagerDuty notification. Create your
          <a
            href="https://support.pagerduty.com/docs/generating-api-keys"
            target="_blank"
            >Pager Duty API token</a
          >
          in the Pager Duty app by visiting Configuration > API Access. To
          securely store your API Token, you'll need to create a
          <router-link :to="{ name: 'secrets' }">secret</router-link>. You'll
          also need an Integration Key, which can be created by visiting the
          Integrations tab of the Service Details page and setting up an
          <a
            href="https://support.pagerduty.com/docs/services-and-integrations"
            target="_blank"
            >Events API v2</a
          >
          integration.
        </span>
        <v-row class="mt-2">
          <v-col cols="12" md="4">
            <v-select
              v-model="apiToken"
              :items="secretNames"
              outlined
              label="PagerDuty API Token Secret"
              no-data-text="You will need to create a secret with your PagerDuty API Token"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="severity"
              :items="severityLevels"
              outlined
              label="Severity"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="routingKey"
              :rules="[rules.required]"
              label="Integration key"
              outlined
              class="mb-8"
            />
          </v-col>
        </v-row>
      </div>
      <div
        v-else-if="actionType.type === 'EMAIL' || actionType.type === 'TWILIO'"
      >
        <div class="mb-1 text-caption">
          Hint: add to the list after typing by pressing the Enter key
        </div>
        <ListInput
          :label="messageConfigLabel"
          :value="actionConfigArray"
          :rules="[rules[actionType.type]]"
          :hide="false"
          :show-reset="false"
          :show-clear="false"
          @input="handleListInput"
        ></ListInput>
      </div>

      <div
        v-else-if="
          actionType.type === 'MS_TEAMS' || actionType.type === 'WEBHOOK'
        "
      >
        <div v-if="actionType.type === 'WEBHOOK'">
          <span>
            Prefect Cloud will send a message via the URL you provide. To
            securely store your webhook URL, create a
            <router-link :to="{ name: 'secrets' }"> Prefect secret</router-link
            >.
          </span>
        </div>
        <div v-else-if="actionType.type === 'MS_TEAMS'">
          <span>
            Prefect Cloud will send a message via the
            <a
              href="https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using#setting-up-a-custom-incoming-webhook"
              target="_blank"
            >
              MS Teams API</a
            >; you'll need to set up a Teams Incoming Webhook Connector and
            retreive the webhook URL. To securely store your webhook URL, create
            a
            <router-link :to="{ name: 'secrets' }"> Prefect secret</router-link
            >.
          </span>
        </div>

        <v-row class="mt-2">
          <v-col cols="12" md="4">
            <v-select
              v-model="webhookUrlSecret"
              outlined
              :items="secretNames"
              label="Webhook URL Secret"
              no-data-text="You will need to create a secret with your Webhook URL"
              @change="handleWebHookURLSecretInput"
            />
          </v-col>
        </v-row>
      </div>
    </v-card-text>

    <v-card-text v-else-if="step.name === 'addTwilioConfig'">
      <div>
        <span>
          Prefect Cloud will send a message via the
          <a href="https://www.twilio.com/docs" target="_blank">
            Twilio SMS API</a
          >. You can retrieve the <code class="my-1 mx-1">ACCOUNT SID</code> and
          <code class="my-1 mx-1">AUTH TOKEN</code> from the dashboard of your
          Twilio account. To securely store your auth token, create a
          <router-link :to="{ name: 'secrets' }"> Prefect secret</router-link>.
          You'll also need to configure a
          <a
            href="https://www.twilio.com/docs/sms/services/api#messaging-services-resource"
            target="_blank"
          >
            Messaging Service</a
          >
          to recieve messages.
        </span>
      </div>

      <v-row class="mt-4">
        <v-col cols="12" md="4">
          <v-select
            v-model="authToken"
            outlined
            :items="secretNames"
            label="Name of Auth token Secret"
            no-data-text="You will need to create a secret with your PagerDuty API Token"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="accountSid"
            outlined
            :rules="[rules.required]"
            label="Account SID"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="messagingService"
            outlined
            :rules="[rules.required]"
            label="Messaging service SID"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text v-else-if="step.name === 'addName'" class="pr-4">
      <div class="pb-2"
        >Give your action a name so you can find and re-use it with more
        automations.</div
      >
      <v-text-field
        v-model="saveAs"
        outlined
        class="pr-4"
        label="Save As"
      ></v-text-field>
    </v-card-text>
    <v-card-actions v-if="step.name !== 'addName'">
      <v-spacer></v-spacer>
      <v-btn
        class="text-normal mr-1 mb-1"
        depressed
        :disabled="disableNext"
        color="primary"
        title="Next"
        @click="handleNext"
        ><span style="text-transform: none;"> Next</span>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.no-top {
  margin-top: 1px;
}
</style>

<style lang="scss" scoped>
.chip-bigger {
  border: 1px solid;
  border-color: var(--v-utilGrayLight-base) !important;
  border-radius: 5px;
  height: 60px;
  transition: all 50ms;
  width: 100%;

  &.active {
    border-color: var(--v-codePink-base) !important;
  }

  &:hover,
  &:focus {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.chip-small {
  border: 1px solid;
  border-color: var(--v-utilGrayLight-base) !important;
  border-radius: 5px;
  height: 35px;
  max-width: fit-content;
  transition: all 50ms;
  width: 100%;

  &.active {
    border-color: var(--v-codePink-base) !important;
  }

  &:hover,
  &:focus {
    background-color: rgba(0, 0, 0, 0.05);
  }
}
</style>
