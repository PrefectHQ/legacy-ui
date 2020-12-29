<script>
import debounce from 'lodash.throttle'
import moment from 'moment-timezone'
import { mapGetters, mapMutations } from 'vuex'
import TeamSwitcher from '@/components/Nav/TeamSwitcher'
import Tree from '@/components/Tree/Tree'

const UI_DEPLOY_TIMESTAMP = process.env.VUE_APP_RELEASE_TIMESTAMP

export default {
  components: {
    TeamSwitcher,
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
    ...mapGetters('api', [
      'isServer',
      'isCloud',
      'version',
      'releaseTimestamp',
      'coreVersion'
    ]),
    ...mapGetters('sideNav', ['isOpen']),
    ...mapGetters('data', [
      'flows',
      'activeFlowId',
      'projects',
      'activeProjectId',
      'tasks',
      'activeTaskId'
    ]),
    ...mapGetters('tenant', ['tenant']),
    activeIds() {
      return [
        this.activeFlowId,
        this.activeProjectId,
        this.activeTaskId
      ].filter(id => !!id)
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
    },
    lastDeployment_Cloud() {
      return this.releaseTimestamp
        ? moment(this.releaseTimestamp).format('MMM D [•] h:mmA')
        : 'Unknown'
    },
    lastDeployment_UI() {
      return moment(UI_DEPLOY_TIMESTAMP).format('MMM D [•] h:mmA')
    },
    navLogo() {
      return require(`@/assets/logos/${
        this.isCloud ? 'cloud' : 'core'
      }-side-nav-logo.svg`)
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
          this.$refs['drawer'].focus()
        }, 250)
      }
    },
    projects() {
      this.updateItems()
    }
  },
  mounted() {
    // Adds the event listener for the t search shortcut
    window.addEventListener('keyup', this.handleKeyboardShortcut)

    this.updateItems()
  },
  beforeDestroy() {
    // Removes the t search shortcut event listener when
    // the component is destroyed
    window.removeEventListener('keyup', this.handleKeyboardShortcut)

    clearTimeout(this.activateTimeout)
  },
  methods: {
    ...mapMutations('sideNav', ['close', 'open']),
    ...mapMutations('data', ['addTasks']),
    closeAll() {
      this.$refs['tree'].close()
    },
    handleKeyboardShortcut(e) {
      if (
        e?.key === 't' &&
        e?.srcElement?.tagName !== 'INPUT' &&
        e?.srcElement?.tagName !== 'TEXTAREA'
      ) {
        this.isOpen ? this.close() : this.open()
      }
    },
    handleSelect: debounce(
      function() {
        // We can do something when an item is selected
        // but routing is handled with the link attribute
        // requestAnimationFrame(() => {
        //   let id = val.id
        //   if (val.type == 'flow') {
        //     id = this.flows.find(f => f.id == val.id).flow_group_id
        //   }
        //   this.$router.push({
        //     name: val.type,
        //     params: {
        //       id: id,
        //       tenant: this.tenant.slug
        //     }
        //   })
        // })
      },
      1500,
      { leading: true, trailing: true }
    ),
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
            idToMatch: t.id,
            link: {
              name: 'task',
              params: { id: t.id, tenant: this.tenant.slug }
            },
            name: t.name,
            icon: this.types['task'],
            type: 'task'
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
              idToMatch: project.id,
              icon: this.types['project'],
              iconActive: this.types['projectActive'],
              link: {
                name: 'project',
                params: { id: project.id, tenant: this.tenant.slug }
              },
              name: project.name,
              type: 'project',
              children: [
                ...(this.flows ?? [])
                  ?.filter(f => f.project_id == project.id)
                  .map(f => {
                    return {
                      id: f.id,
                      idToMatch: f.flow_group_id,
                      children: this.loadTasks, // These are loaded async
                      link: {
                        name: 'flow',
                        params: {
                          id: f.flow_group_id,
                          tenant: this.tenant.slug
                        }
                      },
                      name: f.name,
                      icon: this.types['flow'],
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
  <div>
    <v-navigation-drawer
      v-model="model"
      temporary
      hide-overlay
      fixed
      disable-route-watcher
      width="375"
      class="drawer pb-1"
    >
      <div
        class="d-flex flex-column"
        style="
        height: 100%;
        width: 100%;"
      >
        <TeamSwitcher />

        <div
          ref="drawer"
          class="focusable flex-grow-0 flex-shrink-0"
          tabindex="-1"
        >
          <v-subheader>
            Projects
            <v-divider class="ml-4 mr-2" />

            <div
              v-ripple
              class="cursor-pointer px-2 py-1 caption font-weight-light collapse-button"
              @click="closeAll"
            >
              Collapse
            </div>
          </v-subheader>

          <v-container fluid class="tree-view">
            <tree
              ref="tree"
              class="px-4"
              :active-ids="activeIds"
              :items="items"
              :options="{
                noData: { 0: 'no projects', 1: 'no flows', 2: 'no tasks' },
                activateButton: { 0: 'Visit', 1: 'Visit', 2: false }
              }"
              @select="handleSelect"
            />
          </v-container>
        </div>

        <div class="flex-grow-1 flex-shrink-0">
          <div class="text-caption">
            <span>{{ lastDeployment_UI }}</span>
            <span>{{ lastDeployment_Cloud }}</span>
            <span>{{ coreVersion }}</span>
          </div>

          <v-img
            max-height="100"
            width="80%"
            contain
            position="center center"
            class="mx-auto"
            :src="navLogo"
            alt="Prefect Logo"
          />
        </div>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<style lang="scss" scoped>
.drawer {
  height: calc(100vh - 64px) !important;
  overflow: auto;
  top: 64px !important;

  .focusable {
    /* stylelint-disable-next-line */
    &:focus {
      // This allows us to auto-focus the nav drawer but not show the outline
      outline: none;
    }
  }

  .tree-view {
    max-height: calc(100vh - 64px - 145px - 48px - 125px);
    overflow: scroll;
  }
}

.collapse-button {
  letter-spacing: 1px !important;

  &:focus,
  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }
}
</style>
