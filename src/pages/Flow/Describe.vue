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
      loading: false,
      tab: 'edit'
    }
  },
  computed: {
    editButtonTitle() {
      if (!this.flowDescription && !this.description) return 'Add Read Me'
      return 'Edit Read Me'
    },
    cardColor() {
      return this.textArea ? 'white' : 'appBackground'
    },
    toolBarStyle() {
      return this.textArea
        ? {
            'border-color': '#DADAD2 !important',
            'border-style': 'solid',
            'border-radius': '5px',
            'border-width': '1px',
            'margin-bottom': '20px'
          }
        : ''
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    edit() {
      this.tab = 'edit'
    },
    preview() {
      this.tab = 'preview'
    },
    mdParser(md) {
      return artifact_parser(md)
    },
    resetDescription() {
      this.clear = true
      this.setFlowGroupDescription()
    },
    closeTextArea() {
      this.textArea = false
      this.clear = false
      this.tab = 'edit'
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
          if (this.clear || !this.description)
            this.description = this.flowDescription
        }
      } catch (error) {
        const errString = `${error}`
        this.setAlert({
          alertShow: true,
          alertMessage: errString,
          alertType: 'error'
        })
      } finally {
        this.closeTextArea()
        this.loading = false
      }
    }
  }
}
</script>

<template>
  <v-row class="pt-0">
    <v-card
      v-if="!loading"
      class="pt-0 readme"
      outlined
      :color="cardColor"
      min-height="80vh"
      width="100%"
      :style="{ 'border-color': '#DADAD2 !important' }"
      ><v-card-title class="pa-0">
        <v-toolbar
          v-if="description || flowDescription || textArea"
          color="appBackground"
          width="100%"
          :style="toolBarStyle"
          flat
        >
          <v-btn v-if="textArea" text @click="edit"> edit</v-btn>
          <v-btn v-if="textArea" text @click="preview">
            preview
          </v-btn>
          <v-spacer />
          <v-btn
            v-if="textArea && !this.$vuetify.breakpoint.xs"
            text
            @click="closeTextArea"
            >Close</v-btn
          >

          <v-btn
            v-if="textArea && !this.$vuetify.breakpoint.xs"
            color="primary"
            :loading="loading"
            v-bind="attrs"
            class="mr-2"
            title="Update Read Me"
            @click="setFlowGroupDescription"
            v-on="on"
          >
            Update
          </v-btn>
          <v-btn
            v-if="
              flowDescription &&
                fgDescription &&
                textArea &&
                !this.$vuetify.breakpoint.xs
            "
            title="Reset to Read Me added at registration"
            color="codePink"
            dark
            @click="resetDescription"
            >Reset</v-btn
          >
          <v-btn
            v-if="!textArea"
            :title="editButtonTitle"
            icon
            dark
            color="primary"
            @click="textArea = true"
            ><v-icon>edit</v-icon></v-btn
          >
        </v-toolbar>
      </v-card-title>
      <v-card-text class="pt-0">
        <v-textarea
          v-if="textArea && tab === 'edit'"
          v-model="description"
          outlined
          class="bigger"
          autofocus
        >
        </v-textarea>

        <div
          v-else-if="textArea && tab === 'preview'"
          :style="{
            'border-color': '#3b8dff',
            'border-style': 'solid',
            'border-radius': '5px',
            'border-width': '2px',
            'min-height': '50vh'
          }"
          class="artifact md grey--text text--darken-3 px-8 mt-0"
          v-html="mdParser(description)"
        ></div>

        <div
          v-else-if="description"
          class="artifact md grey--text text--darken-3 mx-4 px-8 mt-0"
          v-html="mdParser(description)"
        ></div>
        <div
          v-else
          class="headline
          grey--text text--darken-2 pl-8 pr-12 pt-8"
        >
          This Flow Group has no
          <span class="font-weight-medium"> Read Me </span>. You can add one
          here using
          <ExternalLink href="https://www.markdownguide.org/basic-syntax/"
            >markdown
          </ExternalLink>
          or learn more about adding a Flow Group Read Me in the
          <ExternalLink
            href="https://docs.prefect.io/orchestration/ui/flow.html#readme"
          >
            UI Flow Docs</ExternalLink
          >.
        </div>
        <div
          v-if="!textArea && !description && !flowDescription"
          class="text-center pt-8"
        >
          <v-btn
            large
            class="vertical-button"
            :title="editButtonTitle"
            color="primary"
            @click="textArea = true"
            ><v-icon>edit</v-icon>{{ editButtonTitle }}</v-btn
          >
        </div>
      </v-card-text>

      <v-card-actions v-if="textArea" class="px-8 text-right">
        <v-spacer />
        <v-btn text @click="closeTextArea">Close</v-btn>

        <v-btn
          color="primary"
          class="mr-2"
          :loading="loading"
          v-bind="attrs"
          title="Update Read Me"
          @click="setFlowGroupDescription"
          v-on="on"
        >
          Update
        </v-btn>
        <v-btn
          v-if="flowDescription && fgDescription"
          title="Reset to Read Me added at registration"
          color="codePink"
          dark
          @click="resetDescription"
          >Reset</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-row>
</template>

<style>
.bigger.v-textarea textarea {
  min-height: 50vh !important;
}

.readme >>> div {
  border-color: #56494e !important;
}
</style>
