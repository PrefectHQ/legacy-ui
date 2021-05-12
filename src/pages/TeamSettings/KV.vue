<script>
import JsonInput from '@/components/CustomInputs/JsonInput'
import ManagementLayout from '@/layouts/ManagementLayout'
import ConfirmDialog from '@/components/ConfirmDialog'
import Alert from '@/components/Alert'
import MenuTooltip from '@/components/MenuTooltip'
import { formatTime } from '@/mixins/formatTimeMixin'
import { mapGetters } from 'vuex'

export default {
  components: {
    JsonInput,
    Alert,
    ManagementLayout,
    ConfirmDialog,
    MenuTooltip
  },
  mixins: [formatTime],
  data() {
    return {
      // loading states
      isFetchingKV: true,
      isDeletingKV: false,
      isSettingKV: false,

      // Store previous kv name when modifying kv
      // This is used to delete the kv with that name and create a new kv with a separate value
      previousKVName: null,

      // KV selected for modification/deletion
      selectedKV: null,

      // Alert data
      alertShow: false,
      alertMessage: '',
      alertType: null,

      // Input rules
      rules: {
        required: val => !!val || 'This field is required.'
      },
      errorMessage: '',
      invalidKV: false,

      // Types
      selectedTypeIndex: 0,
      kvTypes: [
        { value: 'auto', text: 'Auto' },
        { value: 'string', text: 'String' },
        { value: 'json', text: 'JSON' }
      ],

      // JsonInput
      placeholderText:
        "Enter your KV value here...\n\nClick on 'Type' to select a type validation",

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
      headers: [
        { text: 'Key', value: 'key' },
        { text: 'Value', value: 'value' },
        { text: 'Created By', value: 'created' },
        { text: 'Last Updated', value: 'updated' },
        {
          text: '',
          value: 'actions',
          align: 'right',
          sortable: false
        }
      ],

      // fake data

      items: [
        {
          id: 1,
          key: 'prod.config.ram',
          value: '8gb',
          created: 'jane@gmail.com',
          updated: '2021-04-29T23:36:48.494Z'
        },
        {
          id: 2,
          key: 'prod.config.ram2',
          value: '16gb',
          created: 'john@gmail.com',
          updated: '2021-04-29T23:36:48.494Z'
        },
        {
          id: 3,
          key: 'dev.config',
          value: JSON.stringify([
            {
              _id: '608b43a3e8451372b62f0ebe',
              index: 0,
              guid: '8fddc0d3-47f9-4335-a543-849341986864',
              isActive: false,
              balance: '$2,441.60',
              picture: 'http://placehold.it/32x32',
              age: 33,
              eyeColor: 'blue',
              name: 'Robles Dawson',
              gender: 'male',
              company: 'MANUFACT',
              email: 'roblesdawson@manufact.com',
              phone: '+1 (900) 520-2622',
              address: '991 Osborn Street, Tyro, District Of Columbia, 1328',
              about:
                'Cillum sunt adipisicing eiusmod minim qui fugiat. Reprehenderit mollit cupidatat occaecat est. Velit nulla nostrud id incididunt dolor in magna nisi commodo consequat voluptate. Non adipisicing ea minim cupidatat sint ipsum. Commodo in ipsum fugiat non laborum dolore dolor pariatur cillum laborum. Aute ex elit ex culpa Lorem in do cillum sit. Deserunt eu consectetur fugiat enim et mollit.\r\n',
              registered: '2018-08-10T07:57:29 +07:00',
              latitude: 24.154272,
              longitude: -160.265207,
              tags: ['aliquip', 'anim', 'eu', 'ex', 'qui', 'officia', 'irure'],
              friends: [
                {
                  id: 0,
                  name: 'Wright Rhodes'
                },
                {
                  id: 1,
                  name: 'Nadine Payne'
                },
                {
                  id: 2,
                  name: 'Solis Mccullough'
                }
              ],
              greeting: 'Hello, Robles Dawson! You have 1 unread messages.',
              favoriteFruit: 'banana'
            }
          ]),
          created: 'mary@gmail.com',
          updated: '2021-01-18T11:24:00.000Z'
        },
        {
          id: 4,
          key: 'foo',
          value: 'bar',
          created: 'james@gmail.com',
          updated: '2021-04-17T10:24:00.000Z'
        }
      ],

      // Dialogs
      keyModifyDialog: false,
      keyDeleteDialog: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    disableConfirm() {
      if (!this.keyInput) return false
      if (!this.KvValueInput) return false
      if (this.invalidKV) return false
      return true
    }
  },
  methods: {
    handleReset(item) {
      this.KvValueInput = item.value
    },
    async copyValue(item) {
      try {
        await navigator.clipboard.writeText(item.value)
        this.handleAlert('success', 'Value copied to clipboard')
      } catch (err) {
        this.handleAlert(
          'error',
          'Something went wrong trying to copy your value to the clipboard'
        )
      }
    },
    isJSON(str) {
      try {
        return !!(JSON.parse(str) && str)
      } catch (e) {
        return false
      }
    },
    jsonEditorType(item) {
      if (this.isJSON(item.value)) {
        return 2
      } else {
        return 0
      }
    },
    openKVModifyDialog(item) {
      this.selectedKV = item
      this.isKvUpdate = true
      this.previousKVName = item.key
      this.keyInput = item.key
      this.KvValueInput = item.value
      this.keyModifyDialog = true
    },
    openKVDeleteDialog(item) {
      this.selectedKV = item
      this.keyDeleteDialog = true
    },
    handleAlert(type, message) {
      this.alertType = type
      this.alertMessage = message
      this.alertShow = true
    },
    resetSelectedKV() {
      this.selectedKV = null
      this.keyInput = null
      this.KvValueInput = null
      this.selectedTypeIndex = 0
      this.invalidKV = false
    },
    setKV() {
      //   this.isSettingKV = true
      //   if (this.selectedTypeIndex === 2 && !this.validKVJSON()) {
      //     this.isSettingKV = false
      //     this.invalidKV = true
      //     return
      //   }
      //   if (this.isKvUpdate) {
      //     // modifying
      //     this.deleteKV({ name: this.previousKVName }, { isModifying: true })
      //   }
      //   console.log(this.KvValueInput)
      //   let value = this.KvValueInput
      //   if (this.selectedTypeIndex === 0) {
      //     try {
      //       value = JSON.stringify(JSON.parse(this.KvValueInput))
      //     } catch {
      //       try {
      //         value = String.raw`${this.KvValueInput}`
      //       } catch {
      //         value = JSON.stringify(this.KvValueInput)
      //       }
      //     }
      //   }
      //   if (this.selectedTypeIndex === 2) value = JSON.parse(this.KvValueInput)
      //   // call muatation
      //   //  const kvResult = await this.$apollo.mutate({
      //   //   mutation: require('@/graphql/KV/set-kv.gql'),
      //   //   variables: {
      //   //     name: this.keyInput,
      //   //     value: value || []
      //   //   }
      //   // })
      //   const fakeResult = new Promise(resolve => {
      //     setTimeout(() => {
      //       resolve({
      //         data: {
      //           set_kv: {
      //             success: true,
      //             result: {
      //               id: Math.floor(Math.random() * 100 + 1),
      //               key: this.keyInput,
      //               value: value || [],
      //               created: this.tenant.name,
      //               updated: new Date(
      //                 +new Date() - Math.floor(Math.random() * 10000000000)
      //               )
      //             }
      //           }
      //         }
      //       })
      //     }, 2000)
      //   })
      //   fakeResult.then(res => {
      //     if (res?.data?.set_kv?.success) {
      //       // this.$apollo.queries.kv.refetch()
      //       this.keyModifyDialog = false
      //       this.items.push(res?.data?.set_kv?.result)
      //       // this.resetSelectedKV()
      //       this.handleAlert(
      //         'success',
      //         `KV ${this.isKvUpdate ? 'updated' : 'added'}.`
      //       )
      //     } else {
      //       this.handleAlert(
      //         'error',
      //         `Something went wrong when ${
      //           this.isKvUpdate ? 'updating' : 'creating'
      //         } this KV. Please try again. If this error persists, please contact help@prefect.io.`
      //       )
      //     }
      //   })
      //   // this.isSettingKV = false
      //   // this.keyInput = null
      //   // this.KvValueInput = null
      // },
      // deleteKV(kv, opts = {}) {
      //   this.isDeletingKV = true
      //   //  mutation
      //   // const KvResult = await this.$apollo.mutate({
      //   //   mutation: require('@/graphql/KV/delete-kv.gql'),
      //   //   variables: {
      //   //     name: kv.name
      //   //   }
      //   // })
      //   const fakeResult = new Promise(resolve => {
      //     setTimeout(() => {
      //       resolve({
      //         data: {
      //           delete_kv: {
      //             success: true,
      //             result: kv
      //           }
      //         }
      //       })
      //     }, 2000)
      //   })
      //   fakeResult.then(res => {
      //     if (res?.data?.delete_kv?.success) {
      //       if (!opts.isModifying) {
      //         // this.$apollo.queries.kv.refetch()
      //         this.keyDeleteDialog = false
      //         this.handleAlert('success', 'KV deleted.')
      //       }
      //     } else {
      //       this.handleAlert(
      //         'error',
      //         'Something went wrong while trying to delete this kv. Please try again. If this error persists, reach out to help@prefect.io.'
      //       )
      //     }
      //   })
      // this.isDeletingKV = false
    },

    validKVJSON() {
      this.invalidKV = false
      if (this.selectedTypeIndex !== 2) {
        this.$refs.kvRef.removeJsonErrors()
        return true
      }
      if (!this.$refs.kvRef) {
        this.$refs.kvRef.removeJsonErrors()
        return true
      }
      // Check JSON using the JsonInput component's validation (need to check for true over truthy here because of the way the jsonInput returns for other components)
      if (this.$refs.kvRef.validateJson() === true) return true
      return false
    },
    setInvalidKV(event) {
      this.invalidKV = event
    },
    handleKVExpand(kv) {
      this.KvValueInput = kv.item.value
    }
  }
  //  apollo: {
  //   kv: {
  //     query: require('@/graphql/Tenant/get-kv.gql'),
  //     result() {
  //       this.isFetchingKV = false
  //     },
  //     update(data) {
  //       return data?.kv?.map(item => ({ key: item.key, value: null }))
  //     },
  //     // skip() {
  //     //   return this.isReadOnlyUser
  //     // },
  //     error() {
  //       this.isFetchingKV = false
  //       if (!this.isReadOnlyUser) {
  //         this.handleAlert(
  //           'error',
  //           'Something went wrong while trying to fetch kv. Please try again. If this error persists, please contact help@prefect.io.'
  //         )
  //       }
  //     },
  //     fetchPolicy: 'network-only'
  //   }
  // }
}
</script>

<template>
  <div>
    <ManagementLayout :show="true" control-show>
      <template #title>KV Store</template>

      <template #subtitle>
        Manage your key/value
        <sup>
          <v-icon x-small>
            open_in_new
          </v-icon>
        </sup>
      </template>

      <template #cta>
        <v-btn
          color="primary"
          class="white--text"
          large
          @click="keyModifyDialog = true"
        >
          <v-icon left>
            add
          </v-icon>
          Add KV
        </v-btn>
      </template>
    </ManagementLayout>
    <v-card tile class="mx-auto">
      <v-card-title>
        <v-text-field
          v-model="search"
          placeholder="Search for a key"
          flat
          hide-details
          clearable
          prepend-inner-icon="search"
          clear-icon="close"
        ></v-text-field>
      </v-card-title>

      <v-card-text class="pa-0">
        <!-- TABLE -->
        <v-data-table
          :headers="headers"
          :items="items"
          :search="search"
          :expanded="expanded"
          show-expand
          @item-expanded="handleKVExpand"
          :single-expand="true"
          no-results-text="No keys found. Try expanding your search?"
          no-data-text="Your team does not have any keys yet."
        >
          <!-- ACTIONS -->
          <template v-slot:expanded-item="{ headers, item }">
            <td :colspan="headers.length">
              <div
                class="d-flex justify-end align-end mt-5"
                style="width: 100%;"
              >
                <v-btn
                  x-small
                  class="text-normal mr-2"
                  depressed
                  color="utilGrayLight"
                  title="Reset"
                  @click="handleReset(item)"
                >
                  Reset
                  <v-icon small>refresh</v-icon>
                </v-btn>
              </div>

              <JsonInput
                v-model="KvValueInput"
                ref="kvRef"
                class="text-body-1 mt-2 mb-5"
                :selected-type="
                  selectedTypeIndex > 0
                    ? kvTypes[selectedTypeIndex].value
                    : kvTypes[jsonEditorType(item)].value
                "
                :placeholder-text="item.value"
                @invalid-secret="setInvalidKV"
              >
                <v-menu top offset-y>
                  <template #activator="{ on }">
                    <v-btn
                      text
                      small
                      class="position-absolute"
                      :style="{
                        bottom: '25px',
                        right: '140px',
                        'z-index': 3
                      }"
                      color="accent"
                      :loading="isSettingKV"
                      v-on="on"
                      @click="setKV"
                    >
                      Save
                    </v-btn>
                  </template>
                </v-menu>
                <v-menu top offset-y>
                  <template #activator="{ on }">
                    <v-btn
                      text
                      small
                      class="position-absolute"
                      :style="{
                        bottom: '25px',
                        right: '80px',
                        'z-index': 3
                      }"
                      color="accent"
                      v-on="on"
                      >Type</v-btn
                    >
                  </template>
                  <v-list>
                    <v-list-item-group
                      v-model="selectedTypeIndex"
                      color="primary"
                    >
                      <v-list-item
                        v-for="(item, index) in kvTypes"
                        :key="index"
                      >
                        <v-list-item-title>{{ item.text }} </v-list-item-title>
                      </v-list-item>
                    </v-list-item-group>
                  </v-list>
                </v-menu>
              </JsonInput>
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

              <MenuTooltip v-if="item.value.length > 150" maxWidth="50%">
                {{ item.value }}
              </MenuTooltip>
            </div>
          </template>
          <template #item.updated="{item}">
            {{ formatTime(item.updated) }}
          </template>
          <template #item.actions="{item}">
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  text
                  fab
                  x-small
                  color="primary"
                  v-on="on"
                  @click="openKVModifyDialog(item)"
                >
                  <v-icon>edit</v-icon>
                </v-btn>
              </template>
              Modify key
            </v-tooltip>
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
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
        </v-data-table>
      </v-card-text>
    </v-card>

    <ConfirmDialog
      v-model="keyModifyDialog"
      :dialog-props="{ 'max-width': '75vh' }"
      :disabled="!disableConfirm"
      :loading="isSettingKV"
      :title="isKvUpdate ? 'Modify KV' : 'Create New KV'"
      @confirm="setKV"
    >
      <v-text-field
        v-model="keyInput"
        :rules="[rules.required]"
        class="_lr-hide mt-6"
        data-private
        single-line
        outlined
        dense
        placeholder="Key Name"
        prepend-inner-icon="vpn_key"
        validate-on-blur
      />

      <JsonInput
        v-model="KvValueInput"
        ref="kvRef"
        class="text-body-1"
        :placeholder-text="placeholderText"
        :selected-type="kvTypes[selectedTypeIndex].value"
        @invalid-secret="setInvalidKV"
      >
        <v-menu top offset-y>
          <template #activator="{ on }">
            <v-btn
              text
              small
              class="position-absolute"
              :style="{
                bottom: '25px',
                right: '80px',
                'z-index': 3
              }"
              color="accent"
              v-on="on"
              >Type</v-btn
            >
          </template>
          <v-list>
            <v-list-item-group v-model="selectedTypeIndex" color="primary">
              <v-list-item v-for="(item, index) in kvTypes" :key="index">
                <v-list-item-title>{{ item.text }} </v-list-item-title>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-menu>
      </JsonInput>
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

    <Alert
      v-model="alertShow"
      :type="alertType"
      :message="alertMessage"
    ></Alert>
  </div>
</template>
