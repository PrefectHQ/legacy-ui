<script>
import { mapActions, mapGetters } from 'vuex'
import DictInput from '@/components/CustomInputs/DictInput2'
import { formatJson } from '@/utils/json'

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
    formatItemValue(item) {
      return formatJson(item?.action_config)
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
  <v-card class="ma-8 pa-4 pdcard" max-height="60vh">
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
      <div class="mb-4">
        <span>
          Create an action to use with Prefect Automations and the Pager Duty
          <a
            href="https://support.pagerduty.com/docs/services-and-integrations"
            target="_blank"
            >Events API v2</a
          >.
        </span>
      </div>
      <div v-if="!integrationKeys || !integrationKeys.length">
        <div
          class="text-center position-absolute center-absolute text-h5 utilGrayDark--text mt-10"
          :style="{ 'z-index': 1, width: '100%' }"
        >
          No integration keys
        </div>
      </div>
      <div
        v-else-if="
          integrationKeys && integrationKeys.length === successIds.length
        "
        class="text-center"
      >
        <v-data-table
          fixed-header
          :headers="headersByViewport"
          :items="actions"
          :items-per-page="10"
          show-expand
          hide-default-footer
          :loading="loadingTable || !actions || !actions.length"
          class="elevation-0"
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
          <template #expanded-item="{ headers, item }">
            <td
              v-if="Object.keys(item.action_config).length"
              :colspan="headers.length"
            >
              <dict-input
                v-if="Object.keys(item.action_config).length"
                class="mt-3"
                readonly-key
                readonly-value
                disable-add
                disable-remove
                :value="formatItemValue(item)"
              />
            </td>
            <td v-else :colspan="headers.length">
              No action config
            </td>
          </template>
        </v-data-table>

        <div class="mt-6" align="center" justify="center">
          <v-btn color="primary" outlined class="mr-4" :to="{ name: 'actions' }"
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
      <div v-else>
        <v-row
          v-for="(key, index) in integrationKeys"
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

        <div class="text-center">
          <v-btn
            class="mx-auto px-8 text-none"
            depressed
            text
            color="primary"
            @click="addKey"
          >
            Add Action
            <v-icon right>
              add
            </v-icon>
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.pdcard {
  overflow: auto;
}
</style>

<style lang="scss" scoped></style>
