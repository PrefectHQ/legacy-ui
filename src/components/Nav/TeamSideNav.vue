<script>
import { mapGetters, mapMutations } from 'vuex'
import Tree from '@/components/Tree/Tree'

export default {
  components: {
    Tree
  },
  data() {
    return {
      activateTimeout: null,
      items: [],
      types: {
        project: 'folder',
        projectActive: 'pi-project',
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
    isOpen(val) {
      if (val) {
        clearTimeout(this.activateTimeout)
        this.activateTimeout = setTimeout(() => {
          console.log(this.$refs['drawer'])
          this.$refs['drawer'].focus()
        }, 250)
      }
    },
    projects() {
      this.updateItems()
    }
  },
  mounted() {
    this.updateItems()
  },
  beforeDestroy() {
    clearTimeout(this.activateTimeout)
  },
  methods: {
    ...mapMutations('sideNav', ['close']),
    ...mapMutations('task', ['addTasks', 'removeFlowTasks']),
    handleSelect(val) {
      console.log(val)
    },
    async loadTasks(item) {
      const { data } = await this.$apollo.query({
        query: require('@/graphql/Nav/tasks.gql'),
        variables: {
          flowId: item.id
        }
      })

      this.addTasks(data.task)

      const sortedTasks = data.task
        .map(t => {
          return {
            id: t.id,
            name: t.name,
            icon: this.types['task']
          }
        })
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            ignorePunctuation: true
          })
        )
      return sortedTasks
    },
    updateItems() {
      this.items = [
        ...(this.projects ?? [])
          .map(project => {
            const val = {
              id: project.id,
              name: project.name,
              icon: this.types['project'],
              iconActive: this.types['projectActive'],
              children: [
                ...(this.flows ?? [])
                  ?.filter(f => f.project_id == project.id)
                  .map(f => {
                    return {
                      id: f.id,
                      name: f.name,
                      children: this.loadTasks, // These are loaded async
                      icon: this.types['flow']
                    }
                  })
                  .sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, {
                      ignorePunctuation: true
                    })
                  )
              ]
            }
            return val
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
    <div ref="drawer" class="focusable" tabindex="-1">
      <v-subheader>
        Projects
        <v-divider class="mx-4" />
      </v-subheader>

      <tree
        class="px-4"
        :active-ids="[]"
        :items="items"
        :options="{
          noData: { 0: 'no projects', 1: 'no flows', 2: 'no tasks' },
          activateButton: { 0: 'Visit', 1: 'Visit', 2: false }
        }"
      />
    </div>
  </v-navigation-drawer>
</template>

<style lang="scss" scoped>
.drawer {
  height: calc(100vh - 64px);
  padding: 8px 0;

  .focusable {
    /* stylelint-disable-next-line */
    &:focus {
      // This allows us to auto-focus the nav drawer but not show the outline
      outline: none;
    }
  }
}

.logo {
  height: 38px;
  width: 24px;
}
</style>
