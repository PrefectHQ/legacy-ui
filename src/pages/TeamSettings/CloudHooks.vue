<script>
import { mapGetters, mapActions } from 'vuex'
import ExternalLink from '@/components/ExternalLink'
import ConfirmDialog from '@/components/ConfirmDialog'
import ManagementLayout from '@/layouts/ManagementLayout'
import { cloudHookMixin } from '@/mixins/cloudHookMixin'
import CloudHookForm from '@/components/CloudHookForm'
import CardTitle from '@/components/Card-Title'
import LogRocket from 'logrocket'

export default {
  components: {
    ExternalLink,
    ManagementLayout,
    CloudHookForm,
    CardTitle,
    ConfirmDialog
  },
  mixins: [cloudHookMixin],
  data() {
    return {
      setTest: '',
      //dialogs
      selectHook: {},
      dialogDeleteHook: false,
      dialogEditHook: false,
      removingHook: false,
      // Search
      search: null,
      //headers
      allHeaders: [
        {
          mobile: true,
          text: 'Name',
          value: 'name',
          align: 'center',
          width: '15%'
        },
        {
          mobile: true,
          text: 'Type',
          value: 'type',
          align: 'center',
          width: '10%'
        },
        {
          mobile: true,
          text: 'Flow',
          value: 'version_group_id',
          align: 'center',
          width: '15%'
        },
        {
          mobile: true,
          text: 'Active',
          value: 'active',
          width: '20%',
          align: 'center'
        },
        {
          mobile: true,
          text: 'States',
          value: 'states',
          width: '20%',
          align: 'center',
          sortable: false
        },
        {
          mobile: true,
          text: '',
          value: 'action',
          align: 'end',
          sortable: false,
          width: '20%'
        }
      ]
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('license', ['hasPermission']),
    isLoadingTable() {
      return this.hooksLoaded
    },
    searchFormatted() {
      if (!this.search) return null
      return `%${this.search}%`
    }
  },
  watch: {
    tenant() {
      this.$apollo.queries.cloudHooks.refetch()
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    closeHookDialog() {
      this.selectHook = ''
      this.dialogDeleteHook = false
    },
    formatStates(stateArray) {
      if (stateArray && stateArray.length > 0) {
        return stateArray
          .toString()
          .toLowerCase()
          .replace(/,/g, ', ')
      }
      return 'No states configured'
    },
    async testCloudHook(item) {
      this.setTest = item.id
      try {
        let input = {
          cloud_hook_id: item.id,
          state_type: 'SUCCESS'
        }

        const testCloudHookResult = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/test-cloud-hook.gql'),
          variables: {
            input: input
          },
          errorPolicy: 'all'
        })
        setTimeout(() => {
          if (testCloudHookResult?.data?.test_cloud_hook?.success) {
            this.setAlert(
              {
                alertShow: true,
                alertMessage: 'Cloud Hook test dispatched.',
                alertType: 'success'
              },
              3000
            )
            this.setTest = ''
          } else {
            this.setAlert(
              {
                alertShow: true,
                alertMessage: `Cloud Hook test failed with the following message: <strong>${testCloudHookResult?.data?.test_cloud_hook?.error}</strong>`,
                alertType: 'error'
              },
              3000
            )
            this.setTest = ''
          }
        }, 500)
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Flow Settings',
            stage: 'Test Cloud Hook'
          }
        })
        this.setAlert(
          {
            alertShow: true,
            alertMessage: `Cloud Hook test failed with the following message: <strong>${e}</strong>`,
            alertType: 'error'
          },
          3000
        )
        this.setTest = ''
      }
    },
    async deleteCloudHook() {
      this.removingHook = true
      try {
        let input = {
          cloud_hook_id: this.selectHook?.id
        }
        const deleteCloudHookResult = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/delete-cloud-hook.gql'),
          variables: {
            input: input
          },
          errorPolicy: 'all'
        })
        setTimeout(() => {
          if (deleteCloudHookResult?.data?.delete_cloud_hook?.success) {
            this.$apollo.queries.cloudHooks.refetch()
            this.removingHook = false
            this.setAlert(
              {
                alertShow: true,
                alertMessage: `Cloud Hook <span>${this.selectHook?.name} <span> deleted`,
                alertType: 'info'
              },
              3000
            )
            this.dialogDeleteHook = false
          } else {
            this.setAlert(
              {
                alertShow: true,
                alertMessage: `Error deleting Cloud Hook: ${deleteCloudHookResult.errors[0].message}s`,
                alertType: 'error'
              },
              3000
            )
            this.removingHook = false
            this.dialogDeleteHook = false
          }
        }, 1000)
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Cloud Hooks',
            stage: 'Delete Cloud Hook'
          }
        })
        this.removingHook = false
        this.setAlert(
          {
            alertShow: true,
            alertMessage: `Error deleting Cloud Hook: ${e}s`,
            alertType: 'error'
          },
          3000
        )
        this.dialogDeleteHook = false
      }
    }
  },
  apollo: {
    cloudHooks: {
      query: require('@/graphql/TeamSettings/cloud-hooks.gql'),
      error() {
        this.handleError(
          'Something went wrong while trying to fetch your cloud hooks'
        )
      },
      variables() {
        let searchParams = []
        searchParams.push({ name: { _ilike: this.searchFormatted } })
        searchParams.push({
          version_group_id: { _ilike: this.searchFormatted }
        })
        searchParams.push({
          type: { _ilike: this.searchFormatted }
        })
        return {
          searchParams: searchParams
        }
      },
      result({ data }) {
        if (!data) return
        this.hooksLoaded = true
      },
      update: data => data.cloud_hook,
      fetchPolicy: 'no-cache'
    }
  }
}
</script>

