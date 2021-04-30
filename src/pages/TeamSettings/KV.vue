<script>
import JsonInput from '@/components/CustomInputs/JsonInput'
import ManagementLayout from '@/layouts/ManagementLayout'
import ConfirmDialog from '@/components/ConfirmDialog'
import MenuTooltip from '@/components/MenuTooltip'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    JsonInput,
    ManagementLayout,
    ConfirmDialog,
    MenuTooltip
  },
  mixins: [formatTime],
  data() {
    return {
      search: '',
      headers: [
        { text: 'Key', value: 'key' },
        { text: 'Value', value: 'value' },
        { text: 'Created By', value: 'created' },
        { text: 'Last Used', value: 'updated' },
        {
          text: '',
          value: 'actions',
          align: 'right',
          sortable: false
        }
      ],
      items: [
        {
          key: 'prod.config.ram',
          value: '8gb',
          created: 'jane@gmail.com',
          updated: '2021-04-29T23:36:48.494Z'
        },
        {
          key: 'prod.config.ram2',
          value: '16gb',
          created: 'john@gmail.com',
          updated: '2021-04-29T23:36:48.494Z'
        },
        {
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
          key: 'foo',
          value: 'bar',
          created: 'james@gmail.com',
          updated: '2021-04-17T10:24:00.000Z'
        }
      ],
      json: false,
      keyModifyDialog: false,
      keyDeleteDialog: false
    }
  }
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

      <div class="d-flex justify-end align-end mb-1 mt-4" style="width: 100%;">
        <v-switch
          v-model="json"
          inset
          label="JSON"
          class="mt-0 small-switch v-input--reverse"
          hide-details
        ></v-switch>
      </div>

      <div v-if="json" style="padding: 10px;">
        <JsonInput
          ref="json-input"
          prepend-icon="fad fa-file-code"
          prepend-icon-label="JSON"
          selected-type="json"
        />
      </div>

      <v-card-text class="pa-0">
        <!-- TABLE -->
        <v-data-table :headers="headers" :items="items" :search="search">
          <!-- ACTIONS -->
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
          <template #item.actions>
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  text
                  fab
                  x-small
                  color="primary"
                  v-on="on"
                  @click="keyModifyDialog = true"
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
                  @click="keyDeleteDialog = true"
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
              Delete key
            </v-tooltip>

            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn text fab x-small color="primary" v-on="on">
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
      title="Create New Key"
    >
      <v-text-field
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
        ref="secretRef"
        class="text-body-1"
        placeholder-text="Enter your value"
      >
      </JsonInput>
    </ConfirmDialog>

    <ConfirmDialog
      v-model="keyDeleteDialog"
      type="error"
      confirm-text="Delete"
      :dialog-props="{ 'max-width': '500' }"
      title="Are you sure you want to delete this key?"
    >
      This action cannot be undone.
    </ConfirmDialog>

    <Alert
      type="error"
      message="message"
      :offset-x="$vuetify.breakpoint.mdAndUp ? 256 : 56"
    ></Alert>
  </div>
</template>

<style></style>
