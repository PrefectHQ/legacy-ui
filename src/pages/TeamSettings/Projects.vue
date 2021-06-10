<script>
import gql from 'graphql-tag'
import LogRocket from 'logrocket'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'
import Alert from '@/components/Alert'
import ConfirmDialog from '@/components/ConfirmDialog'
import ExternalLink from '@/components/ExternalLink'
import ManagementLayout from '@/layouts/ManagementLayout'
export default {
  components: {
    Alert,
    ConfirmDialog,
    ExternalLink,
    ManagementLayout
  },
  mixins: [formatTime],
  data() {
    return {
      // Alert data
      alertShow: false,
      alertMessage: '',
      alertType: null,

      // Loading states
      isLoadingTable: true,
      isCreatingProject: false,
      isModifyingProject: false,
      isRemovingProject: false,

      // Dialogs
      dialogCreateProject: false,
      dialogModifyProject: false,
      dialogRemoveProject: false,

      // Store copied project ID
      // Useful to render feedback that copy was successful
      copiedProjectId: null,

      // Timeout for copy action
      copyTimeout: null,

      // Table headers
      headers: [
        {
          mobile: true,
          text: 'Name',
          value: 'name',
          width: '15%'
        },
        {
          mobile: true,
          text: 'Description',
          value: 'description',
          align: 'left',
          width: '20%'
        },
        {
          mobile: true,
          text: 'Flows',
          value: 'active_flow_count.aggregate.count',
          align: 'left',
          width: '15%'
        },
        {
          mobile: false,
          text: 'Created',
          value: 'created',
          align: 'left',
          width: '20%'
        },
        {
          mobile: false,
          text: 'Project ID',
          value: 'id',
          align: 'center',
          width: '15%'
        },
        {
          mobile: true,
          text: '',
          value: 'actions',
          align: 'end',
          sortable: false,
          width: '10%'
        }
      ],

      // Forms
      createFormValid: true,
      modifyFormValid: true,

      // Inputs
      searchInput: null,
      moveToProjectInput: null,
      projectNameInput: null,
      projectDescriptionInput: null,

      // Input error messages
      projectNameErrors: [],

      // Input icons
      showNameInputIcon: false,

      // Project selected for modification or deletion
      selectedProject: null,

      // default sorting
      sortBy: 'name',
      sortDesc: false
    }
  },
  computed: {
    ...mapGetters('license', ['hasPermission']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['user', 'timezone']),
    // Surface table headers based on viewport (mobile vs. desktop)
    headersByViewport() {
      return this.$vuetify.breakpoint.mdAndUp
        ? this.headers
        : this.headers.filter(header => header.mobile)
    },
    isReadOnlyUser() {
      return !this.isTenantAdmin
    },
    isTenantAdmin() {
      return (
        this.hasPermission('create', 'project') &&
        this.hasPermission('update', 'project') &&
        this.hasPermission('delete', 'project')
      )
    },
    // If the user decides to move flows to a new project before deletion,
    // provide a list of candidate projects to take these flows
    moveToProjectDropdownItems() {
      if (!this.projects) return []

      return (
        this.projects
          // Exclude the currently-selected project
          .filter(project => {
            if (!this.selectedProject) return true
            return this.selectedProject.id !== project.id
          })
          // Transform into objects with properties "text" and "value",
          // as required by v-autocomplete.
          .map(project => ({
            text: project.name,
            value: Object.assign({}, project)
          }))
          // Sort alphabetically
          .sort((p1, p2) =>
            p1.text.toLowerCase() < p2.text.toLowerCase() ? -1 : 1
          )
      )
    },
    // Dynamic mutation to move flows to a new project
    moveProjectFlowsMutation() {
      if (!this.projectFlows || !this.moveToProjectInput) return ''

      const updateProjects = this.projectFlows.map((flow, i) => {
        return `updateFlowProject${i}: updateFlowProject(
          input: { projectId: "${this.moveToProjectInput.id}", flowId: "${flow.id}" }
        ) {
          id
        }`
      })

      return gql`
        mutation {
          ${updateProjects}
        }
      `
    },
    // Warn users about the number of active & archived flow counts before project deletion
    displayFlowCountMessage() {
      if (
        this.selectedProject.activeFlowCount > 0 &&
        this.selectedProject.archivedFlowCount > 0
      ) {
        return `This project has ${
          this.selectedProject.activeFlowCount
        } active ${this.pluralize(
          this.selectedProject.activeFlowCount,
          'flow'
        )} and ${
          this.selectedProject.archivedFlowCount
        } archived ${this.pluralize(
          this.selectedProject.archivedFlowCount,
          'flow'
        )}`
      } else if (this.selectedProject.activeFlowCount > 0) {
        return `This project has ${
          this.selectedProject.activeFlowCount
        } active ${this.pluralize(
          this.selectedProject.activeFlowCount,
          'flow'
        )}`
      } else {
        return `This project has ${
          this.selectedProject.archivedFlowCount
        } archived ${this.pluralize(
          this.selectedProject.archivedFlowCount,
          'flow'
        )}`
      }
    }
  },
  watch: {
    tenant() {
      this.$apollo.queries.projects.refetch()
    }
  },
  methods: {
    closeProjectDialog() {
      this.selectedProject = null
      setTimeout(() => {
        this.projectNameErrors = []
        this.projectNameInput = null
        this.projectDescriptionInput = null

        this.moveToProjectInput = null
      }, 200)
    },
    async checkProjectName() {
      // Check for presence
      if (!this.projectNameInput) {
        this.projectNameErrors = ['This field is required.']
        this.showNameInputIcon = true
        return
      }

      // Check if project is being modified and its name hasn't changed
      if (
        this.selectedProject &&
        this.selectedProject.name === this.projectNameInput
      ) {
        this.showNameInputIcon = true
        return
      }

      // Check project name for uniqueness
      const projectsWithName = await this.$apollo.query({
        query: require('@/graphql/TeamSettings/project.gql'),
        variables: {
          projectName: this.projectNameInput
        },
        fetchPolicy: 'no-cache'
      })
      if (projectsWithName?.errors) {
        this.handleAlert(
          'error',
          'Something went wrong while trying to check this project name. Please try again.'
        )
      } else if (projectsWithName?.data?.project?.length > 0) {
        this.projectNameErrors = [
          'This project name is already in use. Please enter a different name.'
        ]
        this.showNameInputIcon = true
      } else {
        this.showNameInputIcon = true
      }
    },
    copyTextToClipboard(id) {
      clearTimeout(this.copyTimeout)

      this.copiedProjectId = id
      navigator.clipboard.writeText(id)

      this.copyTimeout = setTimeout(() => {
        this.copiedProjectId = null
      }, 3000)
    },
    async createProject() {
      this.isCreatingProject = true

      await this.checkProjectName()

      if (this.projectNameErrors.length > 0) {
        this.isCreatingProject = false
        return
      }

      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-project.gql'),
          variables: {
            name: this.projectNameInput,
            description: this.projectDescriptionInput,
            tenantId: this.tenant.id
          }
        })

        this.$apollo.queries.projects.refetch()

        this.handleAlert(
          'success',
          'Your project has been successfully created.'
        )
      } catch (e) {
        this.handleAlert(
          'error',
          'Something went wrong while trying to create your project. Please try again.'
        )
      }

      this.isCreatingProject = false
      this.dialogCreateProject = false
    },
    handleAlert(type, message) {
      this.alertType = type
      this.alertMessage = message
      this.alertShow = true
    },
    async modifyProject() {
      this.isModifyingProject = true

      await this.checkProjectName()

      if (this.projectNameErrors.length > 0) {
        this.isModifyingProject = false
        return
      }

      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/TeamSettings/modify-project.gql'),
          variables: {
            projectId: this.selectedProject.id,
            projectName: this.projectNameInput,
            projectDescription: this.projectDescriptionInput
          }
        })

        this.$apollo.queries.projects.refetch()
        this.handleAlert(
          'success',
          'Your project has been successfully updated.'
        )
      } catch (e) {
        this.handleAlert(
          'error',
          'Something went wrong while trying to modify this project. Please try again.'
        )
      }

      this.isModifyingProject = false
      this.dialogModifyProject = false
    },
    // Hand off a project's flows to a new project before deletion
    async moveProjectsFlows() {
      try {
        // Fetch flows for the project that is about to be deleted.
        await this.$apollo.queries.projectFlows.refetch()

        // If projectFlows did not update, something went wrong.
        if (!this.projectFlows) {
          throw new Error('Failed to fetch project flows')
        }

        // Do nothing if the project has no flows.
        if (this.projectFlows.length === 0) return true

        // Execute a mutation that moves all of the almost-deleted project's flows.
        await this.$apollo.mutate({
          mutation: this.moveProjectFlowsMutation
        })

        return true
      } catch (err) {
        this.handleAlert(
          'error',
          'Something went wrong while trying to move your flows to a new project. Please try again.'
        )

        this.isRemovingProject = false
        this.dialogRemoveProject = false

        LogRocket.captureException(err)
        return false
      }
    },
    pluralize(count, word) {
      if (count === 1) return word
      return `${word}s`
    },
    async removeProject() {
      this.isRemovingProject = true

      // Move project's flow's to new project, if a new project was specified by the user
      if (this.moveToProjectInput) {
        const flowsMoved = await this.moveProjectsFlows()

        // Stop execution if project-to-project flow handoff failed for any reason
        if (!flowsMoved) return
      }

      try {
        // Proceed with deleting the project
        await this.$apollo.mutate({
          mutation: require('@/graphql/TeamSettings/delete-project.gql'),
          variables: {
            projectId: this.selectedProject.id
          }
        })

        this.$apollo.queries.projects.refetch()
        this.handleAlert('success', 'The project has been successfuly deleted.')
      } catch (e) {
        this.handleAlert(
          'error',
          'Something went wrong while trying to delete this project. Please try again.'
        )
      }

      this.dialogRemoveProject = false
      this.isRemovingProject = false
    },
    selectProject(project) {
      this.selectedProject = project
      this.selectedProject.activeFlowCount = this.selectedProject.active_flow_count.aggregate.count
      this.selectedProject.archivedFlowCount = this.selectedProject.archived_flow_count.aggregate.count

      this.projectNameInput = project.name
      this.projectDescriptionInput = project.description
    }
  },
  apollo: {
    projectFlows: {
      query: require('@/graphql/Project/flow-ids.gql'),
      variables() {
        return {
          projectId: this.selectedProject ? this.selectedProject.id : null
        }
      },
      skip() {
        return !this.selectedProject
      },
      update: data => {
        return (data && data.project_by_pk && data.project_by_pk.flows) || null
      }
    },
    projects: {
      query: require('@/graphql/TeamSettings/projects.gql'),
      result({ data }) {
        this.isLoadingTable = false
        if (!data) return
        return data.projects
      },
      error() {
        this.handleAlert(
          'error',
          'Something went wrong while trying to fetch your projects. Please try again later.'
        )
      },
      fetchPolicy: 'no-cache'
    }
  }
}
</script>

