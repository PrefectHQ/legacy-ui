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
    title: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      flowDescription: this.description,
      textArea: false,
      loading: false
    }
  },
  computed: {
    print() {
      console.log('fd', !!this.flowDescription, 'd', this.description)
      return true
    },
    fullTitle() {
      return `${this.title} Description`
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
        console.log(data)
        if (data.set_flow_group_description.success) {
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
  <!-- <v-card class="pa-2 mt-2" tile>
    <CardTitle :title="fullTitle" icon="history_edu">
      <div slot="action" class="d-flex align-end justify-center flex-column">
        <v-btn
          class="pr-4"
          small
          :disabled="textArea"
          icon
          @click="textArea = true"
          ><v-icon>edit</v-icon></v-btn
        >
      </div>
    </CardTitle> -->

  <!-- <v-card-text v-if="print" class="full-height position-relative"> -->
  <v-row>
    <v-col>
      <v-btn
        v-if="!textArea"
        fab
        right
        small
        dark
        absolute
        style="z-index: 0;"
        color="codePink"
        @click="textArea = true"
        ><v-icon>edit</v-icon></v-btn
      >
      <div
        v-if="flowDescription && !textArea"
        class="artifact md grey--text text--darken-3
            mx-4 px-8"
        v-html="mdParser(flowDescription)"
      >
      </div>
      <div
        v-else-if="!textArea"
        class="subtitle-1
          grey--text text--darken-2 px-8"
      >
        This flow has no <span class="font-weight-medium"> description</span>.
        You can add one here or learn more about flow descriptions in the
        <a href="https://docs.prefect.io/api/latest/flow.html" target="_blank">
          Flow API Docs</a
        >.
      </div>
      <v-expand-transition v-if="textArea">
        <v-textarea v-model="flowDescription" class="bigger"> </v-textarea>
      </v-expand-transition>
      <div v-if="textArea" class="px-8 text-right">
        <v-btn text @click="closeTextArea">Close</v-btn
        ><v-btn
          color="primary"
          :loading="loading"
          @click="setFlowGroupDescription"
          >Update</v-btn
        >
      </div>
    </v-col>
  </v-row>
  <!-- </v-card-text>
  </v-card> -->
</template>

<style lang="scss" scoped>
// .bigger {
//   min-height: 50vh;

// .v-textarea {
textarea {
  min-height: 50vh !important;
}
// }
// }
</style>
