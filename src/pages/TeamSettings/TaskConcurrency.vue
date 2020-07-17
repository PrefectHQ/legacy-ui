<script>
import { mapGetters } from 'vuex'

import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import ExternalLink from '@/components/ExternalLink'
import ManagementLayout from '@/layouts/ManagementLayout'

const ADD_SUCCESS = 'A new tag concurrency limit has been successfully added.'
const ADD_ERROR =
  'Something went wrong while trying to add your task tag concurrency limit.'

const DELETE_SUCCESS =
  'The tag concurrency limit has been successfully deleted.'
const DELETE_ERROR =
  'Something went wrong while trying to delete this concurrency limit.'

const UPDATE_SUCCESS =
  'The tag concurrency limit has been successfully updated.'
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

      // Tags with concurrency limits
      // Stored result from GraphQL query
      tags: [],

      // Map tag names (String) to usage (Int)
      // Stored result from GraphQL query, modified from array to object
      usage: {},

      // Table headers
      headers: [
        {
          text: 'Tag',
          value: 'tag',
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
      // Tag name (used for add form only)
      newTag: null,

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

      // Permissions to determine if the user has access to this feature
      // permissions: null,

      // Keep track of tag that has been selected for editing or deletion
      selectedTag: {},

      // Keep track of tag that is in the middle of being deleted
      deletingLimitId: null,

      // Server error message
      errorMessage: '',

      // Loading states
      isFetchingTcls: true,

      // Dialogs
      showAddDialog: false,
      showDeleteDialog: false,
      showEditDialog: false,

      // Search input
      search: ''
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('license', ['permissions']),
    // Determine if user has permission to add, edit, and delete concurrency limits
    hasManagementPermission() {
      return this.isEligible && this.isTenantAdmin
    },
    // Determine if user has the proper permissions to access TCLs
    // User is eligible if:
    // - They are on a PLATFORM or ENTERPRISE tier, or
    // - They are on a license that grants explicit permission to access this feature
    isEligible() {
      // If permissions are still loading...
      if (!this.permissions) return true

      return this.permissions.includes('feature:concurrency-limit')
    },
    isTenantAdmin() {
      return this.tenant.role === 'TENANT_ADMIN'
    },
    // Merge usage details into tags array
    tagsWithUsage() {
      return this.tags.map(tag => ({
        ...tag,
        usage: this.usage[tag.tag] || 0
      }))
    }
  },
  watch: {
    tenant() {
      this.$apollo?.queries?.tags?.refetch()
      this.$apollo?.queries?.permissions?.refetch()
      this.$apollo?.queries?.usage?.refetch()
    }
  },
  mounted() {
    this.$apollo.addSmartQuery('usage', {
      query: require('@/graphql/TaskTagUsage/task-tag-usage.gql'),
      variables: {
        tags: this.tags?.map(tag => tag.tag)
      },
      pollInterval: 5000,
      update: data => {
        // Usage is returned as an array of objects in format { tag, usage }
        // Convert this array into object that maps tag names to usage
        return data?.task_tag_usage?.reduce((accum, usage) => {
          accum[usage.tag] = usage.usage
          return accum
        }, {})
      }
    })
  },
  methods: {
    async addTaskTagLimit() {
      try {
        const res = await this.$apollo.mutate({
          mutation: require('@/graphql/TaskTagLimit/update-task-concurrency-limit.gql'),
          variables: {
            tag: this.newTag,
            limit: Number(this.newLimit) // The API expects a type Number, so explicitly casting
          }
        })

        if (res?.data?.update_task_concurrency_limit?.id) {
          this.$apollo.queries?.tags?.refetch()
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
    async deleteTaskTagLimit() {
      this.deletingLimitId = this.selectedTag.id

      try {
        const res = await this.$apollo.mutate({
          mutation: require('@/graphql/TaskTagLimit/delete-task-concurrency-limit.gql'),
          variables: {
            limitId: this.selectedTag.id
          }
        })
        if (res?.data?.delete_task_concurrency_limit?.success) {
          this.$apollo.queries?.tags?.refetch()
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
    async updateTaskTagLimit() {
      try {
        const res = await this.$apollo.mutate({
          mutation: require('@/graphql/TaskTagLimit/update-task-concurrency-limit.gql'),
          variables: {
            tag: this.selectedTag.tag,
            limit: Number(this.newLimit) // The API expects a type Number, so explicitly casting
          }
        })

        if (res?.data?.update_task_concurrency_limit?.id) {
          this.$apollo.queries?.tags?.refetch()
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
      this.newTag = ''
    },
    openDeleteDialog(item) {
      this.selectedTag = item
      this.showDeleteDialog = true
    },
    openEditDialog(item) {
      this.selectedTag = item
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
    tags: {
      query: require('@/graphql/TaskTagLimit/task-tag-limit.gql'),
      pollInterval: 5000,
      result() {
        this.isFetchingTcls = false
      },
      error() {
        this.isFetchingTcls = false
        // TODO: Error handling
      },
      update: data => data.task_tag_limit
    }
  }
}
</script>

<template>
  <ManagementLayout :show="!isFetchingTcls" control-show>
    <template v-slot:title>Task Concurrency</template>

    <template v-slot:subtitle>
      Impose
      <ExternalLink
        href="https://docs.prefect.io/cloud/concepts/task-concurrency-limiting.html"
        >concurrency limits</ExternalLink
      >
      on the number of tasks that are running at any given time
    </template>

    <template v-if="isEligible && hasManagementPermission" v-slot:cta>
      <v-btn
        color="primary"
        class="white--text"
        data-cy="add-task-concurrency-limit"
        large
        @click="openAddDialog"
      >
        <v-icon left>
          add
        </v-icon>
        Add Tag
      </v-btn>
    </template>

    <template v-if="!isEligible" v-slot:alerts>
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
        <p>
          Your license does not include task concurrency limits.
        </p>

        <p v-if="isTenantAdmin" class="mt-4 mb-0">
          If you would like to upgrade, please contact
          <a href="sales@prefect.io">sales@prefect.io</a>.
        </p>
      </v-alert>
    </template>

    <template v-else-if="!isTenantAdmin" v-slot:alerts>
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
        Only team administrators can manage task concurrency limits.
      </v-alert>
    </template>

    <v-text-field
      v-if="isEligible && !$vuetify.breakpoint.mdAndUp"
      v-model="search"
      class="rounded-none elevation-1 mb-1"
      solo
      dense
      hide-details
      single-line
      placeholder="Search by tag name or limit"
      prepend-inner-icon="search"
      autocomplete="new-password"
    ></v-text-field>

    <v-card v-if="isEligible" tile>
      <v-card-text class="pa-0">
        <div v-if="$vuetify.breakpoint.mdAndUp" class="py-1 mr-2 flex">
          <v-text-field
            v-model="search"
            class="rounded-none elevation-1"
            solo
            dense
            hide-details
            single-line
            placeholder="Search by tag name or limit"
            prepend-inner-icon="search"
            autocomplete="new-password"
            :style="{
              'max-width': $vuetify.breakpoint.mdAndUp ? '360px' : null
            }"
          ></v-text-field>
        </div>

        <v-data-table
          fixed-header
          data-cy="tag-table"
          class="elevation-2 rounded-none"
          :headers="headers"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :items="tagsWithUsage"
          :items-per-page="10"
          :search="search"
          :footer-props="{
            showFirstLastPage: true,
            firstIcon: 'first_page',
            lastIcon: 'last_page',
            prevIcon: 'keyboard_arrow_left',
            nextIcon: 'keyboard_arrow_right'
          }"
          no-results-text="No concurrency limits found. Try expanding your search?"
          no-data-text="This team has not set any task concurrency limits yet."
        >
          <template v-slot:header.tag="{ header }">
            <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
          </template>
          <template v-slot:header.usage="{ header }">
            <v-tooltip bottom open-delay="500">
              <template v-slot:activator="{ on }">
                <div class="subtitle-2" v-on="on">
                  {{ header.text.toUpperCase() }}
                  <v-icon
                    x-small
                    class="material-icons-outlined"
                    :style="{ 'margin-bottom': '2px' }"
                    >info</v-icon
                  >
                </div>
              </template>
              Number of tasks that are running with the given tag
            </v-tooltip>
          </template>
          <template v-slot:header.limit="{ header }">
            <v-tooltip bottom open-delay="500">
              <template v-slot:activator="{ on }">
                <div class="subtitle-2" v-on="on">
                  {{ header.text.toUpperCase() }}
                  <v-icon
                    x-small
                    class="material-icons-outlined"
                    :style="{ 'margin-bottom': '2px' }"
                    >info</v-icon
                  >
                </div>
              </template>
              Maximum number of tasks that can simultaneously run with the given
              tag
            </v-tooltip>
          </template>

          <template v-slot:item.tag="{ item }">
            <div class="body-2">{{ item.tag }}</div>
          </template>

          <template v-slot:item.usage="{ item }">
            <span>
              {{ item.usage }} running
              {{ item.usage === 1 ? 'task' : 'tasks' }} ({{
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

          <template v-slot:item.limit="{ item }">
            <div class="subtitle-1 position-relative">
              <v-tooltip v-if="item.limit === 0" bottom open-delay="500">
                <template v-slot:activator="{ on }">
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
                A concurrency limit of 0 means that tasks with this tag will
                never run.
              </v-tooltip>
              <span v-else>
                {{ item.limit }}
              </span>
            </div>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
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
              Edit the limit for this tag
            </v-tooltip>

            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
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
              Remove concurrency limits for tasks with this tag
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <ConfirmDialog
      v-model="showAddDialog"
      :dialog-props="{ maxWidth: '440' }"
      title="Add a new concurrency-limiting tag"
      :disabled="!addValid"
      @confirm="addTaskTagLimit"
    >
      <v-form v-model="addValid">
        <v-text-field
          v-model="newTag"
          outlined
          dense
          data-cy="tag-name"
          validate-on-blur
          :rules="[rules.required]"
          label="Tag"
          autofocus
        ></v-text-field>
        <v-text-field
          v-model="newLimit"
          min="0"
          type="number"
          data-cy="tag-limit"
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
      v-if="selectedTag"
      v-model="showEditDialog"
      :dialog-props="{ maxWidth: '540' }"
      :title="
        `Edit the concurrency limit for tasks with the tag ${selectedTag.tag}`
      "
      :disabled="!editValid"
      @confirm="updateTaskTagLimit"
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
      v-if="selectedTag"
      v-model="showDeleteDialog"
      :dialog-props="{ maxWidth: '440' }"
      :title="
        `Are you sure you want to remove concurrency limits for tasks with the
          tag ${selectedTag.tag}?`
      "
      type="error"
      @confirm="deleteTaskTagLimit"
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
.card-title-color {
  color: #444;
}

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