<template>
  <ManagementLayout :show="!isLoadingTable" control-show>
    <template #title>Projects</template>

    <template #subtitle>
      <span v-if="isTenantAdmin">
        View and manage your team's
        <ExternalLink
          href="https://docs.prefect.io/cloud/concepts/projects.html#projects"
          >projects</ExternalLink
        >
      </span>
      <span v-else
        >View the
        <ExternalLink
          href="https://docs.prefect.io/cloud/concepts/projects.html#projects"
          >projects</ExternalLink
        >
        of {{ tenant.name }}</span
      >
    </template>

    <template v-if="!isReadOnlyUser" #cta>
      <v-btn
        color="primary"
        class="white--text"
        large
        @click="
          selectedProject = null
          dialogCreateProject = true
          projectNameInput = ''
          projectDescriptionInput = ''
        "
      >
        <v-icon left>
          view_carousel
        </v-icon>
        Add Project
      </v-btn>
    </template>

    <v-text-field
      v-if="!$vuetify.breakpoint.mdAndUp"
      v-model="searchInput"
      class="rounded-0 elevation-1 mb-1"
      solo
      dense
      hide-details
      single-line
      placeholder="Search by project ID, name, or description"
      prepend-inner-icon="search"
      autocomplete="new-password"
    ></v-text-field>

    <v-card tile>
      <v-card-text class="pa-0">
        <div v-if="$vuetify.breakpoint.mdAndUp" class="py-1 mr-2 flex">
          <v-text-field
            v-model="searchInput"
            class="rounded-0 elevation-1"
            solo
            dense
            hide-details
            single-line
            placeholder="Search by project ID, name, or description"
            prepend-inner-icon="search"
            autocomplete="new-password"
            :style="{
              'max-width': $vuetify.breakpoint.mdAndUp ? '360px' : null
            }"
          ></v-text-field>
        </div>

        <!-- PROJECTS TABLE -->
        <v-data-table
          fixed-header
          :headers="headersByViewport"
          :header-props="{ 'sort-icon': 'arrow_drop_up' }"
          :search="searchInput"
          :items="projects"
          :items-per-page="10"
          :sort-by.sync="sortBy"
          :sort-desc.sync="sortDesc"
          class="elevation-2 rounded-0 truncate-table"
          :class="{ 'fixed-table': $vuetify.breakpoint.smAndUp }"
          :footer-props="{
            showFirstLastPage: true,
            itemsPerPageOptions: [10, 15, 20, -1],
            firstIcon: 'first_page',
            lastIcon: 'last_page',
            prevIcon: 'keyboard_arrow_left',
            nextIcon: 'keyboard_arrow_right'
          }"
          no-results-text="No projects found. Try expanding your search?"
          no-data-text="This team does not have any projects yet."
        >
          <!-- HEADERS -->
          <template #header.name="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.description="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.active_flow_count.aggregate.count="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.created="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>
          <template #header.id="{ header }">
            <span class="text-subtitle-2">{{ header.text }}</span>
          </template>

          <!-- PROJECT ID-->
          <template #item.id="{ item }">
            <v-tooltip top>
              <template #activator="{ on }">
                <div
                  class="cursor-pointer text-truncate"
                  v-on="on"
                  @click="copyTextToClipboard(item.id)"
                >
                  {{ item.id }}
                </div>
              </template>
              <span>{{
                copiedProjectId === item.id ? 'Copied!' : 'Click to copy ID'
              }}</span>
            </v-tooltip>
          </template>

          <!-- PROJECT NAME -->
          <template #item.name="{ item }">
            <v-tooltip v-if="item.name" top>
              <template #activator="{ on }">
                <div class="hidewidth" v-on="on">
                  <router-link
                    :to="{
                      name: 'project',
                      params: {
                        id: item.id,
                        tenant: tenant.slug
                      }
                    }"
                  >
                    {{ item.name }}
                  </router-link>
                </div>
              </template>
              <span>{{ item.name }}</span>
            </v-tooltip>
            <span v-else>-</span>
          </template>

          <!-- PROJECT CREATION DATETIME -->
          <template #item.created="{ item }">
            <v-tooltip v-if="item.created" top>
              <template #activator="{ on }">
                <div class="hidewidth" v-on="on">
                  {{ formDate(item.created) }}
                </div>
              </template>
              <span>{{ formatDateTime(item.created) }}</span>
            </v-tooltip>
            <span v-else>-</span>
          </template>

          <!-- PROJECT DESCRIPTION -->
          <template #item.description="{ item }">
            <v-tooltip v-if="item.description" top>
              <template #activator="{ on }">
                <div class="hidewidth" v-on="on">
                  {{ item.description }}
                </div>
              </template>
              <span>{{ item.description }}</span>
            </v-tooltip>
            <span v-else>-</span>
          </template>

          <!-- PROJECT ACTIONS -->
          <template v-if="isTenantAdmin" #item.actions="{ item }">
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  text
                  fab
                  x-small
                  color="primary"
                  v-on="on"
                  @click="
                    selectProject(item)
                    dialogModifyProject = true
                  "
                >
                  <v-icon>edit</v-icon>
                </v-btn>
              </template>
              Modify this project
            </v-tooltip>
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn
                  text
                  fab
                  x-small
                  color="error"
                  v-on="on"
                  @click="
                    selectProject(item)
                    dialogRemoveProject = true
                  "
                >
                  <v-icon>delete</v-icon>
                </v-btn>
              </template>
              Delete this project
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- CREATE PROJECT  -->
    <ConfirmDialog
      v-model="dialogCreateProject"
      :dialog-props="{ 'max-width': '600' }"
      :disabled="isCreatingProject || !createFormValid"
      :loading="isCreatingProject"
      title="Create a new project"
      confirm-text="Create"
      @cancel="closeProjectDialog"
      @confirm="createProject"
    >
      <v-form v-model="createFormValid">
        <v-text-field
          v-model="projectNameInput"
          autofocus
          label="Project Name"
          counter
          maxlength="30"
          :error-messages="projectNameErrors"
          validate-on-blur
          outlined
          dense
          @focus="
            projectNameErrors = []
            showNameInputIcon = false
          "
          @blur="checkProjectName"
        >
          <v-icon
            v-if="showNameInputIcon && projectNameErrors.length === 0"
            slot="append"
            class="green--text"
          >
            check
          </v-icon>
          <v-icon
            v-if="showNameInputIcon && projectNameErrors.length > 0"
            slot="append"
            class="red--text"
          >
            clear
          </v-icon>
        </v-text-field>
        <v-text-field
          v-model="projectDescriptionInput"
          class="mt-3"
          label="Project Description"
          counter
          outlined
          dense
          maxlength="180"
        >
        </v-text-field>
      </v-form>
    </ConfirmDialog>

    <!-- MODIFY PROJECT -->
    <ConfirmDialog
      v-if="selectedProject"
      v-model="dialogModifyProject"
      :dialog-props="{ 'max-width': '600' }"
      :disabled="isModifyingProject || !modifyFormValid"
      :loading="isModifyingProject"
      :title="`Modify the project ${selectedProject.name}`"
      confirm-text="Save"
      @cancel="closeProjectDialog"
      @confirm="modifyProject"
    >
      <v-form v-model="modifyFormValid">
        <v-text-field
          v-model="projectNameInput"
          autofocus
          label="Project Name"
          counter
          maxlength="30"
          :error-messages="projectNameErrors"
          validate-on-blur
          outlined
          dense
          @focus="
            projectNameErrors = []
            showNameInputIcon = false
          "
          @blur="checkProjectName"
        >
          <v-icon
            v-if="showNameInputIcon && projectNameErrors.length === 0"
            slot="append"
            class="green--text"
          >
            check
          </v-icon>
          <v-icon
            v-if="showNameInputIcon && projectNameErrors.length > 0"
            slot="append"
            class="red--text"
          >
            clear
          </v-icon>
        </v-text-field>
        <v-text-field
          v-model="projectDescriptionInput"
          class="mt-3"
          label="Project Description"
          counter
          maxlength="180"
          outlined
          dense
        >
        </v-text-field>
      </v-form>
    </ConfirmDialog>

    <!-- DELETE PROJECT -->
    <ConfirmDialog
      v-if="selectedProject"
      v-model="dialogRemoveProject"
      type="error"
      :dialog-props="{ 'max-width': '600' }"
      :disabled="isRemovingProject"
      :loading="isRemovingProject"
      :title="`Are you sure you want to delete ${selectedProject.name}?`"
      @cancel="closeProjectDialog"
      @confirm="removeProject"
    >
      <template
        v-if="
          selectedProject.activeFlowCount || selectedProject.archivedFlowCount
        "
      >
        <p class="mb-6">
          {{ displayFlowCountMessage }}. If you would like to preserve these
          flows, you can move them into a new project now.
        </p>

        <v-autocomplete
          v-model="moveToProjectInput"
          :items="moveToProjectDropdownItems"
          :menu-props="{
            'offset-y': true,
            transition: 'slide-y-transition'
          }"
          outlined
          dense
          label="New Project"
          clearable
        ></v-autocomplete>

        <p v-if="moveToProjectInput" class="mb-0">
          Select CONFIRM to delete this project and move its flows to
          <strong>{{ moveToProjectInput.name }}</strong
          >.
        </p>

        <p v-else class="mb-0">
          If you choose to leave the "New project" field blank,
          <strong class="red--text">
            you will delete this project and all of its flows. This action
            cannot be undone.
          </strong>
        </p>
      </template>

      <template
        v-if="
          selectedProject.activeFlowCount === 0 &&
            selectedProject.archivedFlowCount === 0
        "
      >
        <p class="mb-2">
          This project has no flows and can be safely deleted.
        </p>
      </template>
    </ConfirmDialog>

    <Alert
      v-model="alertShow"
      :type="alertType"
      :message="alertMessage"
      :offset-x="$vuetify.breakpoint.mdAndUp ? 256 : 56"
    ></Alert>
  </ManagementLayout>
</template>

<style lang="scss" scoped>
.flex {
  display: flex;
  justify-content: flex-end;
}

.hidewidth {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
</style>
