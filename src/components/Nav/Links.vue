<script>
import TeamMenu from '@/components/Nav/TeamMenu'

export default {
  components: {
    TeamMenu
  },
  data() {
    return {
      active: false,
      menu: false
    }
  },
  computed: {
    slug() {
      return this.tenant?.slug
    }
  }
}
</script>

<template>
  <div>
    <v-btn
      :to="{
        name: 'dashboard',
        params: {
          tenant: slug
        }
      }"
      class="text-subtitle-1 text-capitalize mx-1 font-weight-medium"
      dark
      small
      depressed
      color="transparent"
      :input-value="$route.name == 'dashboard' || $route.name == 'project'"
      title="Visit your Dashboard"
    >
      Dashboard
    </v-btn>

    <v-btn
      :to="{
        name: 'home'
      }"
      class="text-subtitle-1 text-capitalize mx-1 font-weight-medium"
      dark
      small
      depressed
      color="transparent"
      title="Learn how to get started with Prefect"
    >
      Getting Started
    </v-btn>

    <v-btn
      :to="{
        name: 'api',
        params: { tenant: slug }
      }"
      class="text-subtitle-1 text-capitalize mx-1 font-weight-medium"
      dark
      small
      depressed
      color="transparent"
      title="Experiment with GraphQL queries using the Interactive API"
    >
      Interactive API
    </v-btn>

    <v-btn
      :to="{
        name: 'calendar',
        params: { tenant: slug }
      }"
      class="text-subtitle-1 text-capitalize mx-1 font-weight-medium"
      dark
      small
      depressed
      color="transparent"
      title="View your flow runs in a calendar view"
    >
      Calendar
    </v-btn>

    <TeamMenu />
  </div>
</template>
