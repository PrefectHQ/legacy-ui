<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  components: {},
  props: {
    pdData: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      integrationKeys: [
        ...JSON.parse(this.pdData).integration_keys,
        //FOR TESTING ONLY - MUST REMOVE
        { name: 'Tester', integration_key: '12345' }
      ],
      successIds: [],
      account: JSON.parse(this.pdData).account,
      saving: false,
      enableSave: false,
      actionConfig: null,
      actionConfigArray: [],
      routingKey: '',
      severity: 'info',
      severityLevels: [
        { text: 'Info', value: 'info' },
        { text: 'Warning', value: 'warning' },
        { text: 'Error', value: 'error' },
        { text: 'Critical', value: 'critical' }
      ],
      menu: false,
      errorMessage: ''
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('user', ['user'])
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    pluralize(count, word) {
      if (count === 1) return word
      return `${word}s`
    },
    createAllConfigs() {
      this.integrationKeys.map(key => {
        this.saveConfig(key)
      })
    },
    saveConfig(item) {
      this.saving = true
      this.actionConfig = {
        routing_key: item.integration_key,
        severity: this.severity,
        //Temp hack to get around staging backend
        api_token_secret: 'test'
      }
      let config = {
        pagerduty_notification: this.actionConfig
      }
      const name = item.name
      const input = { name: name, config }
      this.createAction(input)
    },
    async createAction(input) {
      let success
      try {
        success = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-action.gql'),
          variables: {
            input: { config: input.config, name: input.name }
          }
        })
      } catch (error) {
        const errString = `${error}`
        this.setAlert({
          alertShow: true,
          alertMessage: errString,
          alertType: 'error'
        })
      } finally {
        this.saving = false
        if (success?.data?.create_action?.id) {
          this.successIds.push(success?.data?.create_action?.id)
        }
      }
    },
    deleteItemFromList(item, index) {
      this.integrationKeys.splice(index, 1)
    }
  }
}
</script>

<template>
  <v-card elevation="0">
    <v-card-text>
      <div>Props: {{ pdData }} </div>
      <div>Integration Keys: {{ integrationKeys }} </div>
      <div> Account: {{ account }} </div>
    </v-card-text>
    <v-card-text class="text-h6 font-weight-light">
      <v-row>
        <v-col cols="9" lg="10">
          <span class="mr-1">Some Text Here</span>
        </v-col>
        <v-col
          v-if="successIds.length !== integrationKeys.length"
          cols="3"
          lg="2"
          class="text-right"
        >
          <v-btn
            color="primary"
            elevation="0"
            :loading="saving"
            @click="createAllConfigs"
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
        <v-row v-if="!integrationKeys || !integrationKeys.length">
          <div
            class="text-center position-absolute center-absolute text-h5 utilGrayDark--text mt-10"
            :style="{ 'z-index': 1, width: '100%' }"
          >
            No integration keys
          </div>
        </v-row>
        <v-row
          v-else-if="
            integrationKeys && integrationKeys.length == successIds.length
          "
        >
          <div
            class="text-center position-absolute center-absolute text-h5 utilGrayDark--text mt-10"
            :style="{ 'z-index': 1, width: '100%' }"
          >
            <div> {{ pluralize(successIds.length, 'Action') }} Created</div>
            <div class="mt-4">
              <v-btn
                color="primary"
                outlined
                class="mr-4"
                :to="{ name: 'actions' }"
                >Go to Actions Page</v-btn
              >
              <v-btn outlined color="primary" :to="{ name: 'dashboard' }"
                >Go to Dashboard</v-btn
              >
            </div>
          </div>
        </v-row>
        <v-row
          v-for="(key, index) in integrationKeys"
          v-else
          :key="index"
          class="mt-2"
        >
          <v-col cols="12" md="3">
            <v-select
              v-model="severity"
              required
              :items="severityLevels"
              outlined
              label="Severity"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="key.integration_key"
              label="Integration Key"
              outlined
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field v-model="key.name" label="Action Name" outlined />
          </v-col>
          <v-col cols="12" md="1">
            <!-- <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  class="mt-3"
                  x-small
                  color="primary"
                  v-on="on"
                  @click="saveConfig(key)"
                >
                  Save
                </v-btn>
              </template>
              Save action
            </v-tooltip> -->
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  class="mt-3"
                  text
                  fab
                  x-small
                  color="error"
                  v-on="on"
                  @click="deleteItemFromList(key, index)"
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
              Remove action
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
