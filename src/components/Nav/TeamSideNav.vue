<script>
import debounce from 'lodash/throttle'
import moment from 'moment-timezone'
import { mapGetters, mapMutations } from 'vuex'
import NewProjectDialog from '@/pages/Dashboard/NewProject-Dialog'
import TeamSwitcher from '@/components/Nav/TeamSwitcher'
import Tree from '@/components/Tree/Tree'

const UI_DEPLOY_TIMESTAMP = process.env.VUE_APP_RELEASE_TIMESTAMP

export default {
  components: {
    NewProjectDialog,
    TeamSwitcher,
    Tree
  },
  data() {
    return {
      activateTimeout: null,
      items: [],
      newProjectDialog: false,
      types: {
        project: 'folder',
        projectActive: 'pi-project',
        flow: 'pi-flow',
        task: 'pi-task'
      },
      flowsUnWatch: null,
      projectsUnWatch: null
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
    ...mapGetters('tenant', ['tenant', 'isLoadingTenant']),
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
    logoAlt() {
      return require(`@/assets/logos/${
        this.isCloud ? 'cloud' : 'core'
      }-logo-no-text.svg`)
    }
  },
  watch: {
    isOpen(val) {
      if (val) {
        clearTimeout(this.activateTimeout)
        this.activateTimeout = setTimeout(() => {
          this.$refs['drawer'].focus()
        }, 250)

        this.flowsUnWatch = this.$watch('flows', this.updateItems)
        this.projectsUnWatch = this.$watch('projects', this.updateItems)

        this.updateItems()
      } else {
        this.flowsUnWatch()
        this.projectsUnWatch()
      }
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
      if (e?.key === 'Escape' && this.isOpen) {
        this.close()
      }

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
          .filter(p => p.tenant_id == this.tenant.id)
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
        v-if="model"
        class="d-flex flex-column"
        style="
        height: 100%;
        width: 100%;"
      >
        <TeamSwitcher />

        <div class="mt-4 mb-2">
          <v-divider class="mx-10 mb-5" />

          <div v-if="projects" class="mx-4 d-flex justify-space-between">
            <div class="text-h5">Projects</div>

            <div
              v-if="projects.length > 0"
              v-ripple
              class="cursor-pointer px-2 py-2 text-caption font-weight-normal collapse-button rounded utilGrayMid--text"
              @click="closeAll"
            >
              Collapse All
            </div>
          </div>
        </div>

        <div
          ref="drawer"
          class="focusable tree-view flex-grow-1 flex-shrink-1"
          tabindex="-1"
        >
          <div class="pa-0 mx-4">
            <tree
              v-if="!isLoadingTenant && projects && projects.length > 0"
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

            <div
              v-else-if="!isLoadingTenant && projects && projects.length === 0"
            >
              <div class="text-subtitle-1">You have no projects</div>

              <v-btn
                depressed
                color="primaryDark"
                class="my-4"
                block
                dark
                @click="newProjectDialog = true"
              >
                <v-icon class="mr-2">folder</v-icon>
                New project
              </v-btn>
            </div>

            <v-progress-circular
              v-else
              indeterminate
              size="70"
              color="primaryDark"
              class="position-absolute"
              style="
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
              "
            />
          </div>
        </div>

        <div class="flex-grow-0 flex-shrink-0 mt-6 pb-6">
          <v-divider class="mx-10 mb-4" />

          <div class="text-caption d-flex align-end justify-space-between mx-8">
            <div
              v-if="lastDeployment_UI"
              class="text-right"
              style="width: 35%;"
            >
              <div class="utilGrayMid--text font-weight-light">
                UI Release
              </div>
              <div>{{ lastDeployment_UI }}</div>
            </div>
            <div class="flex-grow-1">
              <div v-show="coreVersion && isServer" class="text-center mb-2">
                <div class="utilGrayMid--text font-weight-light">
                  Core Version
                </div>
                <div>{{ coreVersion }}</div>
              </div>
              <v-img
                max-height="100"
                width="40px"
                contain
                position="center center"
                class="mx-auto"
                :src="logoAlt"
                alt="Prefect Logo"
              />
            </div>
            <div v-if="lastDeployment_Cloud" style="width: 35%;">
              <div class="utilGrayMid--text font-weight-light">
                API Release
              </div>
              <div>{{ lastDeployment_Cloud }}</div>
            </div>
          </div>
        </div>
      </div>
    </v-navigation-drawer>

    <NewProjectDialog :show.sync="newProjectDialog" />
  </div>
</template>

<style lang="scss" scoped>
.drawer {
  height: calc(100vh - 64px) !important;
  overflow: auto;
  top: 64px !important;

  @media screen and (max-width: 1264px) {
    height: calc(100vh - 104px) !important;
    top: 104px !important;
  }

  /* stylelint-disable */
  .focusable {
    &:focus {
      // This allows us to auto-focus the nav drawer but not show the outline
      outline: none;
    }
  }
  /* stylelint-enable */

  .tree-view {
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
