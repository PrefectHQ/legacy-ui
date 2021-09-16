<script>
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'
import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import ExternalLink from '@/components/ExternalLink'
import ManagementLayout from '@/layouts/ManagementLayout'
import DictInput from '@/components/CustomInputs/DictInput'
export default {
  components: {
    Alert,
    ConfirmDialog,
    ExternalLink,
    ManagementLayout,
    DictInput
  },
  mixins: [formatTime],
  data() {
    return {
      // Alert data
      alertShow: false,
      alertMessage: '',
      alertType: null,

      // Loading states
      isLoadingTable: true,
      isRemovingAction: false,
      isTestingAction: false,

      // Dialogs
      dialogRemoveAction: false,

      // Store copied action ID
      // Useful to render feedback that copy was successful
      copiedActionId: null,

      // Timeout for copy action
      copyTimeout: null,

      // Table headers
      headers: [
        {
          mobile: true,
          text: 'Name',
          value: 'name',
          width: '25%'
        },
        {
          mobile: true,
          text: 'Type',
          value: 'action_type',
          align: 'left',
          width: '25%'
        },
        {
          mobile: true,
          text: 'Action ID',
          value: 'id',
          align: 'center',
          width: '25%'
        },
        {
          mobile: true,
          text: '',
          value: 'test',
          align: 'end',
          sortable: false,
          width: '8%'
        },
        {
          mobile: true,
          text: '',
          value: 'remove',
          align: 'end',
          sortable: false,
          width: '8%'
        }
      ],

      // Forms
      createFormValid: true,
      modifyFormValid: true,

      // Input icons
      showNameInputIcon: false,

      // Action selected for modification or deletion
      selectedAction: null,

      // default sorting
      sortBy: 'name',
      sortDesc: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['user', 'timezone']),
    ...mapGetters('license', ['hasPermission']),
    // Surface table headers based on viewport (mobile vs. desktop)
    headersByViewport() {
      return this.$vuetify.breakpoint.mdAndUp
        ? this.headers
        : this.headers.filter(header => header.mobile)
    }
  },
  watch: {
    tenant() {
      this.$apollo.queries.actions.refetch()
    }
  },
  methods: {
    permissionsCheck(action) {
      return this.hasPermission(action, 'hook')
    },
    closeActionDialog() {
      this.selectedAction = null
    },
    copyTextToClipboard(id) {
      clearTimeout(this.copyTimeout)

      this.copiedActionId = id
      navigator.clipboard.writeText(id)

      this.copyTimeout = setTimeout(() => {
        this.copiedActionId = null
      }, 3000)
    },
    handleAlert(type, message) {
      this.alertType = type
      this.alertMessage = message
      this.alertShow = true
    },

    async removeAction() {
      this.isRemovingAction = true
      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/TeamSettings/delete-action.gql'),
          variables: {
            actionId: this.selectedAction.id
          }
        })

        this.$apollo.queries.actions.refetch()
        this.handleAlert('success', 'The action has been successfuly deleted.')
      } catch (e) {
        this.handleAlert(
          'error',
          'Something went wrong while trying to delete this action. Please try again.'
        )
      }

      this.dialogRemoveAction = false
      this.isRemovingAction = false
    },
    async testAction() {
      this.isTestingAction = this.selectedAction.id
      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/TeamSettings/test-action.gql'),
          variables: {
            actionId: this.selectedAction.id
          }
        })

        this.$apollo.queries.actions.refetch()
        this.handleAlert('success', 'Test sent')
        this.isTestingAction = null
      } catch (e) {
        if (`${e}`.includes('202')) this.handleAlert('success', 'Test accepted')
        else this.handleAlert('error', `${e}`)
        this.isTestingAction = null
      }
    },
    selectAction(action) {
      this.selectedAction = action
    }
  },
  apollo: {
    actions: {
      query: require('@/graphql/TeamSettings/actions.gql'),
      result({ data }) {
        this.isLoadingTable = false
        if (!data) return
        return data.action
      },
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
  <ManagementLayout :show="!isLoadingTable" control-show>
    <template #title>Automation Actions</template>

    <template #subtitle>
      <span v-if="permissionsCheck('delete')">
        View and manage your team's
        <ExternalLink
          href="https://docs.prefect.io/orchestration/concepts/automations.html#automations"
          >automation actions</ExternalLink
        >
      </span>
      <span v-else
        >View the
        <ExternalLink
          href="https://docs.prefect.io/orchestration/concepts/automations.html#automations"
          >Automation Actions</ExternalLink
        >
        of {{ tenant.name }}</span
      >
    </template>

    <v-card tile>
      <v-card-text class="pa-0">
        <!-- ACTIONS TABLE -->
        <v-data-table
          fixed-header
          :headers="headersByViewport"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :items="actions"
          :items-per-page="10"
          :sort-by.sync="sortBy"
          show-expand
          :sort-desc.sync="sortDesc"
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
          no-data-text="This team does not have any actions yet."
        >
          <!-- ACTION ID-->
          <template #item.id="{ item }">
            <v-tooltip top>
              <template #activator="{ on }">
                <div
                  class="cursor-pointer text-truncate"
                  v-on="on"
                  @click="copyTextToClipboard(item.id)"
                >
                  {{ item.id }}
                </div>
              </template>
              <span>{{
                copiedActionId === item.id ? 'Copied!' : 'Click to copy ID'
              }}</span>
            </v-tooltip>
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

          <!-- TEST ACTION --->
          <template v-if="permissionsCheck('update')" #item.test="{ item }">
            <v-btn
              text
              fab
              color="primary"
              :loading="isTestingAction === item.id"
              x-small
              title="Test Action"
              @click="
                selectAction(item)
                testAction(item)
              "
            >
              <v-icon>bug_report</v-icon>
            </v-btn>
          </template>

          <!-- REMOVE ACTIONS -->
          <template v-if="permissionsCheck('delete')" #item.remove="{ item }">
            <v-btn
              text
              fab
              x-small
              color="error"
              title="Delete Action"
              @click="
                selectAction(item)
                dialogRemoveAction = true
              "
            >
              <v-icon>delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- DELETE ACTION -->
    <ConfirmDialog
      v-if="selectedAction"
      v-model="dialogRemoveAction"
      type="error"
      :dialog-props="{ 'max-width': '600' }"
      :disabled="isRemovingAction"
      :loading="isRemovingAction"
      :title="
        `Are you sure you want to delete ${
          selectedAction.name ? selectedAction.name : 'this action'
        }?`
      "
      @cancel="closeActionDialog"
      @confirm="removeAction"
    >
    </ConfirmDialog>

    <Alert
      v-model="alertShow"
      :type="alertType"
      :message="alertMessage"
      :offset-x="$vuetify.breakpoint.mdAndUp ? 256 : 56"
    ></Alert>
  </ManagementLayout>
</template>

<style lang="scss" scoped>
.flex {
  display: flex;
  justify-content: flex-end;
}

.hidewidth {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
</style>
