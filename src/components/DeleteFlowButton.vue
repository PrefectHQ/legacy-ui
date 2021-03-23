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
    mutationString() {
      return gql`
        mutation($flowGroupId: UUID!) {
          delete_flow_group(input: { flow_group_id: $flowGroupId }) {
            success
          }
        }
      `
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    async deleteFlow() {
      try {
        this.deleting = true
        const { data } = await this.$apollo.mutate({
          mutation: this.mutationString,
          variables: {
            flowGroupId: this.flowGroup.id
          }
        })

        if (data?.delete_flow_group?.success) {
          this.deleting = false
          this.reset()
          this.$router.push({ name: 'dashboard' })
          this.setAlert({
            alertShow: true,
            alertMessage: `${this.flow.name} Deleted`,
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
      this.deleteDialog = false
    }
  }
}
</script>

<template>
  <div v-if="role !== 'READ_ONLY_USER'" class="text-center">
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
          <span>Delete this flow</span>
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
        <v-card-title v-if="!errorMessage">
          Delete flow "{{ flow.name }}"?
        </v-card-title>
        <v-card-text class="fix-height">
          <div v-if="!errorMessage">
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
            @click="deleteFlow"
          >
            Delete
          </v-btn>
          <v-btn text @click="reset()">Cancel</v-btn>
        </v-card-actions></v-card
      >
    </v-dialog>
  </div>
  <div v-else-if="role == 'READ_ONLY_USER'">
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
  height: 80px;
}
</style>
