<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  data() {
    return {
      items: [],
      types: {
        project: 'pi-project',
        flow: 'pi-flow',
        task: 'pi-task'
      }
    }
  },

  computed: {
    ...mapGetters('sideNav', ['isOpen']),
    ...mapGetters('flow', ['flows']),
    ...mapGetters('project', ['projects']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('task', ['tasks']),
    model: {
      get() {
        return this.isOpen
      },
      set(value) {
        if (value === false) {
          this.close()
        }
      }
    }
  },
  watch: {
    flows() {
      this.updateItems()
    },
    projects() {
      this.updateItems()
    }
  },
  mounted() {
    this.updateItems()
  },
  methods: {
    ...mapMutations('sideNav', ['close']),
    ...mapMutations('task', ['addTasks']),
    handleSelect(val) {
      console.log(val)
    },
    async loadTasks(item) {
      if (item.type !== 'flow') return
      const { data } = await this.$apollo.query({
        query: require('@/graphql/Nav/tasks.gql'),
        variables: {
          flowId: item.id
        }
      })

      this.addTasks(data.task)

      this.updateItems()
    },
    updateItems() {
      this.items = [
        ...(this.projects ?? [])
          .map(project => {
            return {
              id: project.id,
              name: project.name,
              type: 'project',
              children: [
                ...(this.flows ?? [])
                  ?.filter(f => f.project_id == project.id)
                  .map(f => {
                    return {
                      id: f.id,
                      name: f.name,
                      children: (this.tasks ?? [])
                        ?.filter(t => t.flow_id == f.id)
                        .map(t => {
                          return {
                            id: t.id,
                            name: t.name,
                            type: 'task'
                          }
                        })
                        .sort((a, b) =>
                          a.name.localeCompare(b.name, undefined, {
                            ignorePunctuation: true
                          })
                        ), // We load these asyncronously using the callback from load-children,
                      type: 'flow'
                    }
                  })
                  .sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, {
                      ignorePunctuation: true
                    })
                  )
              ]
            }
          })
          .sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { ignorePunctuation: true })
          )
      ]
    }
  }
}
</script>

<template>
  <v-navigation-drawer
    v-model="model"
    temporary
    hide-overlay
    absolute
    elevation="0"
    width="375"
    class="drawer"
  >
    <v-treeview
      :items="items"
      dense
      activatable
      open-on-click
      :load-children="loadTasks"
      @update:active="handleSelect"
    >
      <template #prepend="{ item, open }">
        <v-icon :color="open ? 'primaryDark' : 'grey'">
          {{ types[item.type] }}
        </v-icon>
      </template>
    </v-treeview>
  </v-navigation-drawer>
</template>

<style lang="scss" scoped>
// $treeview-node-padding: 4px !important !default;
// $treeview-node-margin: 2px !important !default;
// $treeview-node-level-width: 10px !important;

.drawer {
  height: calc(100vh - 64px);
  padding: 8px 0;
}

.logo {
  height: 38px;
  width: 24px;
}
</style>
