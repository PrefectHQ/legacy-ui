<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  props: {
    complete: {
      required: true,
      type: Boolean
    }
  },
  data() {
    return {
      // These are the rules for the form. A project name: must have a name,
      // name must be less than 50 characters, name can't already be in use
      nameRules: [
        v => !!v || 'Name is required',
        v => (v && v.length <= 50) || 'Name must be less than 50 characters',
        v => {
          if (this.projectNames && this.projectNames.length) {
            if (this.projectNames.includes(v))
              return 'That project name is already taken.'
          }
          return true
        }
      ],
      projects: null,
      projectId: null,
      selectedProjectId: null,
      selectedProject: null,
      projectName: null,
      projectDescription: null,
      valid: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    // helps us check for an existing project name
    projectNames() {
      if (!this.projects) return
      return this.projects.map(project => project.name)
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    async handleProjectFormSubmit() {
      // if the form is invalid, do nothing
      if (!this.valid) return

      try {
        const result = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-project.gql'),
          variables: {
            name: this.projectName,
            description: this.projectDescription,
            tenantId: this.tenant.id
          }
        })
        // extract the project id
        this.projectId = result.data.create_project.id
        // emit the result of the step to the parent
        this.$emit('project-submitted', {
          projectId: this.projectId,
          projectName: this.projectName
        })
        this.$refs.form.reset()
      } catch (error) {
        // if project name already exists
        if (error.message === 'GraphQL error: Uniqueness violation.') {
          this.setAlert({
            alertShow: true,
            alertMessage:
              'A project with this name already exists. Please try a different name.',
            alertType: 'error'
          })
        } else {
          this.setAlert({
            alertShow: true,
            alertMessage:
              'Failed to create project. Please wait a few moments and try again',
            alertType: 'error'
          })
        }

        throw error
      }
    },
    handleProjectSelect(projectId) {
      this.selectedProject = this.projects.find(p => p.id == projectId)
    },
    handleProjectSubmit() {
      this.$emit('project-submitted', {
        projectId: this.selectedProject.id,
        projectName: this.selectedProject.name
      })
    },
    onIntersect([entry]) {
      this.$apollo.queries.projects.skip = !entry.isIntersecting
    }
  },
  apollo: {
    projects: {
      query: require('@/graphql/FirstRunWorkflow/project-names.gql'),
      pollInterval: 5000,
      update: data => {
        data.project.unshift({
          id: 'new-project',
          name: 'New Project'
        })
        return data.project
      }
    }
  }
}
</script>

<template>
  <v-container v-intersect="{ handler: onIntersect }">
    <v-row>
      <v-col cols="12" class="auto pa-0">
        <p>
          Projects are used to organize flows that have been deployed to Prefect
          Cloud.
        </p>
        <p>
          Every time you deploy a flow, you will need to specify a project to
          deploy into. There are no limits on the number of projects you can
          have, and you can always delete projects later. You can read more
          about interacting with projects
          <a
            href="https://docs.prefect.io/cloud/concepts/projects.html"
            target="_blank"
            >here</a
          >.
        </p>
      </v-col>
      <v-col cols="12" md="6" xl="4" class="auto pa-0">
        <v-select
          data-public
          v-model="selectedProjectId"
          :items="projects"
          class="mb-5"
          item-value="id"
          item-text="name"
          label="Select project"
          hide-details
          single-line
          prepend-inner-icon="pi-project"
          :menu-props="{ contentClass: 'custom-list-item' }"
          @change="handleProjectSelect"
        />

        <v-form
          v-if="selectedProjectId == 'new-project'"
          ref="form"
          v-model="valid"
          @submit="handleProjectFormSubmit"
        >
          <v-text-field
            v-model="projectName"
            :counter="50"
            :rules="nameRules"
            label="Name"
            required
            @keydown.enter="handleProjectFormSubmit"
          />

          <v-text-field
            v-model="projectDescription"
            label="Description (optional)"
            @keydown.enter="handleProjectFormSubmit"
          />

          <v-btn
            v-disable-read-only-user="!valid || !!projectId || complete"
            color="primary"
            class="mt-6"
            @click="handleProjectFormSubmit"
          >
            Submit
          </v-btn>
        </v-form>

        <v-btn
          v-else
          :disabled="!selectedProject"
          color="primary"
          class="mt-6"
          @click="handleProjectSubmit"
        >
          Next
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
/* stylelint-disable */
.custom-list-item .v-list-item:first-child .v-list-item__title {
  color: var(--v-primary-base);
  font-weight: 500;
}
/* stylelint-enable */
</style>
