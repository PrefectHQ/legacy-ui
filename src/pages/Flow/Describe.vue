<script>
/* eslint-disable vue/no-v-html */
import { artifact_parser } from '@/utils/markdownParser'
import { mapActions } from 'vuex'
import ExternalLink from '../../components/ExternalLink.vue'

export default {
  components: { ExternalLink },
  props: {
    flowDescription: {
      type: String,
      required: false,
      default: ''
    },
    fgDescription: {
      type: String,
      required: false,
      default: ''
    },
    flowGroupId: {
      type: String,
      required: true
    },
    all: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      description: this.fgDescription || this.flowDescription,
      newDescription: null,
      textArea: false,
      clear: false,
      loading: false
    }
  },
  computed: {},
  methods: {
    ...mapActions('alert', ['setAlert']),
    mdParser(md) {
      return artifact_parser(md)
    },
    resetDescription() {
      this.clear = true
      this.setFlowGroupDescription(true)
    },
    closeTextArea() {
      this.textArea = false
      this.clear = false
    },
    async setFlowGroupDescription() {
      if (this.clear) this.description = ''
      this.loading = true
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/set-flow-description.gql'),
          variables: {
            flowGroupId: this.flowGroupId,
            description: this.description
          }
        })
        if (data.set_flow_group_description.success) {
          this.newDescription = this.clear
            ? this.flowDescription
            : this.description
          this.closeTextArea()
          this.loading = false
        }
      } catch (error) {
        const errString = `${error}`
        this.setAlert({
          alertShow: true,
          alertMessage: errString,
          alertType: 'error'
        })
      }
    }
  }
}
</script>

<template>
  <v-row>
    <v-col class="pt-0">
      <v-toolbar v-if="!textArea" flat color="appBackground" dense>
        <v-spacer></v-spacer>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              color="primary"
              v-bind="attrs"
              v-on="on"
              @click="textArea = true"
              ><v-icon>edit</v-icon></v-btn
            >
          </template>
          <span v-if="!flowDescription && all">Add flow group description</span>
          <span v-else>Edit flow group description</span>
        </v-tooltip>
        <v-tooltip v-if="flowDescription && fgDescription" bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              color="codePink"
              v-bind="attrs"
              v-on="on"
              @click="resetDescription"
              ><v-icon>undo</v-icon></v-btn
            >
          </template>
          <span>Reset to description given at flow registration</span>
        </v-tooltip>
      </v-toolbar>

      <v-textarea
        v-if="textArea"
        v-model="description"
        class="bigger"
        autofocus
      >
      </v-textarea>

      <div
        v-else-if="description"
        class="artifact md grey--text text--darken-3 mx-4 px-8 mt-o"
        v-html="mdParser(newDescription || description)"
      ></div>
      <div
        v-else
        class="subtitle-1
          grey--text text--darken-2 pl-8 pr-12 "
      >
        This flow group has no
        <span class="font-weight-medium"> description</span>. You can add one
        here using
        <ExternalLink href="https://www.markdownguide.org/basic-syntax/"
          >markdown
        </ExternalLink>
        or learn more about flow descriptions in the
        <ExternalLink
          href="https://docs.prefect.io/orchestration/ui/flow.html#versions"
        >
          UI Flow Docs</ExternalLink
        >.
      </div>

      <div v-if="textArea" class="px-8 text-right">
        <v-btn text @click="closeTextArea">Close</v-btn>
        <v-tooltip top>
          <template #activator="{ on, attrs }">
            <v-btn
              color="primary"
              :loading="loading"
              v-bind="attrs"
              @click="setFlowGroupDescription"
              v-on="on"
            >
              Update
            </v-btn>
          </template>
          <span>Update your flow group description</span>
        </v-tooltip>
      </div>
    </v-col>
  </v-row>
</template>

<style>
.bigger.v-textarea textarea {
  min-height: 50vh !important;
}
</style>
