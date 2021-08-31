<script>
import CardTitle from '@/components/Card-Title'
export default {
  components: {
    CardTitle
  },
  filters: {
    typeClass: val => val.split('.').pop()
  },
  props: {
    flow: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      headers: [
        { text: 'Name', value: 'name', width: '20%' },
        { text: 'Max Retries', value: 'max_retries', width: '15%' },
        { text: 'Retry Delay', value: 'retry_delay', width: '15%' },
        { text: 'Class', value: 'type', width: '20%' },
        { text: 'Trigger', value: 'trigger', width: '20%' }
      ],
      itemsPerPage: 15,
      loadingKey: 0,
      page: 1,
      searchTerm: null,
      sortBy: 'name',
      sortDesc: false,
      tasks: null,
      tasksCount: null
    }
  },
  computed: {
    loading() {
      return this.loadingKey > 0
    },
    offset() {
      return this.itemsPerPage * (this.page - 1)
    },
    searchFormatted() {
      if (!this.searchTerm) return null
      return `%${this.searchTerm}%`
    }
  },
  apollo: {
    tasks: {
      query: require('@/graphql/Flow/table-tasks.gql'),
      loadingKey: 'loadingKey',
      variables() {
        const orderBy = {}
        orderBy[`${this.sortBy}`] = this.sortDesc ? 'desc' : 'asc'

        return {
          flowId: this.flow.id,
          heartbeat: this.heartbeat,
          limit: this.itemsPerPage,
          name: this.searchFormatted,
          offset: this.offset,
          orderBy
        }
      },
      update: data => data?.task
    },
    tasksCount: {
      query: require('@/graphql/Flow/table-tasks-count.gql'),
      loadingKey: 'loadingKey',
      variables() {
        return {
          flowId: this.flow.id,
          heartbeat: this.heartbeat,
          name: this.searchFormatted
        }
      },
      update: data => data?.task_aggregate?.aggregate?.count
    }
  }
}
</script>

<template>
  <v-card class="pa-2 mt-2" tile>
    <CardTitle title="Tasks" icon="pi-task">
      <v-text-field
        slot="action"
        v-model="searchTerm"
        class="task-search"
        placeholder="Search for a task"
        dense
        solo
        flat
        prepend-inner-icon="search"
        hide-details
        style="min-width: 400px;"
      >
      </v-text-field>
    </CardTitle>

    <v-card-text>
      <v-data-table
        v-if="!loading"
        :footer-props="{
          'items-per-page-options': [10, 15, 25, 50],
          'prev-icon': 'chevron_left',
          'next-icon': 'chevron_right'
        }"
        class="truncate-table"
        :headers="headers"
        :header-props="{ 'sort-icon': 'arrow_drop_up' }"
        :items="tasks"
        :items-per-page.sync="itemsPerPage"
        :loading="loading"
        must-sort
        :page.sync="page"
        :server-items-length="tasksCount"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
      >
        <template #item.name="{ item }">
          <truncate :content="item.name">
            <router-link
              class="link"
              :data-cy="'task-link|' + item.name"
              :to="{ name: 'task', params: { id: item.id } }"
            >
              {{ item.name }}
            </router-link>
          </truncate>
        </template>

        <template #item.retry_delay="{ item }">
          <span v-if="item.retry_delay">{{ item.retry_delay | duration }}</span>
          <span v-else>
            -
          </span>
        </template>

        <template #item.max_retries="{ item }">
          {{ item.max_retries }}
        </template>

        <template #item.type="{ item }">
          {{ item.type | typeClass }}
        </template>

        <template #item.trigger="{ item }">
          {{ item.trigger | typeClass }}
        </template>
      </v-data-table>

      <div v-else>
        <v-skeleton-loader type="table-row-divider" />
        <v-skeleton-loader type="table-row" />
        <v-skeleton-loader type="table-row" />
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.task-search {
  border-radius: 0 !important;
  font-size: 0.85rem;

  .v-icon {
    font-size: 20px !important;
  }
}
</style>
