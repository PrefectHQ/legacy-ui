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
    }
  }
}
</script>

<template>
  <div>
    <v-card elevation="2" tile class="mx-auto mt-10">
      <v-card-text class="pa-0">
        <v-treeview :items="queryData" hoverable>
          <!-- <template v-slot:append="{ item }">
            <v-icon>
              folder
            </v-icon>
          </template> -->
        </v-treeview>
      </v-card-text>
    </v-card>
  </div>
</template>
