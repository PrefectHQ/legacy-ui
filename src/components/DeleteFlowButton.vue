<script>
import { mapGetters, mapActions } from 'vuex'

import gql from 'graphql-tag'

export default {
  components: {},
  props: {
    flow: {
      type: Object,
      default: null
    },
    flowGroup: {
      type: Object,
      default: null
    },
    type: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      deleting: false,
      errorMessage: '',
      allFlows: false,
      deleteDialog: false,
      // Alert data
      alertShow: false,
      alertMessage: '',
      alertType: null,
      alertLink: null
    }
  },
  computed: {
    ...mapGetters('tenant', ['role']),
    ...mapGetters('license', ['hasPermission']),
    isReadOnly() {
      return (
        !this.hasPermission('create', 'role') &&
        !this.hasPermission('delete', 'flow')
      )
    },
    all() {
      if (this.allFlows) return true
      if (this.type === 'group') return true
      return false
    },
    mutationString() {
      if (!this.all) {
        return gql`
          mutation($flowId: UUID!) {
            delete_flow(input: { flow_id: $flowId }) {
              success
            }
          }
        `
      } else {
        return gql`
          mutation($flowGroupId: UUID!) {
            delete_flow_group(input: { flow_group_id: $flowGroupId }) {
              success
            }
          }
        `
      }
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    async deleteFlow() {
      try {
        this.deleting = true
        const variables = this.allFlows
          ? { flowGroupId: this.flowGroup.id }
          : { flowId: this.flow.id }
        const { data } = await this.$apollo.mutate({
          mutation: this.mutationString,
          variables: variables
        })

        if (this.all && data?.delete_flow_group?.success) {
          this.deleting = false
          this.reset()
          this.$router.push({ name: 'dashboard' })
          this.setAlert({
            alertShow: true,
            alertMessage: `${this.flow.name} Deleted`,
            alertType: 'info'
          })
        } else if (!this.all && data?.delete_flow?.success) {
          this.deleting = false
          this.reset()
          this.$router.push({
            name: 'flow',
            params: { id: this.flowGroup.id },
            query: null
          })
          this.setAlert({
            alertShow: true,
            alertMessage: `Version ${this.flow.version} of ${this.flow.name} Deleted`,
            alertType: 'info'
          })
        } else {
          throw new Error('Something went wrong deleting a flow', data)
        }
      } catch (error) {
        this.deleting = false
        this.errorMessage =
          'We could not delete your flow.  Please try again.  If this problem continues, contact help@prefect.io'
      }
    },
    reset() {
      this.dialog = false
      this.deleting = false
      this.errorMessage = ''
      this.allFlows = false
      this.deleteDialog = false
    }
  }
}
</script>

<template>
  <div v-if="!isReadOnly" class="text-center">
    <v-dialog v-model="deleteDialog" width="500" @click:outside="reset">
      <template #activator="{ on: dialog }">
        <v-tooltip bottom>
          <template #activator="{ on: tooltip }">
            <div v-on="{ ...tooltip, ...dialog }">
              <v-btn
                class="vertical-button"
                data-cy="delete-button"
                text
                tile
                small
                color="red accent-2"
                aria-label="delete"
              >
                <v-icon>delete</v-icon>
                <div>Delete</div>
              </v-btn>
            </div>
          </template>
          <span v-if="type === 'flow'">Delete this flow</span>
          <span v-if="type === 'group'">Delete this flow group</span>
        </v-tooltip>
      </template>

      <!-- <template #activator="{ on }">
        <v-btn
          class="vertical-button"
          text
          tile
          small
          color="red accent-2"
          aria-label="delete"
          @click="dialog = true"
        >
          <v-icon>delete</v-icon>
          <div v-if="type === 'flow'">Delete</div>
        </v-btn>
      </template> -->

      <v-card :loading="deleting">
        <v-card-title v-if="!errorMessage && type === 'flow'">
          Delete flow "{{ flow.name }}" version {{ flow.version }}?
        </v-card-title>
        <v-card-title v-if="!errorMessage && type === 'group'">
          Delete all versions of this flow?
        </v-card-title>
        <v-card-text class="fix-height">
          <v-checkbox
            v-if="!errorMessage && type === 'flow'"
            v-model="allFlows"
            color="red accent-2"
            :label="`Delete all versions of this flow.`"
          ></v-checkbox>
          <div
            v-if="!errorMessage && !all && flow.archived === false"
            class="font-weight-bold"
          >
            This is an active version of your flow. Only archived versions will
            remain.
          </div>
          <div v-if="!errorMessage && all">
            This will delete <span class="font-weight-black">all </span>versions
            of your flow and cannot be undone.
          </div>
          <div class="red--text pt-5">
            {{ errorMessage }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            v-if="!errorMessage"
            color="red accent-2"
            class="white--text"
            :loading="deleting"
            @click="deleteFlow"
          >
            Delete
          </v-btn>
          <v-btn text @click="reset()">Cancel</v-btn>
        </v-card-actions></v-card
      >
    </v-dialog>
  </div>
  <div v-else-if="isReadOnly">
    <v-tooltip top>
      <template #activator="{ on }">
        <div v-on="on">
          <v-btn class="vertical-button" text disabled tile small>
            <v-icon>delete</v-icon>
            <div>Delete</div>
          </v-btn>
        </div>
      </template>
      <span>Read-only users cannot delete flows.</span>
    </v-tooltip>
  </div>
</template>

<style scoped lang="scss">
.fix-height {
  height: 110px;
}
</style>
