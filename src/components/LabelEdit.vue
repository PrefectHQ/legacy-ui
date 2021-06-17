<script>
import Label from '@/components/Label'
import LabelWarning from '@/components/LabelWarning'
import { mapActions, mapGetters } from 'vuex'

export default {
  components: {
    Label,
    LabelWarning
  },
  props: {
    flow: {
      type: Object,
      default: () => {}
    },
    flowGroup: {
      type: Object,
      default: () => {}
    },
    flowRun: {
      type: Object,
      default: () => {}
    },
    type: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      //labels
      newLabel: '',
      labelMenuOpen: false,
      labelEditOpen: false,
      labelSearchInput: '',
      removingLabel: null,
      newLabels: null,
      disableRemove: false,
      disableAdd: false,
      valid: false,
      errorMessage: '',
      duplicateLabel: '',
      rules: {
        labelCheck: value => this.checkLabelInput(value) || this.errorMessage
      }
    }
  },
  computed: {
    ...mapGetters('tenant', ['role']),
    ...mapGetters('license', ['hasPermission']),
    permissionsCheck() {
      return !this.hasPermission('update', 'run')
    },
    labels() {
      const labels =
        this.newLabels ||
        this.flowRun?.labels ||
        this.flowGroup?.labels ||
        this.flow?.run_config?.labels ||
        this.flow?.environment?.labels ||
        []
      return labels?.slice().sort()
    },
    flowOrFlowRun() {
      return this.flowRun ? 'Flow Run' : 'Flow'
    },
    labelResetDisabled() {
      const labels = this.newLabels || this.labels
      const defaultLabels =
        this.flow?.run_config?.labels || this.flow?.environment?.labels
      return (
        Array.isArray(labels) &&
        Array.isArray(defaultLabels) &&
        labels.length === defaultLabels.length &&
        labels.every((val, index) => val === defaultLabels[index])
      )
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    checkLabelInput(val) {
      const labels = this.newLabels || this.labels
      if (labels.includes(val) && !this.disableAdd) {
        this.errorMessage = 'Duplicate label'
        this.duplicateLabel = val
        this.valid = false
        return false
      }
      this.duplicateLabel = ''
      this.valid = true
      return true
    },
    removeLabel(labelToRemove) {
      this.removingLabel = labelToRemove
      this.disableRemove = true
      const labels = this.newLabels || this.labels
      const updatedArray = labels.filter(label => {
        return labelToRemove != label
      })
      this.editLabels(updatedArray)
    },
    addLabel() {
      if (!this.valid) return
      if (!this.newLabel) return
      this.disableAdd = true
      const labelArray = this.newLabels || this.labels.slice()
      labelArray.push(this.newLabel)
      this.editLabels(labelArray)
    },
    async editLabels(newLabels) {
      try {
        let result
        if (this.type !== 'flowRun') {
          result = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/set-labels.gql'),
            variables: {
              flowGroupId: this.flowGroup.id,
              labelArray: newLabels
            }
          })
        } else {
          result = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/set-flow-run-labels.gql'),
            variables: {
              flowRunId: this.flowRun.id,
              labelArray: newLabels
            }
          })
        }
        if (result.data) {
          this.newLabels =
            newLabels ||
            this.flowRun?.labels ||
            this.flow?.run_config?.labels ||
            this.flow?.environment?.labels ||
            []
          this.resetLabelSettings()
        } else {
          this.labelsError()
          this.resetLabelSettings()
        }
      } catch (e) {
        this.labelsError(e)
        this.resetLabelSettings()
      }
    },
    labelReset() {
      this.editLabels(null)
    },
    resetLabelSettings() {
      this.removingLabel = false
      this.disableAdd = false
      this.newLabel = ''
      this.disableRemove = false
    },
    labelsError(e) {
      const message = e
        ? `There was a problem: ${e}`
        : 'There was a problem updating your labels.  Please try again.'
      this.setAlert({
        alertShow: true,
        alertMessage: message,
        alertType: 'error'
      })
    }
  }
}
</script>

