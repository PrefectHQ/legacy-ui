<script>
import gql from 'graphql-tag'
import { mapGetters } from 'vuex'

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
  data() {
    return {
      // Table headers
      allHeaders: [
        {
          mobile: true,
          text: 'Name',
          value: 'name',
          width: '20%'
        },
        {
          mobile: true,
          text: 'Active',
          value: 'active',
          align: 'left',
          width: '10%'
        },
        {
          mobile: true,
          text: 'Version Group ID',
          value: 'version_group_id',
          width: '25%'
        },
        {
          mobile: false,
          text: 'Created By',
          value: 'created_by.username',
          width: '15%'
        },
        {
          mobile: true,
          text: 'Project',
          value: 'project.name',
          width: '15%'
        },
        {
          mobile: true,
          text: '',
          value: 'action',
          align: 'end',
          sortable: false,
          width: '10%'
        }
      ],

      // Copying FVG ID
      copiedFvgId: null,
      copyTimeout: null,

      // Dialogs
      dialogDeleteFvg: false,

      // Load states
      loadingKey: 0,
      isDeletingFvg: false,
      isLoadingFvgs: false,

      // Search
      search: null,

      // FVG selected for deletion
      selectedFvg: null,

      // Alert data
      alertShow: false,
      alertMessage: '',
      alertType: null
    }
  },
  computed: {
    ...mapGetters('license', ['hasPermission']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('api', ['isCloud']),

    deleteFvgMutation() {
      if (!this.versionGroupFlows) return {}

      let mutation = this.versionGroupFlows.map(
        (flow, ind) =>
          `delete${ind}: deleteFlow(input: { flowId: "${flow.id}" }) {
            success
          }`
      )

      return gql`
        mutation DeleteFlowVersionGroup {
          ${mutation}
        }
      `
    },
    headers() {
      return this.$vuetify.breakpoint.mdAndUp
        ? this.allHeaders
        : this.allHeaders.filter(header => header.mobile)
    },
    isLoadingTable() {
      return this.loadingKey > 0
    },
    isTenantAdmin() {
      return this.hasPermission('create', 'role')
    },
    items() {
      if (!(this.versionGroups && this.flows)) return []

      return this.versionGroups.map(item => ({
        ...item,
        active:
          this.flows.filter(
            flow => flow.version_group_id === item.version_group_id
          ).length > 0
      }))
    }
  },
  watch: {
    tenant() {
      this.selectedFvg = null
      this.$apollo.queries.versionGroups.refetch()
      this.$apollo.queries.flows.refetch()
    }
  },
  methods: {
    cancelFvgDelete() {
      this.selectedFvg = null
      this.dialogDeleteFvg = false
    },
    copyTextToClipboard(id) {
      clearTimeout(this.copyTimeout)

      this.copiedFvgId = id

      navigator.clipboard.writeText(id)

      this.copyTimeout = setTimeout(() => {
        this.copiedFvgId = null
      }, 3000)
    },
    async deleteFvg() {
      this.isDeletingFvg = true

      try {
        await this.$apollo.mutate({
          mutation: this.deleteFvgMutation
        })

        this.$apollo.queries.versionGroups.refetch()
        this.$apollo.queries.flows.refetch()

        this.handleSuccess(
          'The flow version group has been successfully deleted.'
        )
      } catch (e) {
        this.handleError(
          'Something went wrong while trying to delete this flow version group.'
        )
        throw Error(e)
      }

      this.dialogDeleteFvg = false
      this.isDeletingFvg = false
      this.selectedFvg = null
    },
    handleError(message) {
      this.alertType = 'error'
      this.alertMessage = `${message}. Please try again later. If this error persists, please contact help@prefect.io.`
      this.alertShow = true
    },
    handleSuccess(message) {
      this.alertType = 'success'
      this.alertMessage = message
      this.alertShow = true
    },
    selectFvg(fvg) {
      this.selectedFvg = fvg
    }
  },
  apollo: {
    versionGroupFlows: {
      query: require('@/graphql/Flow/version-group.gql'),
      variables() {
        return {
          versionGroupId: this.selectedFvg.version_group_id
        }
      },
      update(data) {
        return data.flow
      },
      skip() {
        return !this.selectedFvg
      },
      loadingKey: 'loadingKey',
      error() {
        this.handleError(
          'Something went wrong while trying to fetch your flows.'
        )
      }
    },
    versionGroups: {
      query() {
        return require('@/graphql/TeamSettings/flow-version-groups.js').default(
          this.isCloud
        )
      },
      error() {
        this.handleError(
          'Something went wrong while trying to fetch your flows.'
        )
      },
      loadingKey: 'loadingKey',
      update(data) {
        return data.versionGroup
      }
    },
    flows: {
      query: require('@/graphql/TeamSettings/flows.gql'),
      error() {
        this.handleError(
          'Something went wrong while trying to fetch your flows.'
        )
      },
      loadingKey: 'loadingKey',
      update(data) {
        return data.flow
      }
    }
  }
}
</script>

