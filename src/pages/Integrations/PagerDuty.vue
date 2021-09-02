<script>
import { actionTypes, jsonPlacehold } from '@/utils/automations'
import { mapGetters } from 'vuex'
import jsBeautify from 'js-beautify'

export default {
  components: {},
  props: {
    eventType: {
      type: String,
      required: false,
      default: ''
    },
    pdData: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      integration_keys: JSON.parse(this.pdData).integration_keys,
      account: JSON.parse(this.pdData).account,
      jsonPlacehold: jsonPlacehold.jsonBlob,
      steps: {
        openMessageText: { name: 'openMessageText', complete: false },
        openToConfig: { name: 'openToConfig', complete: false },
        addName: { name: 'addName', complete: false }
      },
      saving: false,
      enableSave: false,
      actionType: { title: 'Send' },
      step: null,
      actionConfig: null,
      actionConfigArray: [],
      messageName: 'message',
      messageText: '',
      newSaveAs: '',
      jsonPayload: null,
      validJson: true,
      routingKey: '',
      severity: '',
      severityLevels: [
        { text: 'Info', value: 'info' },
        { text: 'Warning', value: 'warning' },
        { text: 'Error', value: 'error' },
        { text: 'Critical', value: 'critical' }
      ],
      menu: false,
      errorMessage: '',
      rules: {
        PAGERDUTY: () => true,
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
      messageText =
        'TODO I need to consider the event type and the recommended text for the action'
      return messageText
    },
    disableNext() {
      if (this.step.name === 'openToConfig') {
        if (this.routingKey && this.severity) return false
        if (!this.actionConfigArray.length) return true
        else return false
      } else {
        if (this.jsonPayload && !this.validJson) return true
        return false
      }
    },
    allowSave() {
      const type = this.actionType.type
      let allow = this.isPagerDuty
        ? !!this.actionType && !!this.routingKey && !!this.severity
        : !!this.actionType &&
          !!this.actionConfigArray.length &&
          this.actionConfigArray.filter(item => this.rules[type](item) !== true)
            .length < 1
      return allow && this.step.name === 'addName'
    },
    saveAs: {
      get() {
        const whoTo = this.actionConfigArray.length
          ? this.actionConfigArray
          : this.webhookURLString
        return `${this.actionType.verb} ${whoTo}`
      },
      set(x) {
        this.newSaveAs = x
      }
    }
  },
  created() {
    this.step = this.steps['openMessageText']
  },
  methods: {
    jsonPlaceholder() {
      this.jsonPlacehold.message = this.messagePlaceholder
      return jsBeautify(JSON.stringify(this.jsonPlacehold))
    },
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
          else if (this.apiToken && this.routingKey && this.severity) {
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
            case 'PAGERDUTY':
              {
                this.actionConfig = {
                  routing_key: this.routingKey,
                  severity: this.severity
                }
                if (this.messageText) {
                  this.actionConfig.message = this.messageText
                }
              }
              break
          }
        }
      } else {
        this.errorMessage = checked
      }
    },
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
        case 'PAGERDUTY':
          config = {
            pagerduty_notification: this.actionConfig
          }
          break
        default:
          config = {}
      }
      const name = this.newSaveAs || this.saveAs
      const input = { name: name, config }
      this.$emit('new-action', input)
    }
  }
}
</script>

<template>
  <v-card elevation="0">
    <v-card-text>
      <span
        >Props: {{ this.pdData }} Integration Keys:
        {{ integration_keys }} Account: {{ account }}
      </span>
    </v-card-text>
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

    <v-card-text v-if="step.name === 'openMessageText'" class="pt-0">
      <div>
        <span class="primary--text"
          >Type your message here or leave blank to send a default message.
        </span>
        <v-menu
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
                attach the action to. You can also send a custom message.

                <div class="mt-2">
                  Attributes you can include in a custom message include:
                  <ul
                    ><li>event_id</li>
                    <li>flow_name</li
                    ><li> flow_run_name</li>
                    <li>flow_run_id</li>
                    <li>agent_ids</li>
                    <li>state</li>
                    <li>state_message</li>
                    <li>flow_run_link</li>
                  </ul>
                </div>
                <div class="mt-2">
                  For example:
                  <div>{{
                    `"Run {flow_run_name} from flow {flow_name} needs
                your attention! See: {flow_run_link}"`
                  }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-menu>
        <v-textarea
          v-model="messageText"
          class="pt-0"
          outlined
          :placeholder="messagePlaceholder"
          @keydown.enter="saveMessage"
        />
      </div>
    </v-card-text>
    <v-card-text v-else-if="step.name === 'openToConfig'">
      <div>
        <span>
          Prefect Cloud will send a PagerDuty notification. Create your
          <a
            href="https://support.pagerduty.com/docs/generating-api-keys"
            target="_blank"
            >Pager Duty API token</a
          >
          Add some text here about setting up an action with the pager duty
          information maybe
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
              v-model="severity"
              :items="severityLevels"
              outlined
              label="Severity"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="routingKey"
              label="Integration key"
              outlined
              class="mb-8"
            />
          </v-col>
        </v-row>
      </div>
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
