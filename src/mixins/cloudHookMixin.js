import {
  openCloudHookTypes,
  featureFlaggedCloudHookTypes,
  GROUP_COLORS,
  STATES
} from '@/utils/cloudHooks'
import LogRocket from 'logrocket'
import { mapGetters } from 'vuex'

export const cloudHookMixin = {
  data() {
    return {
      createNewCloudHook: false,
      error: {
        createCloudHook: null
      },
      loading: {
        createCloudHook: false
      }
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    cloudHookTypes() {
      if (this.tenant.prefectAdminSettings?.notifications)
        return featureFlaggedCloudHookTypes
      return openCloudHookTypes
    }
  },
  methods: {
    async _handleSetCloudHookStatusChange(val, item) {
      item.loading = true

      try {
        const updateCloudHookStatus = !val
          ? await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/set-cloud-hook-inactive.gql'),
              variables: {
                input: {
                  cloud_hook_id: item.id
                }
              },
              errorPolicy: 'all'
            })
          : await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/set-cloud-hook-active.gql'),
              variables: {
                input: {
                  cloud_hook_id: item.id
                }
              },
              errorPolicy: 'all'
            })

        setTimeout(() => {
          let status = updateCloudHookStatus.data
            ? updateCloudHookStatus.data.setCloudHookActive ||
              updateCloudHookStatus.data.setCloudHookInactive ||
              updateCloudHookStatus.data.set_cloud_hook_active ||
              updateCloudHookStatus.data.set_cloud_hook_inactive
            : false

          if (!status || !status.success) {
            item.loading = false
          } else {
            this.$apollo.queries.cloudHooks.refetch()
            item.loading = false
          }
        }, 500)
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Flow Settings',
            stage: 'Cloud Hook Status Update'
          }
        })

        item.loading = false
      }
    },
    stateGroup(states) {
      if (this.stateGroupAll(states)) return 'All'
      if (this.stateGroupFailed(states)) return 'Failed'
      if (this.stateGroupFinished(states)) return 'Finished'
      if (this.stateGroupSuccess(states)) return 'Success'
      return 'Custom'
    },
    stateGroupAll(states) {
      return this.cloudHookStateGroup('All', states)
    },
    stateGroupFailed(states) {
      return this.cloudHookStateGroup('Failed', states)
    },
    stateGroupFinished(states) {
      return this.cloudHookStateGroup('Finished', states)
    },
    stateGroupSuccess(states) {
      return this.cloudHookStateGroup('Success', states)
    },
    stateGroupColor(group) {
      return GROUP_COLORS[group]
    },
    typeIcon(type) {
      const hook = this.cloudHookTypes.find(t => t.type == type)
      if (hook) return hook.icon
      return ''
    },
    typeTitle(type) {
      const hook = this.cloudHookTypes.find(t => t.type == type)
      if (hook) return hook.title
      return type.toLowerCase()
    },
    cloudHookStateGroup(group, states) {
      return (
        STATES[group] &&
        STATES[group].every(state => states?.includes(state)) &&
        STATES[group].length == states.length
      )
    }
  }
}
