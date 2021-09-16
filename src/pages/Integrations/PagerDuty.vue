<script>
import { mapActions, mapGetters } from 'vuex'
import DictInput from '@/components/CustomInputs/DictInput'

export default {
  components: { DictInput },
  props: {
    pdData: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      // Table headers
      headers: [
        {
          mobile: true,
          text: 'Name',
          value: 'name',
          width: '25%'
        },
        {
          mobile: false,
          text: 'Type',
          value: 'action_type',
          align: 'left',
          width: '25%'
        },
        {
          mobile: false,
          text: 'Action ID',
          value: 'id',
          align: 'center',
          width: '25%'
        }
      ],
      integrationKeys: [...JSON.parse(this.pdData).integration_keys],
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
      errorMessage: '',
      loading: 0,
      rules: [
        val => {
          return !!val || 'Required'
        }
      ]
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('user', ['user']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('license', ['hasPermission']),
    permissionsCheck() {
      return this.hasPermission('create', 'hook')
    },
    headersByViewport() {
      return this.$vuetify.breakpoint.mdAndUp
        ? this.headers
        : this.headers.filter(header => header.mobile)
    },
    loadingTable() {
      return this.loading > 0
    },
    allowSave() {
      return this.integrationKeys.every(
        key => !!key.integration_key && !!key.severity
      )
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    addKey() {
      this.integrationKeys.push({
        name: '',
        integration_key: '',
        severity: 'Info'
      })
    },
    pluralize(count, word) {
      if (count === 1) return word
      return `${word}s`
    },
    createAllConfigs() {
      this.integrationKeys.forEach(key => {
        this.saveConfig(key)
      })
    },
    saveConfig(item) {
      this.saving = true
      this.actionConfig = {
        routing_key: item.integration_key,
        severity: item.severity
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
  },
  apollo: {
    actions: {
      query: require('@/graphql/Integrations/PagerDutyActions.gql'),
      update: data => data.actions,
      variables() {
        return {
          includeIds: this.successIds
        }
      },
      loadingKey: 'loading',
      error() {
        this.handleAlert(
          'error',
          'Something went wrong while trying to fetch your actions. Please try again later.'
        )
      },
      fetchPolicy: 'no-cache'
    }
  }
}
</script>

<template>
  <v-card elevation="0">
    <v-card-text class="text-h4 font-weight-light">
      <v-row class="pt-2">
        <v-col cols="9" lg="10">
          <v-icon :style="{ 'max-height': '30px' }" size="150" class="pdicon"
            >$newPagerDuty</v-icon
          >
        </v-col>
        <v-col cols="3" lg="2" class="text-right">
          <v-btn
            v-if="!successIds.length && permissionsCheck"
            color="primary"
            :disabled="!allowSave"
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
          Create an action to use with Prefect Automations and the Pager Duty
          <a
            href="https://support.pagerduty.com/docs/services-and-integrations"
            target="_blank"
            >Events API v2</a
          >.
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
          class="text-center"
          v-else-if="
            integrationKeys && integrationKeys.length === successIds.length
          "
        >
          <div
            class="text-center position-absolute center-absolute text-h5 utilGrayDark--text mt-10"
            :style="{ 'z-index': 1, width: '100%' }"
          >
            <v-data-table
              fixed-header
              :headers="headersByViewport"
              :items="actions"
              :items-per-page="10"
              show-expand
              :loading="loadingTable || !actions || !actions.length"
              class="elevation-2 rounded-0 truncate-table"
              :class="{ 'fixed-table': $vuetify.breakpoint.smAndUp }"
              :footer-props="{
                showFirstLastPage: true,
                itemsPerPageOptions: [10, 15, 20, -1],
                firstIcon: 'first_page',
                lastIcon: 'last_page',
                prevIcon: 'keyboard_arrow_left',
                nextIcon: 'keyboard_arrow_right'
              }"
              no-data-text="No actions."
            >
              <!-- ACTION ID-->
              <template #item.id="{ item }">
                {{ item.id }}
              </template>

              <!-- ACTION NAME -->
              <template #item.name="{ item }">
                <div class="hidewidth">
                  {{ item.name }}
                </div>
              </template>

              <template #item.type="{ item }">
                {{ item.action_type }}
              </template>

              <!-- ACTION CONFIG -->
              <template v-slot:expanded-item="{ headers, item }">
                <td
                  v-if="Object.keys(item.action_config).length"
                  :colspan="headers.length"
                >
                  <DictInput
                    v-if="Object.keys(item.action_config).length"
                    :disableEdit="true"
                    disabled
                    :dict="item.action_config"
                    :rules="[1, 2]"
                  />
                </td>
                <td v-else :colspan="headers.length">
                  No action config
                </td>
              </template>
            </v-data-table>

            <div class="mt-4 text-center">
              <v-btn
                color="primary"
                outlined
                class="mr-4"
                :to="{ name: 'actions' }"
                >Manage Actions</v-btn
              >
              <v-btn
                color="primary"
                :to="{
                  path: `/${tenant.slug}?automations=`
                }"
                >Create Automation</v-btn
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
              v-model="key.severity"
              :items="severityLevels"
              outlined
              :rules="rules"
              label="Severity"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="key.integration_key"
              :rules="rules"
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
                  small
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
        <v-row>
          <v-col cols="0" md="11" />
          <v-col cols="12" md="1">
            <v-btn text icon color="primary" @click="addKey"
              ><v-icon large>add</v-icon></v-btn
            >
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
