<script>
// "foo-moo.bar.baz".split(".") => [ 'foo-moo', 'bar', 'baz' ]
// "foo.bar.baz".split(".") => [ 'foo', 'bar', 'baz' ]

/*
[{
"dev.config.ram": "8 gb",
"regular": "foo"
}]
*/

export default {
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
      admins: [
        ['Management', 'mdi-account-multiple-outline'],
        ['Settings', 'mdi-cog-outline']
      ],
      cruds: [
        ['Create', 'mdi-plus-outline'],
        ['Read', 'mdi-file-outline'],
        ['Update', 'mdi-update'],
        ['Delete', 'mdi-delete']
      ],
      expanded: [],
      singleExpand: false,
      dessertHeaders: [
        {
          text: 'Name',
          align: 'start',
          sortable: true,
          value: 'name'
        },
        {
          text: '',
          value: 'actions',
          align: 'right',
          sortable: false
        }
      ],
      desserts: [
        {
          name: 'one'
        },
        {
          name: 'two'
        }
      ]
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

      // return null
    },
    queryData2() {
      return null
    }
  }
}
</script>

<template>
  <div>
    <v-card elevation="2" tile class="mx-auto mt-10">
      <v-card-text class="pa-0">
        <v-treeview :items="queryData" hoverable></v-treeview>
      </v-card-text>
    </v-card>
    <v-card class="mt-10"> </v-card>

    <!-- <v-card tile class="mx-auto mt-10">
      <v-card-text class="pa-0">
        <v-data-table
          fixed-header
          :headers="dessertHeaders"
          :items="desserts"
          sort-by="name"
          show-expand
          class="elevation-2 rounded-0 truncate-table"
        >
          <template #item.actions>
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn text fab x-small color="primary" v-on="on">
                  <v-icon>edit</v-icon>
                </v-btn>
              </template>
              Modify secret
            </v-tooltip>
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn text fab x-small color="error" v-on="on">
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
              Delete secret
            </v-tooltip>
          </template>

          <template v-slot:expanded-item="{ headers, item }">
            <td :colspan="headers.length"> More info about {{ item.name }} </td>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card> -->
  </div>
</template>
