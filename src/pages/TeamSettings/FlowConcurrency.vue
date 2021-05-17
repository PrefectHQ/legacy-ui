<script>
import { mapGetters } from 'vuex'

import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import ExternalLink from '../../components/ExternalLink.vue'
import ManagementLayout from '@/layouts/ManagementLayout'

const ADD_SUCCESS = 'A new label concurrency limit has been successfully added.'
const ADD_ERROR =
  'Something went wrong while trying to add your flow label concurrency limit.'

const DELETE_SUCCESS =
  'The label concurrency limit has been successfully deleted.'
const DELETE_ERROR =
  'Something went wrong while trying to delete this concurrency limit.'

const UPDATE_SUCCESS =
  'The label concurrency limit has been successfully updated.'
const UPDATE_ERROR =
  'Something went wrong while trying to update this concurrency limit.'

export default {
  components: {
    Alert,
    ConfirmDialog,
    ExternalLink,
    ManagementLayout
  },
  data() {
    return {
      // Alert data
      alertShow: false,
      alertMessage: '',
      alertType: null,

      // Labels with concurrency limits
      // Stored result from GraphQL query
      labels: [],

      // Map label names (String) to usage (Int)
      // Stored result from GraphQL query, modified from array to object
      usage: {},

      // Table headers
      headers: [
        {
          text: 'Label',
          value: 'label',
          width: '20%'
        },
        {
          text: 'Usage',
          value: 'usage',
          align: 'center',
          width: '40%',
          sortable: false
        },
        {
          text: 'Limit',
          value: 'limit',
          align: 'center',
          width: '20%',
          sortable: false
        },
        {
          text: '',
          value: 'actions',
          align: 'right',
          width: '20%'
        }
      ],

      // Form inputs
      // Limit (used for both add & edit forms)
      newLimit: null,
      // Label name (used for add form only)
      newLabel: null,

      // Input rules
      rules: {
        required: value => !!value || 'This field is required.',
        positiveOnly: value =>
          parseInt(value) >= 0 ||
          'The concurrency limit cannot be a negative value.'
      },

      // Form validation
      // Determine if add form is valid
      addValid: true,
      // Determine if edit form is valid
      editValid: true,

      // Keep track of label that has been selected for editing or deletion
      selectedLabel: {},

      // Keep track of label that is in the middle of being deleted
      deletingLimitId: null,

      // Server error message
      errorMessage: '',

      // Dialogs
      showAddDialog: false,
      showDeleteDialog: false,
      showEditDialog: false,

      // Search input
      search: '',

      loadingKey: 0
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('license', ['permissions', 'hasPermission']),
    // Determine if user has permission to add, edit, and delete concurrency limits
    hasManagementPermission() {
      return this.isTenantAdmin
    },
    isTenantAdmin() {
      return this.tenant.role === 'TENANT_ADMIN'
    },
    // Determine if user has the proper permissions to access TCLs
    // - They are on a license that grants explicit permission to access this feature
    isEligible() {
      // If permissions are still loading...
      if (!this.permissions) return true

      return this.hasPermission('feature', 'concurrency-limit')
    },
    // Merge usage details into labels array
    labelsWithUsage() {
      return this.labels.map(label => ({
        ...label,
        usage: this.usage[label.name] || 0
      }))
    }
  },
  watch: {
    tenant() {
      this.$apollo?.queries?.labels?.refetch()
      this.$apollo?.queries?.usage?.refetch()
    }
  },
  methods: {
    async addFlowLabelLimit() {
      try {
        const res = await this.$apollo.mutate({
          mutation: require('@/graphql/FlowLabelLimit/update-flow-concurrency-limit.gql'),
          variables: {
            label: this.newLabel,
            limit: Number(this.newLimit) // The API expects a type Number, so explicitly casting
          }
        })

        if (res?.data?.update_flow_concurrency_limit?.id) {
          this.$apollo.queries?.labels?.refetch()
          this.handleSuccess(ADD_SUCCESS)
        } else {
          this.handleError(ADD_ERROR)
        }
      } catch (error) {
        this.handleError(ADD_ERROR)
      } finally {
        this.showAddDialog = false
      }
    },
    async deleteFlowLabelLimit() {
      this.deletingLimitId = this.selectedLabel.id

      try {
        const res = await this.$apollo.mutate({
          mutation: require('@/graphql/FlowLabelLimit/delete-flow-concurrency-limit.gql'),
          variables: {
            limitId: this.selectedLabel.id
          }
        })
        if (res?.data?.delete_flow_concurrency_limit?.success) {
          this.$apollo.queries?.labels?.refetch()
          this.handleSuccess(DELETE_SUCCESS)
        } else {
          this.handleError(DELETE_ERROR)
        }

        this.deletingLimitId = null
      } catch (error) {
        this.handleError(DELETE_ERROR)

        this.deletingLimitId = null
      } finally {
        this.showDeleteDialog = false
      }
    },
    async updateFlowLabelLimit() {
      try {
        const res = await this.$apollo.mutate({
          mutation: require('@/graphql/FlowLabelLimit/update-flow-concurrency-limit.gql'),
          variables: {
            label: this.selectedLabel.name,
            limit: Number(this.newLimit) // The API expects a type Number, so explicitly casting
          }
        })

        if (res?.data?.update_flow_concurrency_limit?.id) {
          this.$apollo.queries?.labels?.refetch()
          this.handleSuccess(UPDATE_SUCCESS)
        } else {
          this.handleError(UPDATE_ERROR)
        }
      } catch (error) {
        this.handleError(UPDATE_ERROR)
      } finally {
        this.showEditDialog = false
      }
    },
    openAddDialog() {
      this.showAddDialog = true
      this.newLimit = ''
      this.newLabel = ''
    },
    openDeleteDialog(item) {
      this.selectedLabel = item
      this.showDeleteDialog = true
    },
    openEditDialog(item) {
      this.selectedLabel = item
      this.newLimit = item.limit
      this.showEditDialog = true
    },
    handleSuccess(message) {
      this.alertMessage = message
      this.alertType = 'success'
      this.alertShow = true
    },
    handleError(message) {
      this.alertMessage = `${message}. Please try again. If the error persists, please contact help@prefect.io.`
      this.alertType = 'error'
      this.alertShow = true
    },
    checkValid() {
      this.addValid = this.newLimit ? true : false
    }
  },
  apollo: {
    labels: {
      query: require('@/graphql/FlowLabelLimit/flow-label-limit.gql'),
      pollInterval: 5000,
      loadingKey: 'loadingKey',
      update: data => {
        return data.flow_concurrency_limit
      }
    },
    usage: {
      query: require('@/graphql/FlowLabelUsage/flow-label-usage.gql'),
      variables() {
        return { labels: this.labels?.map(label => label.name) }
      },
      pollInterval: 5000,
      skip() {
        return !this.labels?.length
      },
      update: data => {
        // Usage is returned as an array of objects in format { name, usage }
        // Convert this array into object that maps label names to usage
        return data?.flow_concurrency?.reduce((accum, usage) => {
          accum[usage.label] = usage.usage
          return accum
        }, {})
      }
    }
  }
}
</script>

<template>
  <ManagementLayout>
    <template #title>Flow Concurrency</template>

    <template #subtitle>
      Impose concurrency limits on the number of flows that are running at any
      given time
    </template>

    <template v-if="isEligible && hasManagementPermission" #cta>
      <v-btn
        color="primary"
        class="white--text"
        data-cy="add-flow-concurrency-limit"
        large
        @click="openAddDialog"
      >
        <v-icon left>
          add
        </v-icon>
        Add Label
      </v-btn>
    </template>

    <template v-if="!isEligible" #alerts>
      <v-alert
        class="mx-auto"
        border="left"
        colored-border
        elevation="2"
        type="warning"
        tile
        icon="lock"
        max-width="600"
      >
        Your plan doesn't include flow concurrency limiting.
        <ExternalLink href="/plans">Upgrade</ExternalLink> to get access to flow
        concurrency and lots of other cool features!
      </v-alert>
    </template>

    <template v-else-if="!isTenantAdmin" #alerts>
      <v-alert
        class="mx-auto"
        border="left"
        colored-border
        elevation="2"
        type="warning"
        tile
        icon="lock"
        max-width="600"
      >
        Only team administrators can manage flow concurrency limits.
      </v-alert>
    </template>

    <v-text-field
      v-if="!$vuetify.breakpoint.mdAndUp"
      v-model="search"
      class="rounded-0 elevation-1 mb-1"
      solo
      dense
      hide-details
      single-line
      placeholder="Search by flow label or limit"
      prepend-inner-icon="search"
      autocomplete="new-password"
    ></v-text-field>

    <v-card v-if="isEligible" tile>
      <v-card-text class="pa-0">
        <div v-if="$vuetify.breakpoint.mdAndUp" class="py-1 mr-2 flex">
          <v-text-field
            v-model="search"
            class="rounded-0 elevation-1"
            solo
            dense
            hide-details
            single-line
            placeholder="Search by flow label or limit"
            prepend-inner-icon="search"
            autocomplete="new-password"
            :style="{
              'max-width': $vuetify.breakpoint.mdAndUp ? '360px' : null
            }"
          ></v-text-field>
        </div>

        <v-data-table
          fixed-header
          data-cy="label-table"
          class="elevation-2 rounded-0 truncate-table"
          :headers="headers"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :items="labelsWithUsage"
          :items-per-page="10"
          :search="search"
          :loading="loadingKey > 0"
          :footer-props="{
            showFirstLastPage: true,
            itemsPerPageOptions: [10, 15, 20, -1],
            firstIcon: 'first_page',
            lastIcon: 'last_page',
            prevIcon: 'keyboard_arrow_left',
            nextIcon: 'keyboard_arrow_right'
          }"
          no-results-text="No concurrency limits found. Try expanding your search?"
          no-data-text="This team has not set any flow concurrency limits yet."
        >
          <template #header.tag="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.usage="{ header }">
            <v-tooltip bottom open-delay="500">
              <template #activator="{ on }">
                <div class="text-subtitle-2" v-on="on">
                  {{ header.text }}
                  <v-icon
                    x-small
                    class="material-icons-outlined"
                    :style="{ 'margin-bottom': '2px' }"
                    >info</v-icon
                  >
                </div>
              </template>
              Number of flows that are running with the given label
            </v-tooltip>
          </template>
          <template #header.limit="{ header }">
            <v-tooltip bottom open-delay="500">
              <template #activator="{ on }">
                <div class="text-subtitle-2" v-on="on">
                  {{ header.text }}
                  <v-icon
                    x-small
                    class="material-icons-outlined"
                    :style="{ 'margin-bottom': '2px' }"
                    >info</v-icon
                  >
                </div>
              </template>
              Maximum number of flows that can simultaneously run with the given
              label
            </v-tooltip>
          </template>

          <template #item.label="{ item }">
            <div class="text-body-2">{{ item.name }}</div>
          </template>

          <template #item.usage="{ item }">
            <span>
              {{ item.usage }} running
              {{ item.usage === 1 ? 'flow' : 'flows' }} ({{
                item.limit === 0
                  ? 0
                  : Math.ceil((item.usage / item.limit) * 100)
              }}%)
            </span>
            <div class="mx-auto mt-1">
              <v-progress-linear
                height="8"
                :value="
                  item.limit === 0
                    ? 0
                    : Math.ceil((item.usage / item.limit) * 100)
                "
              ></v-progress-linear>
            </div>
          </template>

          <template #item.limit="{ item }">
            <div class="text-subtitle-1 position-relative">
              <v-tooltip v-if="item.limit === 0" bottom open-delay="500">
                <template #activator="{ on }">
                  <div v-on="on">
                    {{ item.limit }}
                    <v-icon
                      x-small
                      class="position-absolute material-icons-outlined ml-1"
                      :style="{
                        top: '6px'
                      }"
                    >
                      info
                    </v-icon>
                  </div>
                </template>
                A concurrency limit of 0 means that flows with this label will
                never run.
              </v-tooltip>
              <span v-else>
                {{ item.limit }}
              </span>
            </div>
          </template>

          <template #item.actions="{ item }">
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  v-if="hasManagementPermission"
                  color="primary"
                  text
                  fab
                  x-small
                  v-on="on"
                  @click="openEditDialog(item)"
                >
                  <v-icon>edit</v-icon>
                </v-btn>
              </template>
              Edit the limit for this label
            </v-tooltip>

            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  v-if="hasManagementPermission"
                  color="red"
                  text
                  fab
                  x-small
                  v-on="on"
                  @click="openDeleteDialog(item)"
                >
                  <v-progress-circular
                    v-if="deletingLimitId === item.id"
                    indeterminate
                  />
                  <v-icon v-else>delete</v-icon>
                </v-btn>
              </template>
              Remove concurrency limits for flows with this label
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <ConfirmDialog
      v-model="showAddDialog"
      :dialog-props="{ maxWidth: '440' }"
      title="Add a new concurrency-limiting label"
      :disabled="!addValid"
      @confirm="addFlowLabelLimit"
    >
      <v-form v-model="addValid">
        <v-text-field
          v-model="newLabel"
          outlined
          dense
          data-cy="label-name"
          validate-on-blur
          :rules="[rules.required]"
          label="Label"
          autofocus
        ></v-text-field>
        <v-text-field
          v-model="newLimit"
          min="0"
          type="number"
          data-cy="label-limit"
          outlined
          validate-on-blur
          dense
          :rules="[rules.required, rules.positiveOnly]"
          label="Limit"
          @input="checkValid"
        ></v-text-field>
      </v-form>
    </ConfirmDialog>

    <ConfirmDialog
      v-if="selectedLabel"
      v-model="showEditDialog"
      :dialog-props="{ maxWidth: '540' }"
      :title="
        `Edit the concurrency limit for flows with the label ${selectedLabel.name}`
      "
      :disabled="!editValid"
      @confirm="updateFlowLabelLimit"
    >
      <v-form v-model="editValid">
        <v-text-field
          v-model="newLimit"
          min="0"
          type="number"
          outlined
          dense
          label="Limit"
          autofocus
          :rules="[rules.required, rules.positiveOnly]"
          persistent-hint
        ></v-text-field>
      </v-form>
    </ConfirmDialog>

    <ConfirmDialog
      v-if="selectedLabel"
      v-model="showDeleteDialog"
      :dialog-props="{ maxWidth: '440' }"
      :title="
        `Are you sure you want to remove concurrency limits for flows with the
          label ${selectedLabel.name}?`
      "
      type="error"
      @confirm="deleteFlowLabelLimit"
    >
    </ConfirmDialog>

    <Alert
      v-model="alertShow"
      :type="alertType"
      :message="alertMessage"
      :offset-x="56"
    ></Alert>
  </ManagementLayout>
</template>

<style lang="scss" scoped>
.custom-header {
  font-size: 1.15em;
}

.flex {
  display: flex;
  justify-content: flex-end;
}

.limit-change-button {
  transform: scale(0.75);
}
</style>
