<script>
import { mapGetters } from 'vuex'

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
      steps: {
        openToConfig: { name: 'openToConfig', complete: false },
        addName: { name: 'addName', complete: false }
      },
      saving: false,
      enableSave: false,
      actionType: { title: 'Send' },
      step: null,
      actionConfig: null,
      actionConfigArray: [],
      newSaveAs: '',
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
    allowSave() {
      let allow = this.isPagerDuty
        ? !!this.actionType && !!this.routingKey && !!this.severity
        : !!this.actionType && !!this.actionConfigArray.length
      return allow
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
    this.step = this.steps['openToConfig']
  },
  methods: {
    buttonColor(selectedStep) {
      return this.step.name === selectedStep ? 'codePink' : 'utilGrayDark'
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
              }
              break
          }
        }
      } else {
        this.errorMessage = checked
      }
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
    },
    deleteItemFromList() {
      //TODO to delete item from a list to not include in save
      return true
    }
  }
}
</script>

<template>
  <v-card elevation="0">
    <v-card-text>
      <div>Props: {{ pdData }} </div>
      <div>Integration Keys: {{ integration_keys }} </div>
      <div> Account: {{ account }} </div>
    </v-card-text>
    <v-card-text class="text-h6 font-weight-light">
      <v-row>
        <v-col cols="9" lg="10">
          <span class="mr-1">Some Text Here</span>
        </v-col>
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
    <v-card-text>
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
        <v-row
          v-for="(key, index) in [...integration_keys]"
          :key="index"
          class="mt-2"
        >
          <v-col cols="12" md="3">
            <v-select
              v-model="severity"
              :items="severityLevels"
              outlined
              label="Severity"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="key.integration_key"
              :label="key.integration_key"
              outlined
              class="mb-8"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="key.name"
              label="Action Name"
              outlined
              class="mb-8"
            />
          </v-col>
          <v-col cols="12" md="1">
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  text
                  fab
                  x-small
                  color="error"
                  v-on="on"
                  @click="deleteItemFromList()"
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
              Revoke token
            </v-tooltip>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
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
