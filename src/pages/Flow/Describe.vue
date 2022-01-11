<script>
/* eslint-disable vue/no-v-html */
import { artifact_parser } from '@/utils/markdownParser'
import { mapActions } from 'vuex'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'

export default {
  components: {
    CodeMirror: codemirror
  },
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
    cardColor() {
      return this.textArea || this.newDescription
        ? 'appForeground'
        : 'appBackground'
    },
    toolBarStyle() {
      return this.textArea
        ? {
            'border-color': 'var(--v-utilGrayLight-base) !important',
            'border-bottom-style': 'solid',
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
      this.description = ''
      this.$nextTick(() => {
        this.newDescription = this.fgDescription || this.flowDescription || ''
        this.description =
          this.newDescription ||
          this.fgDescription ||
          this.flowDescription ||
          ''
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
      this.description =
        this.newDescription || this.fgDescription || this.flowDescription || ''
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
    width="100%"
    :style="{
      'border-color': 'utilGrayLight !important',
      overflow: 'auto'
    }"
  >
    <v-btn
      v-if="newDescription && !textArea"
      title="Edit ReadMe"
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

    <v-toolbar
      v-if="textArea"
      width="100%"
      height="30px"
      dense
      class="ma-0"
      :style="toolBarStyle"
      flat
    >
      <v-spacer />

      <v-btn
        v-if="textArea"
        text
        tile
        color="utilGrayDark"
        small
        @click="closeTextArea"
        ><v-icon x-small>fa-times</v-icon
        ><span style="text-transform: none;" class="pl-1">Cancel</span></v-btn
      >
      <v-btn
        v-if="flowDescription && fgDescription && textArea"
        title="Reset to ReadMe added at registration"
        text
        small
        tile
        color="utilGrayDark"
        @click="resetDescription"
        ><v-icon x-small>fa-undo-alt</v-icon>
        <span style="text-transform: none;" class="pl-1">Reset</span></v-btn
      >
      <v-btn
        v-if="textArea"
        text
        small
        tile
        color="utilGrayDark"
        :loading="loading"
        title="Update ReadMe"
        @click="setFlowGroupDescription"
      >
        <v-icon x-small>fa-save</v-icon>
        <span style="text-transform: none;" class="pl-1">Save</span>
      </v-btn>
    </v-toolbar>
    <v-toolbar
      v-if="textArea"
      width="100%"
      dense
      height="28px"
      class="ma-0 pa-0 tbar"
      :style="toolBarStyle"
      flat
    >
      <v-btn-toggle
        v-model="tab"
        tile
        borderless
        class="ma-0"
        :style="{ height: '100%' }"
        color="primary"
        group
      >
        <v-btn class="ma-0" height="100%" small tile value="edit">
          <v-icon small class="mr-0">
            chevron_left
          </v-icon>
          <v-icon small :style="{ 'margin-left': '-10px' }">
            chevron_right
          </v-icon>
          <span style="text-transform: none;"> Editor</span>
        </v-btn>

        <v-btn height="100%" class="ma-0" tile small value="preview">
          <v-icon x-small>
            fa-eye
          </v-icon>
          <span style="text-transform: none;" class="pl-2"> Preview</span>
        </v-btn>
      </v-btn-toggle>
    </v-toolbar>
    <div v-if="textArea && tab === 'edit'" class="cmirror">
      <CodeMirror
        ref="textA"
        v-model="description"
        outlined
        :options="{
          lineNumbers: true,
          lineWrapping: true,
          mode: 'markdown'
        }"
        line-numbers
        type="markdown"
        autofocus
      >
      </CodeMirror>
    </div>

    <div
      v-else-if="textArea && tab === 'preview'"
      :style="{
        height: '70vh',
        width: '100%',
        'background-color': 'appForeground',
        overflow: 'auto'
      }"
      class="artifact md utilGreyDark--text px-8"
      v-html="mdParser(description)"
    ></div>

    <div
      v-else-if="newDescription && !loading"
      class="artifact md utilGreyDark--text mx-4 px-8 pt-4 wide"
      v-html="mdParser(newDescription)"
    ></div>
    <div
      v-else
      class="text-h5
          utilGreyDark--text pl-8 pr-12 pt-8 text-center wide"
    >
      This flow has no
      <span class="font-weight-medium"> ReadMe! </span>

      <div class="text-center pt-8">
        <v-btn fab title="Add ReadMe" color="primary" @click="textArea = true"
          ><v-icon>add</v-icon></v-btn
        >
      </div>
    </div>
  </v-card>
</template>

<style>
.white-background-color {
  background-color: var(--v-appForeground-base);
}

.app-background-color {
  background-color: var(--v-appBackground-base);
}

.wide {
  max-height: 80vh;
  min-height: 30vh !important;
  width: 100%;
}
/* stylelint-disable */
.readme >>> div {
  border-color: var(--v-utilGrayLight-base) !important;
}

.readme.pa-0 {
  padding-top: 50px !important;
}

.tbar .v-toolbar__content {
  padding-left: 0;
}
.cmirror .CodeMirror {
  width: 100%;
  height: 70vh;
  overflow: auto;
  background-color: var(--v-appForeground-base);
  color: var(--v-utilGrayDark-base);
}

.CodeMirror-gutters {
  background-color: var(--v-appForeground-base);
  border-color: var(--v-utilGrayLight-base);
  color: var(--v-utilGrayMid-base);
}

.CodeMirror-cursor {
  border-color: var(--v-utilGrayMid-base);
}

.cmirror .CodeMirror-vscrollbar {
  z-index: 4;
}
</style>
