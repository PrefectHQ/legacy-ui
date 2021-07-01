<script>
import { mapGetters } from 'vuex'
export default {
  props: {
    projectId: {
      required: false,
      type: String,
      default: () => null
    }
  },
  data() {
    return {
      loadingKey: 0
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant'])
  },
  apollo: {
    flows: {
      query() {
        return require('@/graphql/Dashboard/flows.js').default(this.isCloud)
      },
      variables() {
        // let sortBy = {}
        // if (this.sortBy) {
        //   if (this.isCloud && this.sortBy.includes('created_by.username')) {
        //     sortBy['created_by'] = {}
        //     sortBy['created_by']['username'] = this.sortDesc ? 'desc' : 'asc'
        //   } else if (Object.keys(this.sortBy) < 1) {
        //     sortBy = { name: 'asc' }
        //   } else {
        //     sortBy[`${this.sortBy}`] = this.sortDesc ? 'desc' : 'asc'
        //   }
        // }

        let searchParams = [
          { archived: { _eq: false } },
          { project_id: { _eq: this.projectId ? this.projectId : null } }
        ]

        // let orParams = [
        //   {
        //     name: { _ilike: this.searchFormatted }
        //   },
        //   { project: { name: { _ilike: this.searchFormatted } } }
        // ]

        // if (this.validUUID) {
        //   orParams.push({ id: { _eq: this.search } })
        // }

        // if (this.isCloud) {
        //   orParams.push({
        //     created_by: { username: { _ilike: this.searchFormatted } }
        //   })
        // }

        // return {
        //   limit: this.limit,
        //   offset: this.limit * (this.page - 1),
        //   orderBy: sortBy,
        //   searchParams: {
        //     _and: [...searchParams, { _or: [...orParams] }]
        //   }
        // }
        return {
          where: {
            _and: [...searchParams]
          }
        }
      },
      loadingKey: 'loadingKey',
      pollInterval: 60000,
      update: data => {
        return data?.flow
      }
    }
    // flowCount: {
    //   query: require('@/graphql/Dashboard/flow-count.gql'),
    //   variables() {
    //     let searchParams = [
    //       { archived: { _eq: this.showArchived ? null : false } },
    //       { project_id: { _eq: this.projectId ? this.projectId : null } }
    //     ]

    //     let orParams = [
    //       {
    //         name: { _ilike: this.searchFormatted }
    //       },
    //       { project: { name: { _ilike: this.searchFormatted } } }
    //     ]

    //     if (this.validUUID) {
    //       orParams.push({ id: { _eq: this.search } })
    //     }

    //     if (this.isCloud) {
    //       orParams.push({
    //         created_by: { username: { _ilike: this.searchFormatted } }
    //       })
    //     }

    //     return {
    //       searchParams: { _and: [...searchParams, { _or: [...orParams] }] }
    //     }
    //   },
    //   loadingKey: 'loading',
    //   pollInterval: 60000,
    //   update: data => data?.flowCount?.aggregate?.count
    // }
  }
}
</script>

<template>
  <div>{{ flows }}</div>
</template>

<style lang="scss" scoped>
/* // */
</style>