<template>
  <ManagementLayout :show="!isLoadingTable" control-show>
    <template #title>Cloud Hooks</template>
    <template #subtitle>
      <div v-if="!hasPermission('update', 'cloud-hook')">
        View your team's
        <ExternalLink
          href="https://docs.prefect.io/orchestration/concepts/cloud_hooks.html"
          >Cloud Hooks
        </ExternalLink>
      </div>
      <div v-else>
        View and manage your team's
        <ExternalLink
          href="https://docs.prefect.io/orchestration/concepts/cloud_hooks.html"
        >
          Cloud Hooks
        </ExternalLink>
      </div>
    </template>

    <template v-if="hasPermission('create', 'cloud-hook')" #cta>
      <v-dialog v-model="createNewCloudHook" max-width="700">
        <template #activator="{ onD }">
          <v-tooltip top>
            <template #activator="{ on }">
              <div class="pb-1" style="display: inline-block;" v-on="on">
                <v-btn
                  color="primary"
                  data-cy="new-hook"
                  large
                  @click="createNewCloudHook = true"
                  v-on="onD"
                >
                  <v-icon left>cloud</v-icon> New Cloud Hook
                </v-btn>
              </div>
            </template>
            <span v-if="!hasPermission('create', 'cloud-hook')">
              You don't have permission to create new Cloud Hooks.
            </span>
            <span v-else>
              Create a new Cloud Hook
            </span>
          </v-tooltip>
        </template>

        <v-card tile class="pa-2">
          <CardTitle title="New Cloud Hook" icon="cloud" />

          <v-card-text class="pl-12">
            <CloudHookForm
              v-if="createNewCloudHook"
              :editable="
                hasPermission('create', 'cloud-hook') &&
                  hasPermission('delete', 'cloud-hook')
              "
              edit-on-render
              @close="createNewCloudHook = false"
              @update="$apollo.queries.cloudHooks.refetch()"
            />
          </v-card-text>
        </v-card>
      </v-dialog>
    </template>

    <v-card :class="{ 'mt-3': $vuetify.breakpoint.mdAndUp }" tile>
      <div class="py-1 mr-2 flex">
        <v-text-field
          v-model="search"
          class="rounded-0 elevation-1"
          solo
          dense
          hide-details
          single-line
          placeholder="Search by hook name or type"
          prepend-inner-icon="search"
          autocomplete="new-password"
          :style="{
            'max-width': $vuetify.breakpoint.mdAndUp ? '420px' : null
          }"
        ></v-text-field>
      </div>
      <v-data-table
        :headers="allHeaders"
        :header-props="{ 'sort-icon': 'arrow_drop_up' }"
        data-cy="cloud-hook-table"
        :search="search"
        :items="cloudHooks"
        :items-per-page="10"
        class="elevation-2 rounded-0"
        :class="{ 'fixed-table': $vuetify.breakpoint.smAndUp }"
        :footer-props="{
          showFirstLastPage: true,
          itemsPerPageOptions: [10, 15, 20, -1],
          firstIcon: 'first_page',
          lastIcon: 'last_page',
          prevIcon: 'keyboard_arrow_left',
          nextIcon: 'keyboard_arrow_right'
        }"
        :loading="!cloudHooks"
        no-data-text="No Cloud Hooks found."
        ><!-- HEADERS -->
        <template #header.name="{ header }">
          <span class="text-subtitle-2 text-center">{{ header.text }}</span>
        </template>
        <template #header.active="{ header }">
          <span class="text-subtitle-2 text-center">{{ header.text }}</span>
        </template>
        <template #header.version_group_id="{ header }">
          <span class="text-subtitle-2 text-center">{{ header.text }}</span>
        </template>
        <template #header.type="{ header }">
          <span class="text-subtitle-2 text-center">{{ header.text }}</span>
        </template>
        <template #header.states="{ header }"
          >text-
          <span class="text-subtitle-2 text-center">{{ header.text }}</span>
        </template>
        <template #item.version_group_id="{ item }">
          <ApolloQuery
            :query="
              gql => gql`
                query($VGI: String) {
                  flow(
                    where: {
                      _and: [
                        { version_group_id: { _eq: $VGI } }
                        { archived: { _eq: false } }
                      ]
                    }
                  ) {
                    id
                    name
                  }
                }
              `
            "
            :variables="{ VGI: item.version_group_id }"
            :skip="!item.version_group_id"
          >
            <template #default="{ result: { loading, error, data } }">
              <!-- Loading -->
              <div v-if="loading" class="loading apollo">Loading...</div>
              <!-- Error -->
              <div v-else-if="error" class="error apollo">An error occurred</div
              ><!-- Result -->
              <div v-else-if="data && data.flow[0]" class="result apollo">
                <router-link
                  :to="{
                    name: 'flow',
                    params: {
                      id: data.flow[0].id,
                      tenant: tenant.slug
                    },
                    query: { settings: '' }
                  }"
                >
                  {{ data.flow[0].name }}</router-link
                ></div
              ><div v-else-if="data"> No flow :(</div>
              <!-- No result -->
              <div v-else class="no-result apollo">No flow :(</div>
            </template>
          </ApolloQuery>
        </template>
        <template #item.type="{ item }">
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-icon class="mr-3" v-on="on">
                {{ typeIcon(item.type) }}
              </v-icon>
            </template>
            <span>
              {{ typeTitle(item.type) }}
            </span>
          </v-tooltip>
        </template>
        <template #item.active="{ item }">
          <v-tooltip bottom>
            <template #activator="{ on }">
              <div v-on="on" @click.stop>
                <div class="vertical-button mr-3">
                  <v-switch
                    v-model="item.active"
                    hide-details
                    class="v-input--vertical mt-0"
                    color="primary"
                    :loading="item.loading"
                    :disabled="
                      (!hasPermission('create', 'cloud-hook') &&
                        !hasPermission('delete', 'cloud-hook')) ||
                        item.loading
                    "
                    @change="_handleSetCloudHookStatusChange($event, item)"
                  >
                    <template #label>
                      <v-btn tile small text disabled class="mb-1">
                        {{ item.active ? 'On' : 'Off' }}
                      </v-btn>
                    </template>
                  </v-switch>
                </div>
              </div>
            </template>
            <span v-if="!hasPermission('update', 'cloud-hook')">
              You don't have permission to change Cloud Hook states.
            </span>
            <span v-else>
              {{ item.active ? 'Deactivate' : 'Activate' }}
              this Cloud Hook.
            </span>
          </v-tooltip>
        </template>
        <template #item.states="{ item }">
          <v-tooltip bottom>
            <template #activator="{ on }">
              <div class="text-body-2" v-on="on">
                <v-chip
                  label
                  small
                  dark
                  :color="stateGroupColor(stateGroup(item.states))"
                  class="ml-2"
                >
                  {{ stateGroup(item.states) }}
                </v-chip>
              </div>
            </template>
            <span class="capitalize">{{ formatStates(item.states) }}</span>
          </v-tooltip>
        </template>
        <template
          v-if="
            hasPermission('create', 'cloud-hook') &&
              hasPermission('delete', 'cloud-hook')
          "
          #item.action="{ item }"
        >
          <v-tooltip bottom>
            <template #activator="{ on }">
              <div style="display: inline-block;" v-on="on">
                <v-btn
                  :loading="setTest === item.id"
                  text
                  fab
                  color="warning"
                  x-small
                  @click="testCloudHook(item)"
                >
                  <v-icon>bug_report</v-icon>
                </v-btn>
              </div>
            </template>
            <span>
              Test this Cloud Hook (will send a test call to your endpoint)
            </span>
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                text
                fab
                x-small
                color="primary"
                v-on="on"
                @click="
                  dialogEditHook = true
                  selectHook = item
                "
              >
                <v-icon>edit</v-icon>
              </v-btn>
            </template>
            Modify this cloud hook
          </v-tooltip>

          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                color="error"
                text
                fab
                x-small
                v-on="on"
                @click="
                  dialogDeleteHook = true
                  selectHook = item
                "
              >
                <v-icon>delete</v-icon>
              </v-btn>
            </template>
            Delete this cloud hook
          </v-tooltip>
        </template>
      </v-data-table>

      <ConfirmDialog
        v-if="selectHook"
        v-model="dialogDeleteHook"
        type="error"
        :dialog-props="{ 'max-width': '600' }"
        :disabled="removingHook"
        :loading="removingHook"
        :title="
          `Are you sure you want to delete ${
            selectHook.name ? '' : 'this'
          } cloud hook ${selectHook.name ? selectHook.name : ''}?`
        "
        @cancel="closeHookDialog"
        @confirm="deleteCloudHook"
      />
      <v-dialog v-model="dialogEditHook" max-width="700">
        <v-card tile class="pa-2">
          <CardTitle title="Edit Cloud Hook" icon="cloud" />

          <v-card-text class="pl-12">
            <CloudHookForm
              v-if="dialogEditHook"
              :editable="
                hasPermission('create', 'cloud-hook') &&
                  hasPermission('delete', 'cloud-hook')
              "
              edit-on-render
              :hook="selectHook"
              show-controls
              :version-group-id-prop="selectHook.version_group_id"
              :loading.sync="selectHook.loading"
              @close="dialogEditHook = false"
              @update="$apollo.queries.cloudHooks.refetch()"
            />
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-card>
  </ManagementLayout>
</template>

<style lang="scss" scoped>
.flex {
  display: flex;
  justify-content: flex-end;
}

.capitalize {
  text-transform: capitalize;
}
</style>