<template>
  <v-list-item dense>
    <v-list-item-content width="800px" style="overflow-x: auto;">
      <v-list-item-subtitle class="text-caption">
        Labels
        <v-menu :close-on-content-click="false" offset-y open-on-hover>
          <template #activator="{ on }">
            <v-btn text icon x-small class="mr-2" v-on="on">
              <v-icon>
                info
              </v-icon>
            </v-btn>
          </template>
          <v-card tile class="pa-0" max-width="320">
            <v-card-title class="subtitle pb-1"
              >{{ flowOrFlowRun }} Labels
            </v-card-title>

            <v-card-text class="pt-0">
              Flows, flow runs and agents have optional labels which allow you
              to determine where your flow runs are executed. For more
              information see
              <a
                href="https://docs.prefect.io/orchestration/execution/overview.html#labels"
                target="_blank"
                >the docs on labels</a
              >.
            </v-card-text>
          </v-card>
        </v-menu>

        <LabelWarning
          :flow="type === 'flowRun' ? flowRun.flow : flow"
          :flow-group="flowGroup"
          :flow-run="flowRun"
          icon-size="x-large"
          location="flowPageDetails"
        />
        <span v-if="$vuetify.breakpoint.sm" class="ml-8">
          <v-menu
            v-model="labelEditOpen"
            :close-on-content-click="false"
            offset-y
          >
            <template #activator="{ on: menu, attrs }">
              <v-tooltip bottom>
                <template #activator="{ on: tooltip }">
                  <div v-on="tooltip">
                    <v-btn
                      small
                      icon
                      :disabled="permissionsCheck"
                      aria-label="Add label"
                      color="primary"
                      v-bind="attrs"
                      v-on="menu"
                    >
                      <i class="far fa-plus fa-2x" />
                    </v-btn>
                  </div>
                </template>
                <span v-if="permissionsCheck">
                  You don't have permission to edit labels
                </span>
                <span v-else>Add a label</span>
              </v-tooltip>
            </template>
            <v-card width="800px" class="py-0">
              <v-card-title class="subtitle pr-2 pt-2 pb-0"
                >{{ flowOrFlowRun }} labels</v-card-title
              >

              <v-card-text class="py-0 width=1500px">
                <div class="width=800px">
                  Flows, flow runs and agents have optional labels which allow
                  you to determine where your flow runs are executed. For more
                  information see
                  <a
                    href="https://docs.prefect.io/orchestration/execution/overview.html#labels"
                    target="_blank"
                    >the docs on labels</a
                  >.
                </div>
                <v-text-field
                  v-model="newLabel"
                  :rules="[rules.labelCheck]"
                  color="primary"
                  clearable
                  class="mr-2 width=2000px"
                  :disabled="disableAdd"
                  @keyup.enter="addLabel"
                >
                  <template #prepend-inner>
                    <Label
                      v-for="(label, i) in newLabels || labels"
                      :key="i"
                      closable
                      :duplicate="duplicateLabel === label"
                      :loading="removingLabel === label"
                      :disabled="disableRemove"
                      class="mr-1 mb-1"
                      @remove="removeLabel"
                      >{{ label }}</Label
                    >
                  </template>
                </v-text-field>
              </v-card-text>
            </v-card>
          </v-menu>
          <v-tooltip v-if="type !== 'flowRun'" top>
            <template #activator="{ on }">
              <v-btn
                class="mt-0"
                icon
                :disabled="labelResetDisabled"
                color="codePink"
                small
                @click="labelReset"
                v-on="on"
              >
                <i class="far fa-undo-alt fa-2x" />
              </v-btn>
            </template>
            <span>Reset to labels from flow registration</span>
          </v-tooltip>
        </span>
      </v-list-item-subtitle>
      <div
        v-if="
          (newLabels && newLabels.length > 0) || (labels && labels.length > 0)
        "
      >
        <Label
          v-for="(label, i) in newLabels || labels"
          :key="i"
          closable
          :duplicate="duplicateLabel === label"
          :loading="removingLabel === label"
          :disabled="disableRemove"
          class="mr-1 mb-1"
          @remove="removeLabel"
          >{{ label }}</Label
        >
      </div>
      <div v-else class="text-subtitle-2">
        None
      </div>
    </v-list-item-content>
    <v-list-item-action v-if="!$vuetify.breakpoint.sm" class="ma-0">
      <v-tooltip v-if="type !== 'flowRun'" top>
        <template #activator="{ on }">
          <v-btn
            class="mt-0"
            icon
            :disabled="labelResetDisabled"
            color="codePink"
            small
            @click="labelReset"
            v-on="on"
          >
            <i class="far fa-undo-alt fa-2x" />
          </v-btn>
        </template>
        <span>Reset to labels from flow registration</span>
      </v-tooltip>
      <v-menu v-model="labelEditOpen" :close-on-content-click="false" offset-y>
        <template #activator="{ on: menu, attrs }">
          <v-tooltip top>
            <template #activator="{ on: tooltip }">
              <div v-on="tooltip">
                <v-btn
                  small
                  icon
                  :disabled="permissionsCheck"
                  aria-label="Add label"
                  color="primary"
                  v-bind="attrs"
                  v-on="menu"
                >
                  <i class="far fa-plus fa-2x" />
                </v-btn>
              </div>
            </template>
            <span v-if="permissionsCheck">
              You don't have permission to edit labels</span
            >
            <span v-else>Add a label</span>
          </v-tooltip>
        </template>
        <v-card width="800px" class="py-0">
          <v-card-title class="subtitle pr-2 pt-2 pb-0"
            >{{ flowOrFlowRun }} labels</v-card-title
          >

          <v-card-text class="py-0 width=1500px">
            <div class="width=800px">
              Flows, flow runs and agents have optional labels which allow you
              to determine where your flow runs are executed. For more
              information see
              <a
                href="https://docs.prefect.io/orchestration/execution/overview.html#labels"
                target="_blank"
                >the docs on labels</a
              >.
            </div>
            <v-text-field
              v-model="newLabel"
              :rules="[rules.labelCheck]"
              color="primary"
              clearable
              class="mr-2 width=2000px"
              :disabled="disableAdd"
              @keyup.enter="addLabel"
            >
              <template #prepend-inner>
                <Label
                  v-for="(label, i) in newLabels || labels"
                  :key="i"
                  closable
                  :duplicate="duplicateLabel === label"
                  :loading="removingLabel === label"
                  :disabled="disableRemove"
                  class="mr-1 mb-1"
                  @remove="removeLabel"
                  >{{ label }}</Label
                >
              </template>
            </v-text-field>
          </v-card-text>
        </v-card>
      </v-menu>
    </v-list-item-action>
  </v-list-item>
</template>

<style lang="scss" scoped>
/* stylelint-disable */
.v-list-item__action--stack {
  align-items: flex-start;
  flex-direction: row;
}
</style>
