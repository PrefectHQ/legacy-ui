<script>
import jsBeautify from 'js-beautify'
import { codemirror } from 'vue-codemirror'
import debounce from 'lodash.debounce'

import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/display/placeholder'

export default {
  components: {
    CodeMirror: codemirror
  },
  props: {
    disabled: {
      type: Boolean,
      default: () => false
    },
    prependIcon: {
      type: String,
      required: false,
      default: ''
    },
    selectedType: {
      type: String,
      default: null,
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
    newParameterInput: {
      type: String,
      default: '',
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
      // Line of JSON that contains a syntax error
      errorLine: null,
      // The JSON may need to be modified for formatting.
      // Store the JSON prop's value internally as data so the JSON can be modified.
      internalValue: this.value,
      jsonError: '',
      focussed: false
    }
  },
  computed: {
    cmInstance() {
      return this.$refs.cmRef && this.$refs.cmRef.codemirror
    },
    iconColor() {
      if (this.jsonError) return 'error'
      if (this.focussed) return 'primary'
      return 'grey'
    },
    editorOptions() {
      return {
        autoCloseBrackets: true,
        matchBrackets: true,
        mode: 'application/json',
        readOnly: this.disabled,
        smartIndent: true,
        lineWrapping: true,
        placeholder: this.placeholderText,
        tabSize: 2
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
    formatJson() {
      this.internalValue = jsBeautify(this.internalValue, {
        indent_size: 2,
        space_in_empty_paren: true,
        preserve_newlines: false
      })
    },
    handleJsonInput(event) {
      this.removeJsonErrors()
      this.$emit('input', event)
      if (this.selectedType === 'json') this.validateJson(event)
    },
    markJsonErrors(syntaxError) {
      const errorIndex = syntaxError?.message?.split(' ').pop()
      const errorPosition = this.cmInstance.doc.posFromIndex(errorIndex)
      this.errorLine = errorPosition.line
      this.cmInstance.doc.addLineClass(
        this.errorLine,
        'text',
        'json-input-error-text'
      )
    },
    removeJsonErrors() {
      this.jsonError = ''
      if (this.errorLine == null) return
      this.cmInstance.doc.removeLineClass(
        this.errorLine,
        'text',
        'json-input-error-text'
      )

      this.errorLine = null
    },
    // JSON validation is only used within this component for secrets.
    // Parent components are responsible for imperatively validating JSON using a ref to this component.
    validateJson: debounce(function(event) {
      if (this.newParameterInput) this.internalValue = this.newParameterInput
      const input = event || this.internalValue
      try {
        // Treat empty or null inputs as valid
        if (!input || (input && input.trim() === '')) {
          this.jsonError = 'Please enter a value.'
          this.$emit('invalid-secret', true)
          return 'MissingError'
        }
        // Attempt to parse JSON and catch syntax errors
        JSON.parse(input)
        this.removeJsonErrors()
        this.$emit('invalid-secret', false)
        return true
      } catch (err) {
        if (err instanceof SyntaxError) {
          this.markJsonErrors(err)
          this.$emit('invalid-secret', true)
          this.jsonError = `
          There is a syntax error in your JSON.
        `
          return 'SyntaxError'
        } else {
          throw err
        }
      }
    }, 300)
  }
}
</script>

<template>
  <div
    class="position-relative json-input-empty-text"
    :class="{ 'json-input-height-auto': heightAuto }"
  >
    <v-icon
      :color="iconColor"
      class="position-absolute"
      :style="{
        top: '12px',
        left: '12px',
        'z-index': 3
      }"
    >
      {{ prependIcon }}
    </v-icon>
    <CodeMirror
      ref="cmRef"
      data-cy="code-mirror-input"
      :value="internalValue"
      class="ma-1 pt-2 cm-style"
      :class="{
        'pl-7': prependIcon,
        'blue-border': prependIcon && focussed && !jsonError,
        'red-border': prependIcon && jsonError,
        'plain-border': prependIcon && !focussed && !jsonError,
        'original-border': !prependIcon
      }"
      :options="editorOptions"
      @input="handleJsonInput($event)"
      @focus="focussed = true"
      @blur="focussed = false"
    ></CodeMirror>

    <slot></slot>
    <v-btn
      class="position-absolute"
      :style="{
        bottom: '25px',
        right: '10px',
        'z-index': 3
      }"
      text
      small
      color="accent"
      @click="formatJson"
    >
      Format
    </v-btn>

    <div class="caption red--text min-height pl-4">{{ jsonError }}</div>
  </div>
</template>

<style lang="scss">
/*
  IMPORTANT: These styles must be globally scoped.

  There is CodeMirror code in <script /> that sets the .json-input-error-text class on any
  lines in the JSON editor with JSON syntax issues.

  Due to low CSS specificity, the styles in the .json-input-error-text class will not set
  if the component is locally scoped.

  For the same reason, the .json-input-error-text styles must also be marked as !important.

  To mitigate the effect of these global styles, each style will be prepended
  with json-input-, for "Run Flow Page".
*/

/* stylelint-disable selector-class-pattern */
.CodeMirror {
  height: 300px;
}

.json-input-height-auto {
  .CodeMirror {
    height: auto;
    min-height: 108px;
  }
}

.json-input-empty-text {
  .CodeMirror-empty {
    color: #808080;
  }

  .CodeMirror-cursor {
    height: auto !important;
  }
}

/* stylelint-enable selector-class-pattern */

.json-input-error-text {
  text-decoration: #ff5252 wavy underline !important;
}
</style>

<style lang="scss" scoped>
.min-height {
  height: 15px;
}

.cm-style {
  font-size: 1.3em;
}

.red-border {
  border: 2px solid #ff5252;
  border-radius: 5px;
}

.blue-border {
  border: 2px solid #3b8dff;
  border-radius: 5px;
}

.plain-border {
  border: 2px solid #ddd;
  border-radius: 5px;
}

.original-border {
  border: 1px solid #ddd;
}
</style>
