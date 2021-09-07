<script>
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'
import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import ExternalLink from '@/components/ExternalLink'
import ManagementLayout from '@/layouts/ManagementLayout'
export default {
  components: {
    Alert,
    ConfirmDialog,
    ExternalLink,
    ManagementLayout
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

      // Dialogs
      dialogRemoveAction: false,

      // Store copied project ID
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
          width: '15%'
        },
        {
          mobile: false,
          text: 'Type',
          value: 'action_type',
          align: 'left',
          width: '20%'
        },
        {
          mobile: false,
          text: 'Config',
          value: 'action_config',
          align: 'left',
          width: '20%'
        },
        {
          mobile: false,
          text: 'Action ID',
          value: 'id',
          align: 'center',
          width: '15%'
        },
        {
          mobile: true,
          text: '',
          value: 'remove',
          align: 'end',
          sortable: false,
          width: '10%'
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
    },
    permissionsCheck() {
      return this.hasPermission('delete', 'hook')
    }
  },
  watch: {
    tenant() {
      this.$apollo.queries.actions.refetch()
    }
  },
  methods: {
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
    pluralize(count, word) {
      if (count === 1) return word
      return `${word}s`
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
      <span v-if="permissionsCheck">
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
            <v-tooltip v-if="item.name" top>
              <template #activator="{ on }">
                <div class="hidewidth" v-on="on">
                  {{ item.name }}
                </div>
              </template>
              <span>{{ item.name }}</span>
            </v-tooltip>
            <span v-else>-</span>
          </template>

          <template #item.type="{ item }">
            {{ item.action_type }}
          </template>

          <!-- ACTION CONFIG -->
          <template #item.action_config="{ item }">
            <v-tooltip v-if="item.action_config" top>
              <template #activator="{ on }">
                <div class="hidewidth" v-on="on">
                  {{ item.action_config }}
                </div>
              </template>
              <span>{{ item.action_config }}</span>
            </v-tooltip>
            <span v-else>-</span>
          </template>

          <!-- REMOVE ACTIONS -->
          <template v-if="permissionsCheck" #item.remove="{ item }">
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  text
                  fab
                  x-small
                  color="error"
                  v-on="on"
                  @click="
                    selectAction(item)
                    dialogRemoveAction = true
                  "
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
              Delete this action
            </v-tooltip>
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
          this.selectedAction.name ? this.selectedAction.name : 'this action'
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
