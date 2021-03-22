<script>
import { actionTypes } from '@/utils/cloudHooks'
import { mapGetters } from 'vuex'
import ListInput from '@/components/CustomInputs/ListInput'

export default {
  components: {
    ListInput
  },
  data() {
    return {
      saving: false,
      enableSave: false,
      messageType: { title: 'Send' },
      step: 'selectMessageType',
      messageConfig: null,
      messageConfigTo: [],
      messageName: 'a message to',
      secretName: '',
      messageText: '',
      openTwilioConfig: false,
      newSaveAs: '',
      authToken: '',
      accountSid: '',
      apiToken: '',
      routingKey: '',
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
      return this.messageType?.type === 'EMAIL' ||
        this.messageType.type === 'WEBHOOK'
        ? 'Email address(es)'
        : this.messageType?.type === 'TWILIO'
        ? 'Twilio Phone Numbers'
        : this.messageType?.type === 'SLACK_WEBHOOK'
        ? 'Slack Webhook Secret Name'
        : 'config details'
    },
    messageConfigRules() {
      return []
    },
    disableNext() {
      if (this.step === 'openToConfig') {
        if (!this.messageConfigTo.length) return true
        else return false
      } else {
        return false
      }
    },
    allowSave() {
      const type = this.messageType.type
      const allow = this.isPagerDuty
        ? !!this.messageType &&
          !!this.apiToken &&
          !!this.routingKey &&
          !!this.severity
        : this.isTwilio
        ? !!this.messageConfigTo &&
          !!this.authToken &&
          !!this.messagingService &&
          this.accountSid
        : !!this.messageType &&
          (!!this.secretName ||
            (!!this.messageConfigTo.length &&
              this.messageConfigTo.filter(
                item => this.rules[type](item) !== true
              ).length < 1))
      return allow && this.step === 'addName'
    },
    saveAs: {
      get() {
        const whoTo = this.messageConfigTo.length
          ? this.messageConfigTo
          : this.secretName
        return `${this.messageType.verb} ${whoTo}`
      },
      set(x) {
        this.newSaveAs = x
      }
    },
    to() {
      const configTo =
        this.messageConfigTo.length > 0
          ? this.messageConfigTo.toString()
          : this.secretName || ''
      return this.messageType?.type === 'EMAIL'
        ? configTo || this.messageType?.config?.to || 'to this email address.'
        : this.messageType.type === 'WEBHOOK'
        ? this.messageType?.config?.to || ' to this web address.'
        : this.messageType?.type === 'TWILIO'
        ? configTo ||
          this.messageType?.config?.to?.toString() ||
          'to this phone number'
        : this.messageType?.type === 'SLACK_WEBHOOK'
        ? configTo || this.messageType?.config?.url || 'to this webhook.'
        : this.messageType.type === 'PAGERDUTY'
        ? 'with this config.'
        : 'to who?'
    },
    isTwilio() {
      return this.messageType.type === 'TWILIO'
    },
    isPagerDuty() {
      return this.messageType.type === 'PAGERDUTY'
    },
    needsNext() {
      if (
        this.step === 'openToConfig' &&
        this.messageType.type === 'SLACK_WEBHOOK'
      )
        return false
      switch (this.step) {
        case 'openMessageText':
        case 'addTwilioConfig':
        case 'openToConfig':
          return true
        default:
          return false
      }
    }
  },
  methods: {
    switchStep(type) {
      if (type) this.step = type
    },
    handleNext() {
      if (this.step === 'openMessageText') {
        this.switchStep('openToConfig')
      } else if (this.step === 'openToConfig') {
        if (this.messageType.type === 'TWILIO') {
          this.switchStep('addTwilioConfig')
        } else {
          this.switchStep('addName')
        }
      }
    },
    selectMessageType(type) {
      this.messageType = type
      this.messageConfigTo = []
      this.switchStep('openMessageText')
    },
    handleClose() {
      this.$emit('close-action')
    },
    handleListInput(val) {
      this.messageConfigTo = val
    },
    saveConfig() {
      const type = this.messageType.type
      const checked =
        type != 'EMAIL'
          ? this.rules[type](this.messageConfigTo)
          : this.messageConfigTo.filter(
              email => this.rules['EMAIL'](email) !== true
            ).length < 1
      if (checked === true) {
        if (this.messageConfigTo) {
          switch (this.messageType.type) {
            case 'SLACK_WEBHOOK':
              {
                this.messageConfig = {
                  webhook_url_secret: this.secretName
                }
                if (this.messageText) {
                  this.messageConfig.message = this.bothMessages
                    ? `{} ${this.messageText}`
                    : this.messageText
                }
              }
              break
            case 'EMAIL':
              {
                this.messageConfig = { to_emails: this.messageConfigTo }
                if (this.messageText) {
                  this.messageConfig.body = this.bothMessages
                    ? `{} ${this.messageText}`
                    : this.messageText
                }
              }
              break
            case 'TWILIO':
              {
                this.messageConfig = {
                  phone_numbers: this.messageConfigTo,
                  auth_token_secret: this.authToken,
                  account_sid: this.accountSid,
                  messaging_service_sid: this.messagingService
                }
                if (this.messageText) {
                  this.messageConfig.message = this.bothMessages
                    ? `{} ${this.messageText}`
                    : this.messageText
                }
              }
              break
            case 'PAGERDUTY': {
              this.messageConfig = {
                api_token_secret: this.apiToken,
                routing_key: this.routingKey,
                severity: this.severity
              }
              if (this.messageText) {
                //TO DO - Don't think this is working - need to fix!
                this.messageConfig.message = this.bothMessages
                  ? `{} ${this.messageText}`
                  : this.messageText
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
      this.switchStep('addName')
    },
    // openTwilioConfigSection() {
    //   this.openTwilioConfig = !this.openTwilioConfig
    // },
    saveMessage() {
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
      switch (this.messageType.type) {
        case 'SLACK_WEBHOOK':
          config = {
            slack_notification: this.messageConfig
          }
          break
        case 'EMAIL':
          config = {
            email_notification: this.messageConfig
          }
          break
        case 'TWILIO':
          config = {
            twilio_notification: this.messageConfig
          }
          break
        case 'PAGERDUTY':
          config = {
            pagerduty_notification: this.messageConfig
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
  <v-card outlined>
    <v-card-title>
      <v-spacer></v-spacer>
      <v-btn
        text
        class="grey--text text--darken-2 light-weight-text mr-1"
        @click="handleClose"
      >
        <v-icon small>close</v-icon
        ><span style="text-transform: none;">Cancel</span></v-btn
      ><v-btn
        color="primary"
        elevation="0"
        :loading="saving"
        :disabled="!allowSave"
        @click="createAction"
        ><i class="far fa-cloud-upload-alt fa-lg"></i>
        <span class="pl-2">Save</span></v-btn
      ></v-card-title
    >

    <v-card-text class="headline">
      <v-btn
        :style="{ 'text-transform': 'none', 'min-width': '0px' }"
        :color="step === 'selectMessageType' ? 'codePink' : 'grey'"
        class="px-0 pb-1 headline"
        text
        @click="switchStep('selectMessageType')"
        >{{ messageType.title }}</v-btn
      >
      {{ ' ' }}
      <span>
        <v-btn
          :style="{ 'text-transform': 'none', 'min-width': '0px' }"
          class="px-0 pb-1 headline"
          text
          :color="step === 'openMessageText' ? 'codePink' : 'grey'"
          @click="switchStep('openMessageText')"
        >
          {{ messageText || messageName }}</v-btn
        >
      </span>
      <span>
        <v-btn
          :style="{ 'text-transform': 'none', 'min-width': '0px' }"
          class="px-1 pb-1 headline"
          text
          :color="step === 'openToConfig' ? 'codePink' : 'grey'"
          @click="switchStep('openToConfig')"
        >
          {{ to }}</v-btn
        >
        <span v-if="isTwilio">
          with this
          <v-btn
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            class="px-0 pb-1 headline"
            text
            :color="step === 'TwilioConfig' ? 'codePink' : 'grey'"
            @click="switchStep('addTwilioConfig')"
          >
            config</v-btn
          ></span
        ></span
      >
    </v-card-text>

    <v-card-text v-if="step === 'selectMessageType'">
      <v-row class="py-3">
        <v-col v-for="type in actionTypes()" :key="type.title" cols="6" sm="2">
          <div
            v-ripple
            class="chip-bigger d-flex align-center justify-start pa-2 cursor-pointer user-select-none"
            :class="{ active: messageType === type }"
            @click="selectMessageType(type)"
            ><v-icon left class="mx-4">
              {{ type.icon }}
            </v-icon>
            {{ type.title }}</div
          ></v-col
        ></v-row
      >
      <!-- <v-chip
        v-for="type in actionTypes()"
        :key="type.title"
        label
        :color="messageType === type ? 'codePink' : 'grey'"
        class="ma-1"
        outlined
        @click="selectMessageType(type)"
      >
        <v-icon left class="mr-2">
          {{ type.icon }}
        </v-icon>
        {{ type.title }}
      </v-chip> -->
    </v-card-text>
    <v-card-text v-else-if="step === 'openMessageText'" class="pt-0">
      <span class="primary--text"
        >Type your message here or leave blank to send a default message.</span
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
              >The default message varies depending on what type of action you
              attach the config to.
            </div>
            <div>
              For a state change event the message would be:
              <span class="font-weight-light"
                >"Run `{flow_run_name}` of flow `{flow_name}` entered state
                `{state}` with " "message `{state_message}`. See {flow_run_link}
                for more details."</span
              ></div
            >
            <div
              >For a flow SLA event the default message would be:
              <span class="font-weight-light"
                >"Run `{flow_run_name}` (`{flow_run_id}`) of flow `{flow_name}`
                failed `{kind}` " "SLA (`{flow_sla_config_id}`) after
                {duration_seconds} seconds. " "See {flow_run_link} for more
                details."</span
              ></div
            >
            <div
              >For an agent SLA event, the default message would be:
              <span class="font-weight-light"
                >"Agents sharing the config {agent_config_id} have failed the
                minimum healthy " "count of {sla_min_healthy}. The following
                agents are unhealthy: {agent_ids}"</span
              ></div
            ></v-card-text
          >
        </v-card>
      </v-menu>
      <!-- <v-checkbox v-model="bothMessages" class="mt-0 no-top" dense>
        <template #label
          ><span class="body-2"
            >Add this message <span class="font-weight-bold"> and</span> the
            default message.</span
          ></template
        >
      </v-checkbox> -->
      <v-text-field
        v-model="messageText"
        class="pt-0"
        @keydown.enter="saveMessage"
      />
    </v-card-text>
    <v-card-text v-else-if="step === 'openToConfig'">
      <v-row v-if="messageType.type === 'SLACK_WEBHOOK'" class="py-3">
        <v-col
          v-for="name in secretNames"
          :key="name"
          cols="6"
          sm="3"
          lg="2"
          class="pa-1"
        >
          <div
            v-ripple
            class="chip-small d-flex align-center justify-start px-2 cursor-pointer user-select-none"
            :class="{ active: secretName === name }"
            @click="selectSecret(name)"
            ><div class="text-truncate">
              {{ name }}
            </div></div
          >
        </v-col>
      </v-row>
      <!-- <v-text-field
        v-if="messageType.type === 'SLACK_WEBHOOK'"
        v-model="messageConfigTo"
        :label="messageConfigLabel"
        :rules="[rules[messageType.type]]"
        validate-on-blur
        :error-messages="errorMessage"
        @keyup.enter="saveConfig"
      ></v-text-field> -->
      <div v-else-if="isPagerDuty">
        <span>
          Prefect Cloud will send a PagerDuty notification. Create your
          <a
            href="https://support.pagerduty.com/docs/generating-api-keys"
            target="_blank"
            >Pager Duty API token</a
          >
          in the Pager Duty app by visiting Configuration > API Access. You'll
          also need an Integration Key, which can be created by visiting the
          Integrations tab of the Service Details page and setting up an
          <a
            href="https://support.pagerduty.com/docs/services-and-integrations"
            target="_blank"
            >Events API v2</a
          >
          integration.
        </span>

        <v-select
          v-model="apiToken"
          :items="secretNames"
          label="Name of your PagerDuty API Token Secret"
        />
        <v-select
          v-model="severity"
          :items="severityLevels"
          label="Severity"
          dense
        />
        <v-text-field
          v-model="routingKey"
          :rules="[rules.required]"
          label="Integration key"
          dense
          class="mb-8"
        />
      </div>
      <ListInput
        v-else-if="
          messageType.type === 'EMAIL' || messageType.type === 'TWILIO'
        "
        :label="messageConfigLabel"
        :value="messageConfigTo"
        :outline="false"
        :rules="[rules[messageType.type]]"
        :hide="false"
        :show-reset="false"
        :show-clear="false"
        @input="handleListInput"
      ></ListInput>
    </v-card-text>
    <v-card-text v-else-if="step === 'addTwilioConfig'">
      <div>
        <span>
          Prefect Cloud will send a message via the
          <a href="https://www.twilio.com/docs" target="_blank">
            Twilio SMS API </a
          >. You can retrieve the <code class="my-1 mx-1">ACCOUNT SID</code> and
          <code class="my-1 mx-1">AUTH TOKEN</code> from the dashboard of your
          Twilio account. You'll need to configure a
          <a
            href="https://www.twilio.com/docs/sms/services/api#messaging-services-resource"
            target="_blank"
          >
            Messaging Service
          </a>
          to recieve messages.
        </span>
      </div>

      <div>
        <v-select
          v-model="authToken"
          :items="secretNames"
          label="Name of Auth token Secret"
        />
        <v-text-field
          v-model="accountSid"
          :rules="[rules.required]"
          label="Account SID"
          class="pb-2"
          dense
        />
        <v-text-field
          v-model="messagingService"
          :rules="[rules.required]"
          label="Messaging service SID"
          dense
        />
      </div>
    </v-card-text>
    <v-card-text v-else-if="step === 'addName'" class="pr-4">
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-text-field
            v-model="saveAs"
            class="pr-4"
            label="Save As"
            v-bind="attrs"
            v-on="on"
          ></v-text-field>
        </template>
        Give your config a name so you can find and re-use it with more hooks.
      </v-tooltip>
    </v-card-text>
    <v-card-actions v-if="needsNext">
      <v-spacer></v-spacer>
      <v-btn
        class="text-normal mr-1 mb-1"
        depressed
        :disabled="disableNext"
        color="primary"
        title="Next"
        @click="handleNext"
      >
        Next
        <v-icon small>call_made</v-icon>
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
  height: 30px;
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
