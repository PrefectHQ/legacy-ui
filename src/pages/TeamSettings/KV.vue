<script>
import CodeInput from '@/components/CustomInputs/CodeInput'
import ResettableWrapper from '@/components/CustomInputs/ResettableWrapper'
import ManagementLayout from '@/layouts/ManagementLayout'
import ConfirmDialog from '@/components/ConfirmDialog'
import { isValidJson, formatJson, parseJson } from '@/utils/json'
import { formatTime } from '@/mixins/formatTimeMixin'
import { mapGetters, mapActions } from 'vuex'

export default {
  components: {
    CodeInput,
    ResettableWrapper,
    ManagementLayout,
    ConfirmDialog
  },
  mixins: [formatTime],
  data() {
    return {
      isEditable: false,
      // loading states
      isFetchingKV: true,
      isDeletingKV: false,
      isSettingKV: false,

      // Store previous kv name when modifying kv
      // This is used to delete the kv with that name and create a new kv with a separate value
      previousKVName: null,

      // KV selected for modification/deletion
      selectedKV: null,

      // Input rules
      rules: {
        required: val => !!val || 'This field is required.'
      },
      errorMessage: '',

      // Types
      selectedInputMode: 'text',
      // Create/modify kv key & value input
      keyInput: null,
      KvValueInput: '',

      // Distinguish between creating & modifying KV
      isKvUpdate: false,

      jsonInput: '',

      // table search
      search: '',

      expanded: [],

      //table headers
      kvHeaders: [
        { text: 'Key', value: 'key' },
        { text: 'Value', value: 'value' },
        { text: 'Created', value: 'created' },
        { text: 'Last Updated', value: 'updated' },
        {
          text: '',
          value: 'actions',
          align: 'right',
          sortable: false
        }
      ],

      // Dialogs
      keyModifyDialog: false,
      keyDeleteDialog: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('license', ['license', 'hasPermission']),
    maxKVCount() {
      return this.license?.terms?.key_value_pairs
    },
    kvExists() {
      if (!this.kv) return false

      if (this.selectedKV?.key === this.keyInput) {
        return false
      }
      return this.kv?.map(kv => kv.key).includes(this.keyInput)
    },
    hasEditedKvInput() {
      return this.KvValueInput != formatJson(this.item?.value)
    }
  },
  watch: {
    tenant() {
      this.$apollo.queries.kv.refetch()
    }
  },
  methods: {
    ...mapActions('alert', ['addNotification']),
    setSelectedInputMode() {
      this.selectedInputMode = this.getInputMode(this.KvValueInput)
    },
    getInputMode(value) {
      if (!isValidJson(value)) {
        return 'text'
      }

      const parsed = parseJson(value)
      if (typeof parsed !== 'object' || parsed == null) {
        return 'text'
      }

      return 'json'
    },
    getItemValue(item) {
      return formatJson(item?.value)
    },
    getItemIsExpanded(item) {
      const expandedId = this.expanded[0]?.id

      return item.id == expandedId
    },
    resetKvValueInput() {
      this.KvValueInput = ''

      this.setSelectedInputMode()
    },
    setKvValueInput(value) {
      this.KvValueInput = formatJson(value)

      this.setSelectedInputMode()
    },
    async copyValue(item) {
      try {
        if (typeof item?.value == 'object') {
          await navigator.clipboard.writeText(this.getItemValue(item))
        } else {
          await navigator.clipboard.writeText(item?.value)
        }
        this.handleAlert('success', 'Value copied to clipboard')
      } catch (err) {
        this.handleAlert(
          'error',
          'Something went wrong trying to copy your value to the clipboard'
        )
      }
    },
    openKVEdit(item) {
      this.selectedKV = item
      this.isKvUpdate = true
      this.previousKVName = item?.key
      this.keyInput = item?.key

      this.setKvValueInput(item?.value)
      if (this.isEditable) {
        this.expanded = [item]
      } else {
        this.expanded = []
      }
    },
    openKVDeleteDialog(item) {
      this.selectedKV = item
      this.keyDeleteDialog = true
    },
    async handleAlert(type, message) {
      if (type == 'success') {
        await this.addNotification({
          color: 'accentGreen',
          text: message,
          dismissable: true,
          timeout: 5000
        })
      } else {
        await this.addNotification({
          color: 'error',
          text: message,
          dismissable: true,
          timeout: 5000
        })
      }
    },
    resetSelectedKV() {
      this.selectedKV = null
      this.keyInput = null
      this.resetKvValueInput()
      this.expanded = []
      this.isEditable = false
    },
    async validateAndSetKV() {
      if (!this.keyInput || !this.$refs.KvValueInput.validate()) {
        this.handleAlert('error', 'Cannot save with errors in form.')
        return
      }

      await this.setKV()
    },
    async setKV() {
      this.isSettingKV = true

      if (this.isKvUpdate) {
        const deleteKVResult = await this.deleteKV(
          { id: this.selectedKV?.id },
          { isModifying: true }
        )
        if (deleteKVResult?.errors) {
          this.isSettingKV = false
          this.resetSelectedKV()
          return
        }
      }
      const value = isValidJson(this.KvValueInput)
        ? parseJson(this.KvValueInput)
        : this.KvValueInput
      const kvResult = await this.$apollo.mutate({
        mutation: require('@/graphql/KV/set-key-value.gql'),
        variables: {
          key: this.keyInput,
          value
        },
        errorPolicy: 'all'
      })

      if (this.isKvUpdate) this.isSettingKV = false

      if (kvResult?.data?.set_key_value?.id) {
        this.$apollo.queries.kv.refetch()
        this.keyModifyDialog = false
        this.resetSelectedKV()
        this.handleAlert(
          'success',
          `KV ${this.isKvUpdate ? 'updated' : 'added'}.`
        )
      } else if (kvResult?.errors) {
        this.expanded = []
        this.keyModifyDialog = false
        this.resetSelectedKV()
        this.handleAlert('error', kvResult?.errors[0]?.message)
      } else {
        this.expanded = []
        this.keyModifyDialog = false
        this.resetSelectedKV()
        this.handleAlert(
          'error',
          `Something went wrong when ${
            this.isKvUpdate ? 'updating' : 'creating'
          } this kv. Please try again. If this error persists, please contact help@prefect.io.`
        )
      }

      this.isSettingKV = false
      this.keyInput = null
      this.resetKvValueInput()
    },
    async deleteKV(kv, opts = {}) {
      this.isDeletingKV = true

      const deleteKVResult = await this.$apollo.mutate({
        mutation: require('@/graphql/KV/delete-key-value.gql'),
        variables: {
          id: kv?.id
        },
        errorPolicy: 'all'
      })

      if (deleteKVResult?.data?.delete_key_value?.success) {
        if (!opts.isModifying) {
          this.$apollo.queries.kv.refetch()
          this.keyDeleteDialog = false
          this.handleAlert('success', 'KV deleted.')
        }
      } else if (deleteKVResult?.errors) {
        this.keyDeleteDialog = false
        this.handleAlert('error', deleteKVResult?.errors[0]?.message)
      } else {
        this.keyDeleteDialog = false
        this.handleAlert(
          'error',
          'Something went wrong while trying to delete this KV. Please try again. If this error persists, reach out to help@prefect.io.'
        )
      }

      this.isDeletingKV = false
      return deleteKVResult
    },
    handleKVExpand(kv) {
      this.selectedKV = kv?.item
      this.isKvUpdate = true
      this.previousKVName = kv?.item?.key

      this.setKvValueInput(kv?.item?.value)

      this.keyInput = kv?.item?.key
    },
    onIntersect([entry]) {
      this.$apollo.queries.kv.skip = !entry.isIntersecting
    }
  },
  apollo: {
    kv: {
      query: require('@/graphql/KV/get-key-value.gql'),
      result() {
        this.isFetchingKV = false
      },
      pollInterval: 30000,
      update(data) {
        if (!data) return
        return data?.key_value
      },
      error() {
        this.isFetchingKV = false

        this.handleAlert(
          'error',
          'Something went wrong while trying to fetch the kv. Please try again. If this error persists, please contact help@prefect.io.'
        )
      },
      fetchPolicy: 'network-only'
    }
  }
}
</script>

<template>
  <div v-intersect="{ handler: onIntersect }">
    <ManagementLayout :show="!isFetchingKV">
      <template #title>KV Store</template>

      <template #subtitle>
        <!-- <ExternalLink href="https://docs.prefect.io/orchestration/concepts/kv_store.html">key:value</ExternalLink> -->

        Manage your team's key/value store
      </template>

      <template v-if="hasPermission('create', 'key-value') && maxKVCount" #cta>
        <v-btn
          color="primary"
          class="white--text"
          large
          :disabled="kv ? kv.length >= maxKVCount : false"
          @click="
            expanded = []
            previousKVName = null
            keyInput = null
            resetKvValueInput()
            isKvUpdate = false
            keyModifyDialog = true
          "
        >
          <v-icon left>
            add
          </v-icon>
          Add KV
        </v-btn>
      </template>

      <template #alerts>
        <v-alert
          v-if="!hasPermission('create', 'key-value')"
          class="mx-auto"
          border="left"
          colored-border
          elevation="2"
          type="warning"
          tile
          icon="lock"
          max-width="380"
        >
          You don't have permission to manage kv.
        </v-alert>

        <v-alert
          v-if="!maxKVCount"
          class="mx-auto"
          border="left"
          colored-border
          elevation="2"
          type="warning"
          tile
          icon="lock"
          max-width="380"
        >
          Your team's license does not include this feature. Please contact
          help@prefect.io for more information.
        </v-alert>
      </template>

      <v-text-field
        v-if="
          !$vuetify.breakpoint.mdAndUp && !hasPermission('create', 'key-value')
        "
        v-model="search"
        class="rounded-0 elevation-1 mb-1"
        solo
        dense
        hide-details
        single-line
        placeholder="Search for a key"
        prepend-inner-icon="search"
      ></v-text-field>
    </ManagementLayout>
    <v-card v-if="maxKVCount" tile class="mx-auto">
      <v-card-text class="pa-0">
        <!-- SEARCH (DESKTOP) -->
        <div
          v-if="$vuetify.breakpoint.mdAndUp"
          class="py-1 mr-2 d-flex justify-end"
        >
          <v-text-field
            v-model="search"
            class="rounded-0 elevation-1"
            solo
            dense
            hide-details
            single-line
            placeholder="Search for a key"
            prepend-inner-icon="search"
            :style="{
              'max-width': $vuetify.breakpoint.mdAndUp ? '360px' : null
            }"
          ></v-text-field>
        </div>
        <!-- TABLE -->
        <v-data-table
          :headers="kvHeaders"
          :items="kv"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          sort-by="created"
          sort-desc
          :search="search"
          :loading="$apollo.queries.kv.loading"
          :expanded.sync="expanded"
          show-expand
          :single-expand="true"
          no-results-text="No keys found. Try expanding your search?"
          no-data-text="Your team does not have any keys yet."
          @item-expanded="handleKVExpand"
        >
          <!-- ACTIONS -->
          <template #expanded-item="{ headers, item }">
            <td :colspan="headers.length">
              <resettable-wrapper
                :key="item.id"
                v-model="KvValueInput"
                class="resettable-dictionary-json"
                @input="setSelectedInputMode"
              >
                <code-input
                  ref="KvValueInput"
                  v-model="KvValueInput"
                  class="text-body-1 mt-2"
                  :mode.sync="selectedInputMode"
                  :editors="['text', 'json']"
                />
                <div class="d-flex flex-grow-1 justify-end mb-5">
                  <v-btn
                    small
                    color="primary"
                    :loading="isSettingKV"
                    @click="validateAndSetKV"
                    >Save</v-btn
                  >
                </div>
              </resettable-wrapper>
            </td>
          </template>
          <template #item.value="{item}">
            <div class="d-flex">
              <div
                class="text-truncate"
                style="
          width: 15vw;
        "
              >
                {{ item.value }}
              </div>
            </div>
          </template>
          <template #item.created="{item}">
            {{ formatTime(item.created) }}
          </template>
          <template #item.updated="{item}">
            {{ formatTime(item.updated) }}
          </template>
          <template #item.actions="{item}">
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  v-if="hasPermission('update', 'key-value')"
                  text
                  fab
                  x-small
                  color="primary"
                  :disabled="getItemIsExpanded(item)"
                  v-on="on"
                  @click="
                    isEditable = !isEditable
                    openKVEdit(item)
                  "
                >
                  <v-icon>edit</v-icon>
                </v-btn>
              </template>
              Modify key
            </v-tooltip>
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  v-if="hasPermission('delete', 'key-value')"
                  text
                  fab
                  x-small
                  color="error"
                  v-on="on"
                  @click="openKVDeleteDialog(item)"
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
              Delete key
            </v-tooltip>
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  text
                  fab
                  x-small
                  color="primary"
                  v-on="on"
                  @click="copyValue(item)"
                >
                  <v-icon>content_copy</v-icon>
                </v-btn>
              </template>
              Copy value
            </v-tooltip>
          </template>

          <template #footer.page-text>
            <div class="text-caption">
              {{ kv ? kv.length : 0 }} out of {{ maxKVCount }} keys used
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <ConfirmDialog
      v-model="keyModifyDialog"
      :dialog-props="{ 'max-width': '75vh' }"
      :loading="isSettingKV"
      confirm-text="Save"
      title="Create KV"
      @confirm="validateAndSetKV"
      @cancel="resetSelectedKV"
    >
      <v-text-field
        v-model="keyInput"
        :rules="[rules.required]"
        :messages="
          kvExists
            ? 'A key with this this name already exists. Clicking CONFIRM will overwrite it.'
            : null
        "
        class="_lr-hide mt-6"
        autofocus
        data-private
        single-line
        outlined
        dense
        placeholder="Key"
        prepend-inner-icon="vpn_key"
        validate-on-blur
      />

      <code-input
        ref="KvValueInput"
        v-model="KvValueInput"
        class="text-body-1"
        placeholder="Value"
        :mode.sync="selectedInputMode"
        :editors="['text', 'json']"
      />
    </ConfirmDialog>

    <ConfirmDialog
      v-model="keyDeleteDialog"
      type="error"
      :loading="isDeletingKV"
      confirm-text="Delete"
      :dialog-props="{ 'max-width': '500' }"
      title="Are you sure you want to delete this key?"
      @confirm="deleteKV(selectedKV)"
    >
      This action cannot be undone.
    </ConfirmDialog>
  </div>
</template>
