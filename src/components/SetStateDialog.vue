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
    <v-dialog v-model="setStateDialog" width="500" @click:outside="reset">
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
      <v-card :loading="markAsLoading">
        <v-card-title>
          Change the state of {{ taskRun ? taskRun.name : flowRun.name }}
        </v-card-title>
        <v-card-text>
          <v-stepper v-model="e1">
            <v-stepper-header>
              <v-stepper-step :complete="e1 > 1" editable step="1">
                Select State
              </v-stepper-step>
              <v-divider></v-divider>
              <v-stepper-step :complete="e1 > 2" step="2">
                Confirm
              </v-stepper-step>
            </v-stepper-header>
            <v-divider></v-divider>
            <v-stepper-items>
              <v-stepper-content step="1">
                <v-card-text>
                  <div>
                    <v-autocomplete
                      v-model="selectedState"
                      label="Select A State"
                      :items="filteredStates"
                      autocomplete="new-password"
                      required
                    >
                    </v-autocomplete>
                  </div>
                  <v-checkbox
                    v-if="flowRun"
                    v-model="allTasks"
                    class="pb-0 mb-0"
                    label="Include non-mapped task runs"
                  ></v-checkbox>
                  <v-checkbox
                    v-if="flowRun"
                    v-model="childTasks"
                    :disabled="!allTasks"
                    class="pt-0 mt-0"
                    label="Include mapped task runs - this may take some time"
                  ></v-checkbox>
                  <v-form ref="form" @submit.prevent>
                    <v-text-field
                      v-model="reason"
                      autocomplete="off"
                      label="Optional - Why are you changing state?"
                      @keyup.enter="checkContinue()"
                    ></v-text-field>
                  </v-form>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    v-disable-read-only-user="!selectedState"
                    color="primary"
                    @click="checkContinue"
                  >
                    Continue
                  </v-btn>

                  <v-btn text @click="reset">Cancel</v-btn>
                </v-card-actions>
              </v-stepper-content>

              <v-stepper-content step="2">
                <v-card-text>
                  Please be aware that clicking on confirm will set the state of
                  your
                  {{ dialogType }}
                  {{ taskRun ? taskRun.name : flowRun.name }} to
                  <span class="font-weight-black pb-8">
                    {{ selectedState }}.</span
                  >
                  <div v-if="childTasks" class="pt-1">
                    If you have a lot of child mapped tasks, the state change
                    may continue in the background.</div
                  >
                  <span v-if="dialogType === 'task run'">
                    This may have an effect on downstream tasks.
                  </span>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    v-disable-read-only-user="!selectedState"
                    color="primary"
                    @click="changeState"
                  >
                    Confirm
                  </v-btn>
                  <v-btn text @click="reset">Cancel</v-btn>
                </v-card-actions>
              </v-stepper-content>
            </v-stepper-items>
          </v-stepper>
        </v-card-text>
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
</style>
