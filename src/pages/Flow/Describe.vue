<script>
/* eslint-disable vue/no-v-html */
import { artifact_parser } from '@/utils/markdownParser'
import { mapActions } from 'vuex'

export default {
  components: {},
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
      description:
        this.newDescription || this.fgDescription || this.flowDescription || '',
      newDescription: this.fgDescription || this.flowDescription || '',
      textArea: false,
      clear: false,
      loading: false,
      tab: 'edit',
      reload: false
    }
  },
  computed: {
    editButtonTitle() {
      if (!this.flowDescription && !this.description) return 'Add Read Me'
      return 'Edit Read Me'
    },
    cardColor() {
      return this.textArea || this.newDescription ? 'white' : 'appBackground'
    },
    toolBarStyle() {
      return this.textArea
        ? {
            'border-color': '#DADAD2 !important',
            'border-style': 'solid',
            'border-width': '1px',
            'margin-bottom': '20px'
          }
        : ''
    }
  },
  watch: {
    flowGroupId() {
      this.reload = true
      this.newDescription = ''
      this.$nextTick(() => {
        this.newDescription = this.fgDescription || this.flowDescription || ''
        this.reload = false
      })
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
      this.description = this.fgDescription || this.flowDescription || ''
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
          if (this.clear || !this.description) {
            this.description = this.flowDescription
          }
          this.newDescription = this.description
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
  <v-card
    v-if="!reload"
    class="readme"
    :outlined="!!textArea || !!newDescription"
    elevation="0"
    :color="cardColor"
    min-height="80vh"
    width="100%"
    :style="{ 'border-color': '#DADAD2 !important' }"
  >
    <v-btn
      v-if="newDescription && !textArea"
      :title="editButtonTitle"
      icon
      class="mt-4"
      absolute
      depressed
      right
      color="primary"
      @click="textArea = true"
    >
      <v-icon>edit</v-icon>
    </v-btn>

    <v-card-title v-if="textArea" class="pa-0">
      <v-toolbar
        v-if="textArea"
        color="appBackground"
        width="100%"
        height="40px"
        dense
        class="ma-0"
        :style="toolBarStyle"
        flat
      >
        <v-spacer />
        <v-btn
          v-if="textArea && !this.$vuetify.breakpoint.xs"
          text
          color="rgba(0, 0, 0, 0.54)"
          small
          @click="closeTextArea"
          ><v-icon>fa-times</v-icon><span class="pl-2">Close</span></v-btn
        >

        <v-btn
          v-if="textArea && !this.$vuetify.breakpoint.xs"
          text
          small
          color="rgba(0, 0, 0, 0.54)"
          :loading="loading"
          class="mr-2"
          title="Update Read Me"
          @click="setFlowGroupDescription"
        >
          <v-icon>fa-save</v-icon>
          <span class="pl-2">Save</span>
        </v-btn>
        <v-btn
          v-if="
            flowDescription &&
              fgDescription &&
              textArea &&
              !this.$vuetify.breakpoint.xs
          "
          title="Reset to Read Me added at registration"
          text
          small
          color="rgba(0, 0, 0, 0.54)"
          @click="resetDescription"
          ><v-icon small>fa-undo-alt</v-icon>
          <span class="ml-2">reset</span></v-btn
        >
      </v-toolbar>
      <v-toolbar
        v-if="textArea"
        color="appBackground"
        width="100%"
        dense
        height="45px"
        class="ma-0"
        :style="toolBarStyle"
        flat
      >
        <v-btn-toggle v-model="tab" tile color="primary" group>
          <v-btn value="edit" class="ma-0">
            <v-icon class="mr-0">
              chevron_left
            </v-icon>
            <v-icon :style="{ 'margin-left': '-10px' }">
              chevron_right
            </v-icon>
            Editor
          </v-btn>

          <v-btn value="preview" class="ma-0">
            <v-icon small>
              fa-eye
            </v-icon>
            <span class="pl-4"> Preview</span>
          </v-btn>
        </v-btn-toggle>
      </v-toolbar>
    </v-card-title>
    <v-card-text class="pa-0">
      <v-textarea
        v-if="textArea && tab === 'edit'"
        ref="textA"
        v-model="description"
        outlined
        type="markdown"
        class="bigger"
        autofocus
      >
      </v-textarea>

      <div
        v-else-if="textArea && tab === 'preview'"
        :style="{
          'border-color': '#d3d3d3',
          'border-style': 'solid',
          'border-radius': '5px',
          'border-width': '1px',
          'min-height': '50vh'
        }"
        class="artifact md grey--text text--darken-3 px-8"
        v-html="mdParser(description)"
      ></div>

      <div
        v-else-if="newDescription && !loading"
        class="artifact md grey--text text--darken-3 mx-4 px-8 pt-4"
        v-html="mdParser(newDescription)"
      ></div>
      <div
        v-else
        class="headline
          grey--text text--darken-2 pl-8 pr-12 pt-8 text-center"
      >
        This Flow has no
        <span class="font-weight-medium"> Read Me! </span>

        <div class="text-center pt-8">
          <v-btn
            fab
            :title="editButtonTitle"
            color="primary"
            @click="textArea = true"
            ><v-icon>add</v-icon></v-btn
          >
        </div>
      </div>
    </v-card-text>

    <v-card-actions v-if="textArea" class="px-8 text-right">
      <v-spacer />
      <v-btn text @click="closeTextArea">Close</v-btn>

      <v-btn
        color="primary"
        class="mr-2"
        :loading="loading"
        title="Update Read Me"
        @click="setFlowGroupDescription"
      >
        Update
      </v-btn>
      <v-btn
        v-if="flowDescription && fgDescription"
        title="Reset to Read Me added at registration"
        color="codePink"
        dark
        outlined
        @click="resetDescription"
        >Reset</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<style>
.bigger.v-textarea textarea {
  min-height: 50vh !important;
}

.readme >>> div {
  border-color: #d3d3d3 !important;
}

.readme.pa-0 {
  padding-top: 50px !important;
}
</style>
