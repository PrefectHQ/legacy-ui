<script>
import CardTitle from '@/components/Card-Title'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    CardTitle
  },
  filters: {},
  mixins: [formatTime],
  props: {
    projectId: {
      required: false,
      type: String,
      default: () => null
    }
  },
  data() {
    return {
      flows: [],
      limit: 15,
      loading: 0,
      showArchived:
        this.$route && this.$route.query && this.$route.query.archived
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone'])
  },
  watch: {
    search(val) {
      this.$router.replace({
        query: { ...this.$route.query, flows: val }
      })
    },
    showArchived(val) {
      let query = { ...this.$route.query }

      if (val) {
        query.archived = true
      } else {
        delete query.archived
      }
      this.$router.replace({
        query: query
      })
    }
  },
  methods: {},
  apollo: {
    flows: {
      query() {
        return require('@/graphql/Dashboard/flows.js').default(this.isCloud)
      },
      variables() {
        return {
          limit: this.limit,
          offset: this.limit * (this.page - 1)
        }
      },
      loadingKey: 'loading',
      pollInterval: 60000,
      update: data => {
        return data?.flow
      }
    },
    flowCount: {
      query: require('@/graphql/Dashboard/flow-count.gql'),
      variables() {},
      loadingKey: 'loading',
      pollInterval: 60000,
      update: data => data?.flowCount?.aggregate?.count
    }
  }
}
</script>

<template>
  <v-card class="pa-2" tile>
    <CardTitle title="Calendar" icon="calendar">
      <div slot="action" class="flex align-center justify-end"> </div>
    </CardTitle>

    <v-card-text class="pa-0 pl-8">
      Calendar
    </v-card-text>
  </v-card>
</template>
