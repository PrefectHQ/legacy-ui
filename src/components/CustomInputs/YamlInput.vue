<script>
import { codemirror } from 'vue-codemirror'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/display/placeholder'
import '@/styles/yaml-input-style.scss'

export default {
  components: {
    CodeMirror: codemirror
  },
  props: {
    backgroundColor: {
      type: String,
      default: () => 'transparent'
    },
    disabled: {
      type: Boolean,
      default: () => false
    },
    prependIcon: {
      type: String,
      required: false,
      default: ''
    },
    prependIconLabel: {
      type: String,
      required: false,
      default: null
    },
    selectedType: {
      type: String,
      default: 'yaml',
      required: false
    },
    // If true, editor height updates based on content.
    heightAuto: {
      type: Boolean,
      default: () => false,
      required: false
    },
    value: {
      type: String,
      default: () => '',
      required: false
    },
    placeholderText: {
      type: String,
      default: '',
      required: false
    }
  },
  data() {
    return {
      // Line that contains a syntax error
      errorLine: null,
      // The value may need to be modified for formatting.
      // Store the value prop's value internally as data so it can be modified.
      internalValue: this.value,
      error: null,
      focussed: false
    }
  },
  computed: {
    cmInstance() {
      return this.$refs.cmRef && this.$refs.cmRef.codemirror
    },
    iconColor() {
      if (this.error) return 'error'
      if (this.focussed) return 'primary'
      return 'grey'
    },
    editorOptions() {
      return {
        mode: 'text/x-yaml',
        theme: 'yaml-input',
        readOnly: this.disabled,
        lint: true,
        smartIndent: true,
        lineWrapping: true,
        placeholder: this.placeholderText,
        tabSize: 4
      }
    }
  },
  watch: {
    // Keep value prop in sync with value saved as data
    value() {
      this.internalValue = this.value
    }
  },
  methods: {
    _handleInput(event) {
      this.removeErrors()
      this.$emit('input', event)
    },
    markErrors(syntaxError) {
      const errorIndex = syntaxError?.message?.split(' ').pop()
      const errorPosition = this.cmInstance.doc.posFromIndex(errorIndex)
      this.errorLine = errorPosition.line
      this.cmInstance.doc.addLineClass(
        this.errorLine,
        'text',
        'input-error-text'
      )
    },
    removeErrors() {
      this.error = null
      if (this.errorLine == null) return
      this.cmInstance.doc.removeLineClass(
        this.errorLine,
        'text',
        'input-error-text'
      )

      this.errorLine = null
    }
  }
}
</script>

<template>
  <div
    class="position-relative input-empty-text"
    :class="{ 'input-height-auto': heightAuto }"
  >
    <div
      class="position-absolute text-center"
      :style="{
        top: '12px',
        left: '12px',
        'z-index': 3
      }"
    >
      <v-icon :color="iconColor">
        {{ prependIcon }}
      </v-icon>
      <div class="text-caption o-20">
        {{ prependIconLabel }}
      </div>
    </div>
    <CodeMirror
      ref="cmRef"
      data-cy="code-mirror-input"
      :value="internalValue"
      class="pt-2 cm-style yaml-input"
      :class="{
        'pl-9': prependIcon,
        'pl-12': prependIconLabel,
        'blue-border': prependIcon && focussed && !error,
        'red-border': prependIcon && error,
        'plain-border': prependIcon && !focussed && !error,
        'original-border': !prependIcon,
        [backgroundColor]: true
      }"
      :options="editorOptions"
      @input="_handleInput($event)"
      @focus="focussed = true"
      @blur="focussed = false"
    ></CodeMirror>

    <slot></slot>
    <div class="text-caption red--text min-height pl-4">{{ error }}</div>
  </div>
</template>

<style lang="scss">
/* stylelint-disable selector-class-pattern */
.yaml-input {
  .CodeMirror.CodeMirror-wrap {
    font-family: inherit !important;
    height: 300px;
    resize: vertical;
  }

  .input-height-auto {
    .CodeMirror {
      height: auto;
      min-height: 108px;
    }
  }

  .input-empty-text {
    .CodeMirror-empty {
      color: var(--v-utilGrayMid-base);
    }

    .CodeMirror-cursor {
      height: auto !important;
    }
  }
}
</style>

<style lang="scss" scoped>
.min-height {
  height: 15px;
}

.cm-style {
  color: rgba(0, 0, 0, 0.38);
  cursor: text !important;
  font-size: inherit !important;
  height: auto;
  position: relative;

  &:hover,
  &:focus {
    color: rgba(0, 0, 0, 0.86);
  }

  &::after {
    background: transparent;
    content: '';
    height: 100%;
    left: 0;
    pointer-events: none;
    position: absolute;
    top: 0;
    transition: all 50ms;
    width: 100%;
  }

  &.red-border::after {
    border: 2px solid var(--v-error-base);
    border-radius: 4px;
  }

  &.blue-border::after {
    border: 2px solid var(--v-primary-base);
    border-radius: 4px;
  }

  &.plain-border::after {
    border: 1px solid currentColor;
    border-radius: 4px;
  }

  &.original-border::after {
    border: 1px solid currentColor;
  }
}
</style>
