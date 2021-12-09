<script>
import { changeStateMixin } from '@/mixins/changeStateMixin'
import { mapGetters } from 'vuex'

export default {
  mixins: [changeStateMixin],
  data() {
    return {
      childTasks: false
    }
  },
  computed: {
    ...mapGetters('license', ['hasPermission']),
    permissionsCheck() {
      return !this.hasPermission('update', 'run')
    }
  },
  methods: {
    onIntersect([entry]) {
      this.$apollo.queries.taskRunIds.skip = !entry.isIntersecting
    }
  },
  apollo: {
    taskRunIds: {
      query: require('@/graphql/FlowRun/task-run-ids.gql'),
      variables() {
        return {
          flowRunId: this.flowRun.id,
          parentMapIndex: -1,
          childMapIndex: null
        }
      },
      skip() {
        return !this.flowRun
      },
      pollInterval: 10000,
      update: data => data.task_run
    }
  }
}
</script>

<template>
  <div v-if="activeButton" v-intersect="{ handler: onIntersect }">
    <v-dialog v-model="setStateDialog" max-width="600" @click:outside="reset">
      <template #activator="{ on: dialog }">
        <v-tooltip bottom>
          <template #activator="{ on: tooltip }">
            <div v-on="{ ...tooltip, ...dialog }">
              <v-btn
                class="vertical-button"
                :style="{ height: '46px' }"
                text
                small
                depressed
                :disabled="permissionsCheck"
                color="utilGrayMid"
              >
                <v-icon>label_important</v-icon>
                <div>Set State</div>
              </v-btn>
            </div>
          </template>
          <span>Change the state of this {{ dialogType }}</span>
        </v-tooltip>
      </template>

      <v-card flat :loading="markAsLoading">
        <div style="padding: 20px;">
          <v-card-title class="text-h5 word-break-normal card-title">
            <span v-if="taskRun && taskRun.name">
              Change the state of
              <span class="font-weight-medium">{{ taskRun.name }}</span>
            </span>
            <span v-else-if="taskRun">
              Change the state of this run of
              <span class="font-weight-medium">{{ taskRun.task.name }}</span>
            </span>
            <span v-else
              >Change the state of
              <span class="font-weight-medium">{{ flowRun.name }}</span></span
            >
          </v-card-title>
          <v-select
            v-model="selectedState"
            outlined
            :menu-props="{ offsetY: true }"
            label="State"
            prepend-icon="assessment"
            :items="filteredStates"
          >
          </v-select>

          <v-text-field
            v-model="reason"
            class="mb-3"
            label="Optional - Why are you changing state?"
            prepend-icon="live_help"
            autocomplete="new-password"
            outlined
          />

          <div class="checkbox-container">
            <v-checkbox
              v-if="flowRun"
              v-model="allTasks"
              label="Include non-mapped task runs"
              style="margin-bottom: -30px;"
            ></v-checkbox>
            <v-checkbox
              v-if="flowRun"
              v-model="childTasks"
              :disabled="!allTasks"
              label="Include mapped task runs - this may take some time"
            ></v-checkbox>
          </div>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-tooltip top>
              <template #activator="{ on, attrs }">
                <v-btn
                  v-show="childTasks || dialogType === 'task run'"
                  v-disable-read-only-user="!selectedState"
                  :loading="markAsLoading"
                  color="primary"
                  v-bind="attrs"
                  class="set-state"
                  v-on="on"
                  @click="changeState"
                >
                  Confirm
                </v-btn>
              </template>

              <span v-if="childTasks" class="pt-1">
                If you have a lot of child mapped tasks, the state change may
                continue in the background.
                <br />
              </span>

              <span v-if="dialogType === 'task run'">
                This may have an effect on downstream tasks.
                <br />
              </span>
            </v-tooltip>
            <v-btn
              v-show="!taskRun && (!childTasks || !dialogType === 'task run')"
              v-disable-read-only-user="!selectedState"
              :loading="markAsLoading"
              color="primary"
              class="set-state"
              @click="changeState"
            >
              Confirm
            </v-btn>
            <v-btn text @click="reset">
              Cancel
            </v-btn>
          </v-card-actions>
        </div>
      </v-card>
    </v-dialog>
  </div>
  <div v-else-if="permissionsCheck && dialogType == 'flow run'">
    <v-tooltip bottom>
      <template #activator="{ on }">
        <div v-on="on">
          <v-btn
            text
            disabled
            class="vertical-button"
            :style="{ height: '46px' }"
            small
            depressed
            color="grey darken-2"
          >
            <v-icon>label_important</v-icon>
            Set State
          </v-btn>
        </div>
      </template>
      <span>
        You don't have permission to change flow run states
      </span>
    </v-tooltip>
  </div>
  <div v-else-if="dialogType == 'task run'">
    <v-tooltip bottom>
      <template #activator="{ on }">
        <div v-on="on">
          <v-btn
            text
            disabled
            class="vertical-button"
            :style="{ height: '46px' }"
            small
            depressed
            color="grey darken-2"
          >
            <v-icon>label_important</v-icon>
            Set State
          </v-btn>
        </div>
      </template>
      <span v-if="permissionsCheck">
        You don't have permission to change states
      </span>
      <span v-else>
        You can only change the marked state of a finished task-run
      </span>
    </v-tooltip>
  </div>
</template>

<style>
.theme--light.v-subheader {
  color: var(--v-secondaryGray-dark);
  font-weight: bold !important;
}

.checkbox-container {
  margin-left: 30px;
  margin-top: -20px;
}
/* stylelint-disable */
.set-state .v-btn__loader {
  color: var(--v-appForeground-base);
}

.card-title {
  margin-left: -12px;
  margin-top: -10px;
  margin-bottom: 10px;
}
</style>
