<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  data() {
    return {
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
    items() {
      return [
        ...this.projects
          ?.map(project => {
            return {
              id: project.id,
              name: project.name,
              type: 'project',
              children: [
                ...this.flows
                  ?.filter(f => f.project_id == project.id)
                  .map(f => {
                    return {
                      id: f.id,
                      name: f.name,
                      children: [], // We load these asyncronously using the callback from load-children,
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
    },
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
  methods: {
    ...mapMutations('sideNav', ['close'])
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
    <v-treeview :items="items" dense>
      <template #prepend="{ item, open }">
        <v-icon :color="open ? 'primaryDark' : 'grey'">
          {{ types[item.type] }}
        </v-icon>
      </template>
    </v-treeview>
  </v-navigation-drawer>
</template>

<style lang="scss" scoped>
.drawer {
  height: calc(100vh - 64px);
  padding-top: 64px;
}

.logo {
  height: 38px;
  width: 24px;
}
</style>
