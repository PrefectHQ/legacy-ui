<script>
/* eslint-disable vue/no-v-html */
import { artifact_parser } from '@/utils/markdownParser'
import { mapActions } from 'vuex'

export default {
  components: {},
  props: {
    description: {
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
      flowDescription: this.description,
      newDescription: null,
      textArea: false,
      loading: false
    }
  },
  computed: {},
  watch: {
    description(val) {
      this.flowDescription = val
      this.newDescription = null
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    mdParser(md) {
      return artifact_parser(md)
    },
    closeTextArea() {
      this.textArea = false
      this.flowDescription = this.description
    },
    async setFlowGroupDescription() {
      this.loading = true
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/set-flow-description.gql'),
          variables: {
            flowGroupId: this.flowGroupId,
            description: this.flowDescription
          }
        })
        if (data.set_flow_group_description.success) {
          this.newDescription = this.flowDescription
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
    <v-col>
      <v-tooltip v-if="!textArea" bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            elevation="1"
            fab
            right
            small
            dark
            absolute
            style="z-index: 0;"
            color="primary"
            v-bind="attrs"
            v-on="on"
            @click="textArea = true"
            ><v-icon>edit</v-icon></v-btn
          >
        </template>
        <span v-if="!flowDescription && all">Add flow group description</span>
        <span v-else-if="!all">Edit or add flow group description</span>
        <span v-else>Edit flow group description</span>
      </v-tooltip>
      <div
        v-if="flowDescription && !textArea"
        class="artifact md grey--text text--darken-3
            mx-4 px-8"
        v-html="mdParser(newDescription || description)"
      >
      </div>
      <div
        v-else-if="!textArea"
        class="subtitle-1
          grey--text text--darken-2 pl-8 pr-12 "
      >
        <div v-if="!all"
          >This flow has no
          <span class="font-weight-medium"> description</span>. Change the
          <span class="font-weight-medium">version </span> to 'All' to see your
          flow group description. Learn more about flow descriptions in the
          <a
            href="https://docs.prefect.io/api/latest/flow.html"
            target="_blank"
          >
            Flow API Docs</a
          >.</div
        >
        <span v-if="all">
          This flow group has no description. You can add one here or learn more
          about flow descriptions in the
          <a
            href="https://docs.prefect.io/api/latest/flow.html"
            target="_blank"
          >
            Flow API Docs</a
          >.</span
        >
      </div>
      <v-expand-transition v-if="textArea">
        <v-textarea v-model="flowDescription" class="bigger"> </v-textarea>
      </v-expand-transition>
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
