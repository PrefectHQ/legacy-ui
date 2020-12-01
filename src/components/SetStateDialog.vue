<script>
import { changeStateMixin } from '@/mixins/changeStateMixin'

export default {
  mixins: [changeStateMixin],
  data() {
    return {
      childTasks: false
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
  <div v-if="activeButton()">
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
                :disabled="role === 'READ_ONLY_USER'"
                color="grey darken-2"
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
          <v-card-title class="headline word-break-normal mb-3" primary-title>
            Change the state of {{ taskRun ? taskRun.task.name : flowRun.name }}
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
            label="Opitional - Why are you changing state?"
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
                  v-disable-read-only-user="!selectedState"
                  :loading="markAsLoading"
                  color="primary"
                  v-bind="attrs"
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

              Please be aware that clicking on confirm will set the state of
              your
              {{ dialogType }}
              {{ taskRun ? taskRun.name : flowRun.name }} to
              <span class="font-weight-black pb-8"> {{ selectedState }}.</span>
            </v-tooltip>
            <v-btn text @click="reset">
              Cancel
            </v-btn>
          </v-card-actions>
        </div>
      </v-card>
    </v-dialog>
  </div>
  <div v-else-if="role == 'READ_ONLY_USER' && dialogType == 'flow run'">
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
      <span>Read-only users cannot change flow run states</span>
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
      <span v-if="role === 'READ_ONLY_USER'">
        Read-only users cannot change states
      </span>
      <span v-else>
        You can only change the marked state of a finished task-run
      </span>
    </v-tooltip>
  </div>
</template>

<style>
.theme--light.v-subheader {
  color: #000;
  font-weight: bold !important;
}

.checkbox-container {
  margin-left: 30px;
  margin-top: -20px;
}
</style>
