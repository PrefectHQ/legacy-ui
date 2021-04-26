<script>
// "foo-moo.bar.baz".split(".") => [ 'foo-moo', 'bar', 'baz' ]
// "foo.bar.baz".split(".") => [ 'foo', 'bar', 'baz' ]

/*
[{
"dev.config.ram": "8 gb",
"regular": "foo"
}]
*/
import JsonInput from '@/components/CustomInputs/JsonInput'
import ManagementLayout from '@/layouts/ManagementLayout'
import ConfirmDialog from '@/components/ConfirmDialog'

export default {
  components: {
    JsonInput,
    ManagementLayout,
    ConfirmDialog
  },
  data() {
    return {
      items: [
        {
          id: 1,
          key: 'prod.config.ram',
          value: '8GB'
        },
        {
          id: 2,
          key: 'beep',
          value: 'boop'
        },
        {
          id: 3,
          key: 'dev.config.cpu',
          value: '{a: 1, b: 2}'
        }
      ],
      search: null,
      expandAll: false,
      json: false,
      secretModifyDialog: false
    }
  },
  computed: {
    queryData() {
      // return items.map(item => {
      //   return item.key
      //     .split('.')
      //     .reduceRight(
      //       (o, x) => ({ id: item.id, name: [x][0], children: [o] }),
      //       {}
      //     )
      // })

      return this.items.map(item => {
        return item.key.split('.').reduceRight(
          (o, x) => ({
            name: [x][0],
            children: Object.keys(o).length === 0 ? [] : [o]
          }),
          {}
        )
      })
    },
    keyNames() {
      return this.items.map(item => item.key.split('.')[0])
    }
  },
  methods: {
    handleEdit(item) {
      console.log(item)
    },
    addKey() {
      this.secretModifyDialog = true
    }
  }
}
</script>

<template>
  <div>
    <ManagementLayout :show="true" control-show>
      <template #title>Key/Value </template>

      <template #subtitle>
        Manage your key/value
        <sup>
          <v-icon x-small>
            open_in_new
          </v-icon>
        </sup>
      </template>

      <template #cta>
        <v-btn color="primary" class="white--text" large @click="addKey">
          <v-icon left>
            add
          </v-icon>
          Add Key
        </v-btn>
      </template>
    </ManagementLayout>
    <v-card elevation="2" tile class="mx-auto mt-10">
      <v-sheet class="pa-4">
        <v-text-field
          v-model="search"
          placeholder="Search  for a key"
          flat
          outlined
          hide-details
          clearable
          prepend-inner-icon="search"
          clear-icon="close"
        ></v-text-field>
        <div
          class="d-flex justify-end align-end mb-1 mt-4"
          style="width: 100%;"
        >
          <v-btn
            x-small
            class="text-normal mr-2"
            depressed
            color="utilGrayLight"
          >
            <v-icon small>expand_more</v-icon>
            Expand All
          </v-btn>

          <v-switch
            v-model="json"
            inset
            label="JSON"
            class="mt-0 small-switch v-input--reverse"
            hide-details
          ></v-switch>
        </div>

        <div v-if="json">
          <JsonInput
            ref="json-input"
            v-model="jsonInput"
            prepend-icon="fad fa-file-code"
            prepend-icon-label="JSON"
            selected-type="json"
          />
        </div>
      </v-sheet>
      <v-card-text class="pa-0">
        <v-treeview :items="queryData" expand-icon="expand_more" open-on-click>
          <template v-slot:append="{ item }">
            <v-icon
              v-if="keyNames.includes(item.name)"
              text
              fab
              small
              color="primary"
              @click="addKey"
              >edit</v-icon
            >
            <v-icon
              v-if="keyNames.includes(item.name)"
              text
              fab
              small
              color="error"
              >delete</v-icon
            >
          </template>
        </v-treeview>
      </v-card-text>
    </v-card>

    <ConfirmDialog
      v-model="secretModifyDialog"
      :dialog-props="{ 'max-width': '75vh' }"
      title="Create New Secret"
    >
      <v-text-field
        class="_lr-hide mt-6"
        data-private
        single-line
        outlined
        dense
        placeholder="Secret Name"
        prepend-inner-icon="vpn_key"
        validate-on-blur
      />

      <JsonInput ref="secretRef" prepend-icon="lock" class="text-body-1">
        <!-- <v-menu top offset-y>
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
              <v-list-item v-for="(item, index) in secretTypes" :key="index">
                <v-list-item-title>{{ item.text }} </v-list-item-title>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-menu> -->
      </JsonInput>
    </ConfirmDialog>
  </div>
</template>
