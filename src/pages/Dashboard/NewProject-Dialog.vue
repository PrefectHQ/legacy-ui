<script>
import { mapGetters, mapActions } from 'vuex'
import { clearCache } from '@/vue-apollo'

export default {
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      valid: true,
      projectName: '',
      projectDescription: null,
      nameRules: [
        v => (v && !!v.trim()) || 'Project name is required',
        v => !!v || 'Project name is required',
        v =>
          (v && v.length <= 50) ||
          'Project name must be less than 50 characters'
      ],
      projectSuccess: false,
      projectLoading: false,
      projectError: false,
      projectId: null,
      specificProjectErrorMessage: '',
      routing: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['role', 'tenant']),
    ...mapGetters('license', ['hasPermission']),
    permissionsCheck() {
      return !this.hasPermission('create', 'project')
    }
  },
  watch: {
    show() {
      if (this.$refs.form) {
        this.$refs.form.reset()
        this.projectName = ''
      }
    }
  },
  methods: {
    ...mapActions('data', ['activateProject']),
    async createProject() {
      this.projectLoading = true
      try {
        const { data, errors } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-project.gql'),
          variables: {
            name: this.projectName,
            description: this.projectDescription,
            tenantId: this.tenant.id
          },
          errorPolicy: 'all'
        })
        if (data?.create_project) {
          this.projectId = data.create_project.id
          this.projectSuccess = true
          this.projectLoading = false
          this.$globalApolloQueries['projects']?.refetch()
          //adding this here to make sure the dialog resets, even if a user clicks outside the box instead of going to the project (the persistent prop in vuetify is currently unreliable)
          setTimeout(() => (this.projectSuccess = false), 8000)
        } else if (errors) {
          if (errors[0].message === 'Uniqueness violation.') {
            this.specificProjectErrorMessage =
              'That project name already exists.  Please choose a new one.'
            this.projectLoading = false
            setTimeout(() => (this.specificProjectErrorMessage = ''), 3000)
          } else {
            this.projectError = true
            setTimeout(() => (this.projectError = false), 3000)
          }
        }
      } catch (error) {
        this.projectError = true
        setTimeout(() => (this.projectError = false), 3000)
        throw Error
      }
    },
    async goToProject() {
      clearCache()
      await this.activateProject(this.projectId)
      this.$emit('project-select', this.projectId)
      this.$router
        .push({
          name: 'project',
          params: { ...this.$route.params, id: this.projectId },
          query: { ...this.$route.query }
        })
        .catch(e => e)
      this.reset()
    },
    close() {
      this.$emit('close')
      this.reset()
    },
    reset() {
      this.$emit('update:show', false)
      this.projectName = ''
      this.projectSuccess = false
      this.projectLoading = false
      this.projectError = false
      this.specificProjectErrorMessage = ''
    }
  }
}
</script>

<template>
  <v-dialog :value="show" width="500" persistent @click:outside="reset">
    <v-card :loading="projectLoading">
      <v-card-title v-if="projectError || specificProjectErrorMessage">
        Uh oh! There's a problem
      </v-card-title>
      <v-card-title v-else-if="projectSuccess">
        Success!
      </v-card-title>
      <v-card-title v-else-if="permissionsCheck">
        You don't have permission.
      </v-card-title>

      <v-card-title v-else>
        Please give your new project a name
      </v-card-title>
      <v-card-text v-if="specificProjectErrorMessage">
        {{ specificProjectErrorMessage }}
      </v-card-text>
      <v-card-text v-else-if="permissionsCheck">
        You don't have permission to create projects.
      </v-card-text>
      <v-card-text v-else-if="projectError">
        It looks like your project wasn't added. Please try again. If you still
        need help, visit our
        <router-link to="help">Support Page</router-link>.
      </v-card-text>

      <v-card-text v-else-if="projectSuccess">
        Your project has been added.
      </v-card-text>

      <v-card-text v-else>
        <v-form ref="form" v-model="valid" @submit.prevent>
          <v-text-field
            id="name"
            v-model="projectName"
            autocomplete="off"
            label="Project Name"
            required
            :rules="nameRules"
            @keyup.enter="createProject"
          />
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          v-if="projectSuccess"
          color="primary"
          class="white--text"
          :loading="routing"
          @click="goToProject"
        >
          Go to project
        </v-btn>
        <v-btn
          v-if="
            !projectSuccess && !projectError && !specificProjectErrorMessage
          "
          id="add"
          v-disable-read-only-user="!valid"
          :disabled="!valid"
          :loading="projectLoading"
          class="ml-5 white--text"
          color="primary"
          @click="createProject"
        >
          Add Project
        </v-btn>
        <v-btn
          v-if="!projectSuccess"
          id="close"
          text
          data-cy="project-select-cancel"
          @click="close"
          >Cancel</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