<template>
  <ManagementLayout>
    <template #title>Flow Groups</template>

    <template #subtitle>
      <span v-if="isTenantAdmin">
        View and manage your team's flows by
        <ExternalLink
          href="https://docs.prefect.io/cloud/concepts/flows.html#versioning"
          >version group</ExternalLink
        >
      </span>
      <span v-else
        >View the
        <ExternalLink
          href="https://docs.prefect.io/cloud/concepts/flows.html#versioning"
          >flow groups</ExternalLink
        >
        of {{ tenant.name }}</span
      >
    </template>

    <!-- SEARCH (MOBILE) -->
    <v-text-field
      v-if="!$vuetify.breakpoint.mdAndUp"
      v-model="search"
      class="rounded-0 elevation-1 mt-2 mb-1"
      solo
      dense
      hide-details
      single-line
      placeholder="Search by flow name, project name or creator"
      prepend-inner-icon="search"
      autocomplete="new-password"
    ></v-text-field>

    <v-card :class="{ 'mt-3': $vuetify.breakpoint.mdAndUp }" tile>
      <v-card-text class="pa-0">
        <!-- SEARCH (DESKTOP) -->
        <div v-if="$vuetify.breakpoint.mdAndUp" class="py-1 mr-2 flex">
          <v-text-field
            v-model="search"
            class="rounded-0 elevation-1"
            solo
            dense
            hide-details
            single-line
            placeholder="Search by flow name, project name or creator"
            prepend-inner-icon="search"
            autocomplete="new-password"
            :style="{
              'max-width': $vuetify.breakpoint.mdAndUp ? '420px' : null
            }"
          ></v-text-field>
        </div>

        <!-- FVG TABLE -->
        <v-data-table
          fixed-header
          :search="search"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :items="items"
          :headers="headers"
          :loading="loadingKey > 0"
          :items-per-page="10"
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
        >
          <!-- HEADERS -->
          <template #header.name="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.active="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.version_group_id="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.created_by.username="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.project.name="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>

          <!-- FVG ID -->
          <template #item.version_group_id="{ item }">
            <v-tooltip top>
              <template #activator="{ on }">
                <div
                  class="hidewidth cursor-pointer"
                  v-on="on"
                  @click="copyTextToClipboard(item.version_group_id)"
                >
                  <span v-if="$vuetify.breakpoint.smAndUp">
                    {{ item.version_group_id }}
                  </span>
                  <span v-else>
                    {{ item.version_group_id.substring(0, 3) }}...
                  </span>
                </div>
              </template>
              <span>{{
                copiedFvgId === item.version_group_id
                  ? 'Copied!'
                  : 'Click to copy ID'
              }}</span>
            </v-tooltip>
          </template>

          <!-- FVG NAME -->
          <template #item.name="{ item }">
            <v-tooltip v-if="item.name" top>
              <template #activator="{ on }">
                <div class="hidewidth" v-on="on">
                  <router-link
                    :to="{
                      name: 'flow',
                      params: {
                        id: item.id,
                        tenant: tenant.slug
                      },
                      query: { versions: '' }
                    }"
                  >
                    {{ item.name }}
                  </router-link>
                </div>
              </template>
              <span>{{ item.name }}</span>
            </v-tooltip>
            <span v-else>-</span>
          </template>

          <!-- FVG ACTIVE/ARCHIVED -->
          <template #item.active="{ item }">
            <v-tooltip top>
              <template #activator="{ on }">
                <v-icon v-if="item.active" small dark color="green" v-on="on">
                  pi-flow
                </v-icon>
                <v-icon v-else small dark color="accentPink" v-on="on">
                  archive
                </v-icon>
              </template>
              <span v-if="item.active">
                This version group has an active flow
              </span>
              <span v-else>
                All flows in this version group are archived
              </span>
            </v-tooltip>
          </template>

          <!-- FVG ACTIONS -->
          <template v-if="isTenantAdmin" #item.action="{ item }">
            <v-btn
              color="error"
              text
              fab
              x-small
              @click="
                dialogDeleteFvg = true
                selectFvg(item)
              "
            >
              <v-icon>delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- DELETE FVG -->
    <ConfirmDialog
      v-if="selectedFvg"
      v-model="dialogDeleteFvg"
      type="error"
      :dialog-props="{ 'max-width': '500' }"
      :disabled="isDeletingFvg"
      :loading="isDeletingFvg"
      :title="
        `Are you sure you want to delete the version group for ${selectedFvg.name}?`
      "
      @cancel="cancelFvgDelete"
      @confirm="deleteFvg"
    >
      This will delete <span class="font-weight-black">all</span> versions of
      your flow and cannot be undone.
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
