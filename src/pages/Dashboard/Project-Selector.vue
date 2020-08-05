<script>
import NewProjectDialog from '@/pages/Dashboard/NewProject-Dialog'
import { mapGetters } from 'vuex'

export default {
  components: {
    NewProjectDialog
  },
  data() {
    return {
      newProjectDialog: false,
      loading: false,
      previousProject: null,
      projectId: this.$route.params.id,
      projectSelect: this.$route.params.id
        ? this.$route.params
        : {
            name: 'All Projects',
            id: null
          }
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('api', ['backend']),
    sortedProjects() {
      if (!this.projects) return []
      let fullySorted = [...this.projects].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { ignorePunctuation: true })
      )
      fullySorted.unshift({ name: 'All Projects', id: null })
      fullySorted.unshift({ name: 'New Project', id: 'new_project' })
      return fullySorted
    }
  },
  watch: {
    projectSelect(val) {
      if (val == 'new_project') {
        this.newProjectDialog = true
        return
      }
      if (typeof val === 'object') {
        this.$router
          .push({
            name: 'dashboard',
            params: { ...this.$route.params, id: '' },
            query: this.$route.query
          })
          .catch(e => e)
        return
      }
      this.projectId = val
      this.$emit('project-select', this.projectId)
      this.$router
        .push({
          name: val ? 'project' : 'dashboard',
          params: { ...this.$route.params, id: val ? val : '' },
          query: { ...this.$route.query }
        })
        .catch(e => e)
      if (!val) this.projectSelect = { name: 'All Projects', id: null }
    },
    newProjectDialog(val) {
      if (!val) {
        this.projectSelect =
          this.$route.params.id === '' ? null : this.$route.params.id

        this.$apollo.queries.projects.refetch()
      }
    },
    $route(val) {
      if (val.params && !('id' in val.params) && this.projectId !== null) {
        this.projectSelect = null
        this.projectId = null
        this.$emit('project-select', null)
      } else if (
        val.params &&
        'id' in val.params &&
        this.projectId !== val.params.id
      ) {
        // This will ensure the normal emit and project id setting
        // happens in the watcher above
        this.projectSelect = val.params.id
      }
    },
    tenant(val) {
      this.projects = []

      if (val) {
        this.loading = true
        this.projects = []

        setTimeout(async () => {
          await this.$apollo.queries.projects.refetch(), (this.loading = false)
        }, 1000)
      }
    },
    backend() {
      this.$apollo.queries.projects.refetch()
    }
  },
  methods: {
    projectSelectTitleClass(item) {
      return {
        'new-project': item.id == 'new_project',
        'blue--text': item.id == null,
        'text--darken-4': item.id == null
      }
    }
  },
  apollo: {
    project: {
      query: require('@/graphql/Dashboard/project.gql'),
      variables() {
        return { id: this.projectId }
      },
      update: data => data.project,
      skip() {
        return !this.projectId
      }
    },
    projects: {
      query: require('@/graphql/Dashboard/projects.gql'),
      fetchPolicy: 'no-cache',
      variables() {
        return { id: this.projectId, tenantId: this.tenant?.id }
      },
      update: data => {
        // New Project is part of the read only user test.  If you change the name, update the test
        return data.project
      }
    }
  }
}
</script>

<template>
  <v-sheet tile color="appBackground">
    <v-autocomplete
      id="project-dropdown"
      v-model="projectSelect"
      class="project-selector pa-0"
      :class="$vuetify.breakpoint.smAndDown ? 'ml-0' : 'mr-0'"
      hide-details
      data-cy="projects"
      :items="sortedProjects"
      :loading="loading"
      item-value="id"
      item-text="name"
      prepend-icon="pi-project"
      dense
      flat
      solo
      full-width
      background-color="transparent"
    >
      <template v-slot:item="{ item }">
        <v-list-item-content
          :class="item.id == 'new_project' ? 'new-project' : ''"
        >
          <v-list-item-title :class="projectSelectTitleClass(item)">
            {{ item.name }}
          </v-list-item-title>
          <v-list-item-subtitle v-if="item.id == 'new_project'">
            Create a new project
          </v-list-item-subtitle>
          <v-list-item-subtitle v-if="item.id == null">
            Data across all your team's projects
          </v-list-item-subtitle>
        </v-list-item-content>
      </template>
    </v-autocomplete>

    <NewProjectDialog :show.sync="newProjectDialog" />
  </v-sheet>
</template>

<style lang="scss" scoped>
.card-transition {
  height: auto;
  transition: all 150ms;
}

.new-project {
  color: #3b8dff;
  font-weight: 500;
}

.project-selector {
  font-size: 0.9rem;
  margin: auto;
  max-width: 250px;
}
</style>
