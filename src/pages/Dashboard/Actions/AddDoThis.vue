<script>
//This page will need updating!
import { actionTypes } from '@/utils/cloudHooks'
import { mapGetters } from 'vuex'
import ListInput from '@/components/CustomInputs/ListInput'

export default {
  components: {
    ListInput
  },
  data() {
    return {
      addName: false,
      messageType: { title: 'Send' },
      openSendMessage: true,
      openMessageConfig: false,
      messageConfig: null,
      messageConfigTo: [],
      // To do - can we check what the default message will be?
      messageName: 'this message',
      messageText: '',
      openMessageText: false,
      openTwilioConfig: false,
      openName: false,
      newSaveAs: '',
      isPagerDuty: false,
      authToken: '',
      accountSid: '',
      messagingService: '',
      menu: false,
      bothMessages: false,
      errorMessage: '',
      rules: {
        SLACK_WEBHOOK: () => true,
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
          if (!val) return 'Phone number is required.'
          if (!Array.isArray(val))
            return !isNaN(parseFloat(val)) || 'Entries must be a number'
          return val.every(
            item => !isNaN(parseFloat(item)) || 'Entries must be a number'
          )
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
        ? 'What is the name of the secret your slack webhook is stored as?'
        : 'config details'
    },
    messageConfigRules() {
      return []
    },
    allowSave() {
      const type = this.messageType.type
      return (
        !!this.messageType &&
        !!this.messageConfigTo &&
        this.messageConfigTo.filter(item => this.rules[type](item) !== true)
          .length < 1 &&
        this.newSaveAs
      )
    },
    saveAs: {
      get() {
        return `${this.messageType.title} ${this.messageConfigTo}`
      },
      set(x) {
        this.newSaveAs = x
      }
    },
    to() {
      return this.messageType?.type === 'EMAIL'
        ? this.messageConfigTo.toString() ||
            this.messageType?.config?.to ||
            'this email address.'
        : this.messageType.type === 'WEBHOOK'
        ? this.messageType?.config?.to || ' this web address.'
        : this.messageType?.type === 'TWILIO'
        ? this.messageConfigTo.toString() ||
          this.messageType?.config?.to?.toString() ||
          'this phone number'
        : this.messageType?.type === 'SLACK_WEBHOOK'
        ? this.messageConfigTo ||
          this.messageType?.config?.url ||
          ' this webhook.'
        : 'who?'
    },
    isTwilio() {
      return this.messageType.type === 'TWILIO'
    },
    completeConfig() {
      return this.messageType && this.messageConfigTo
    }
  },
  methods: {
    selectMessageType(type) {
      this.messageType = type
      this.openSendMessage = false
      this.openMessageText = true
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
                this.messageConfig = { webhook_url: this.messageConfigTo }
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
            case 'TWILIO': {
              this.messageConfig = {
                phone_numbers: this.messageConfigTo,
                auth_token: this.authToken,
                account_sid: this.accountSid,
                messaging_service_sid: this.messagingService
              }
              if (this.messageText) {
                this.messageConfig.message = this.bothMessages
                  ? `{} ${this.messageText}`
                  : this.messageText
              }
            }
          }
        }
        this.openMessageConfig ? (this.openMessageConfig = false) : null
      } else {
        this.errorMessage = checked
      }
    },
    openTwilioConfigSection() {
      this.openTwilioConfig = !this.openTwilioConfig
    },
    saveMessage() {
      if (this.openMessageText) {
        this.openMessageText = false
        this.openMessageConfig = true
      }
    },
    actionTypes() {
      let allHooks
      //   if (
      //     this.canEdit &&
      //     this.editable &&
      //     this.tenant.prefectAdminSettings?.notifications
      //   ) {
      allHooks = actionTypes
      //   } else {
      //     allHooks =
      //       this.canEdit && this.editable
      //         ? openCloudHookTypes
      //         : openCloudHookTypes.filter(t => t.type == this.hook.type)
      //   }
      return allHooks.filter(
        t => (t.requiresCloud && this.isCloud) || !t.requiresCloud
      )
    },
    createAction() {
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
    <div class="pb-1 pt-2"
      ><v-btn
        text
        class="grey--text text--darken-2 light-weight-text"
        @click="handleClose"
      >
        <v-icon>chevron_left</v-icon
        ><span style="text-transform: none;">Back </span></v-btn
      >
    </div>
    <div class="headline black--text ma-4">
      <v-btn
        :style="{ 'text-transform': 'none', 'min-width': '0px' }"
        :color="openSendMessage ? 'codePink' : 'grey'"
        class="px-0 pb-1 headline"
        text
        @click="openSendMessage = !openSendMessage"
        >{{ messageType.title }}</v-btn
      >
      {{ ' ' }}
      <span>
        <v-btn
          :style="{ 'text-transform': 'none', 'min-width': '0px' }"
          class="px-0 pb-1 headline"
          text
          :color="openMessageText ? 'codePink' : 'grey'"
          @click="openMessageText = !openMessageText"
        >
          {{ messageText || messageName }}</v-btn
        >
      </span>
      to
      <v-btn
        :style="{ 'text-transform': 'none', 'min-width': '0px' }"
        class="px-0 pb-1 headline"
        text
        :color="openMessageConfig ? 'codePink' : 'grey'"
        @click="openMessageConfig = !openMessageConfig"
      >
        {{ to }}</v-btn
      >
      <span v-if="isTwilio">
        with this
        <v-btn
          :style="{ 'text-transform': 'none', 'min-width': '0px' }"
          class="px-0 pb-1 headline"
          text
          :color="openTwilioConfig ? 'codePink' : 'grey'"
          @click="openTwilioConfigSection()"
        >
          config</v-btn
        ></span
      >

      <span v-if="isPagerDuty"> </span>
    </div>

    <v-card-text v-if="openSendMessage" class="pt-0">
      <v-chip
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
      </v-chip>
    </v-card-text>
    <v-card-text
      v-else-if="openMessageText"
      v-click-outside="saveMessage"
      class="pt-0"
    >
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
      <v-checkbox v-model="bothMessages" class="mt-0 no-top" dense>
        <template #label
          ><span class="body-2"
            >Add this message <span class="font-weight-bold"> and</span> the
            default message.</span
          ></template
        >
      </v-checkbox>
      <v-text-field
        v-model="messageText"
        class="pt-0"
        @keydown.enter="saveMessage"
      />
    </v-card-text>
    <v-card-text v-else-if="openMessageConfig">
      <v-text-field
        v-if="messageType.type === 'SLACK_WEBHOOK'"
        v-model="messageConfigTo"
        :label="messageConfigLabel"
        :rules="[rules[messageType.type]]"
        validate-on-blur
        :error-messages="errorMessage"
        @keyup.enter="saveConfig"
      ></v-text-field>
      <ListInput
        v-else
        v-click-outside="() => (openMessageConfig = !openMessageConfig)"
        :label="messageConfigLabel"
        :value="messageConfigTo"
        :outline="false"
        :rules="[rules[messageType.type]]"
        :hide="false"
        :show-reset="false"
        @input="handleListInput"
      ></ListInput>
    </v-card-text>
    <v-card-text v-else-if="openTwilioConfig">
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
      <v-text-field
        v-if="messageType.type == 'TWILIO'"
        v-model="authToken"
        class="my-8"
        :rules="[rules.required]"
        label="Name of Auth Token Secret"
        dense
      />

      <v-text-field
        v-if="messageType.type == 'TWILIO'"
        v-model="accountSid"
        :rules="[rules.required]"
        label="Account SID"
        class="mb-8"
        dense
      />

      <v-text-field
        v-if="messageType.type == 'TWILIO'"
        v-model="messagingService"
        :rules="[rules.required]"
        label="Messaging service SID"
        dense
      />
    </v-card-text>
    <v-card-text v-else-if="completeConfig" class="mx-4">
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-text-field
            v-model="saveAs"
            :disabled="!messageType"
            label="Save As"
            v-bind="attrs"
            v-on="on"
          ></v-text-field>
        </template>
        Give your config a name so you can find and re-use it with more hooks.
      </v-tooltip>
    </v-card-text>
    <div class="text-right pb-4 pr-4">
      <v-btn color="primary" :disabled="!allowSave" @click="createAction">
        Save Config
      </v-btn>
    </div>
  </v-card>
</template>

<style scoped>
.no-top {
  margin-top: 1px;
}
</style>
