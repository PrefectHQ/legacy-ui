<script>
import { parametersMixin } from '@/mixins/parametersMixin.js'

export default {
  mixins: [parametersMixin],
  props: {
    parameter: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      valid: false,
      loading: false,
      newType: '',
      rules: {
        typeCheck: value => this.checkInput(value) || this.errorMessage
      },
      errorMessage: ''
    }
  },
  computed: {
    defaultType: {
      get() {
        const param = this.parameter.defaultVal
        if (Array.isArray(param)) return 'Array'
        return typeof param
      },
      set(x) {
        this.newType = x
      }
    },
    inputVal: {
      get() {
        if (!this.parameter.defaultVal) return ''
        // Prevents [Object object] or JSON as default entry for objects and stringified arrays
        if (
          typeof this.parameter.defaultVal == 'object' &&
          !Array.isArray(this.parameter.defaultVal)
        ) {
          let stringObj = '{'
          for (const [key, value] of Object.entries(
            this.parameter.defaultVal
          )) {
            stringObj += key + ':' + value
          }
          stringObj += '}'
          return stringObj
        }
        return this.parameter.defaultVal
      },
      set(x) {
        this.newInputVal = x
      }
    }
  },
  methods: {
    reset() {
      this.$emit('cancel')
    },
    checkInput(val) {
      if (val === this.inputVal) {
        return false
      }
      const type = this.newType || this.defaultType
      if (type === 'boolean') {
        if (val?.toLowerCase() === 'true') {
          this.valid = true
          this.errorMessage = ''
          return true
        } else if (val?.toLowerCase() === 'false') {
          this.valid = true
          this.errorMessage = ''
          return true
        } else {
          this.errorMessage = 'Invalid boolean'
          this.valid = false
          return false
        }
      }
      if (type === 'object') {
        if (val && val[0] !== '{') {
          this.errorMessage = 'Invalid dictionary'
          this.valid = false
          return false
        }
        this.valid = true
        this.errorMessage = ''
        return true
      }
      this.valid = true
      this.errorMessage = ''
      return true
    },
    async setIndividualParam() {
      const type = this.newType || this.defaultType
      if (type === 'number') this.newInputVal = Number(this.newInputVal)
      if (type === 'Array') {
        if (!this.newInputVal) {
          this.newInputVal = []
        } else {
          this.newInputVal = this.newInputVal
            .replace('[', '')
            .replace(']', '')
            .split(',')
          this.newInputVal = this.newInputVal.map(x =>
            isNaN(x) ? x : Number(x)
          )
        }
      }
      if (type === 'boolean') {
        if (this.newInputVal.toLowerCase() === 'true') {
          this.newInputVal = true
        } else if (this.newInputVal.toLowerCase() === 'false') {
          this.newInputVal = false
        } else {
          this.setAlert({
            alertShow: true,
            alertMessage: 'Invalid boolean',
            alertType: 'error'
          })
          return
        }
      }
      if (type === 'object') {
        if (!this.newInputVal || this.newInputVal == '{}') {
          this.inputVal = {}
        } else {
          if (this.newInputVal[0] !== '{') {
            this.setAlert({
              alertShow: true,
              alertMessage: 'Invalid dictionary',
              alertType: 'error'
            })
            return
          }
          if (this.newInputVal[1] !== "'") {
            const regex = /{|}/gi
            const regex2 = /,/gi
            const regex3 = /'/gi

            const split = this.newInputVal
              .replace(regex, '')
              .replace(regex2, ':')
              .replace(regex3, '')
              .split(':')

            const keys = {}
            let key = ''
            split.forEach((input, index) => {
              if (index % 2 === 0) {
                key = `${input}`.trim()
                keys[key] = null
              } else {
                const value = isNaN(input) ? input : Number(input)
                keys[key] = value
              }
            })
            this.newInputVal = JSON.stringify(keys)
            const test = this.validateJson()
            if (test !== true) return
            this.newInputVal = JSON.parse(this.newInputVal)
          }
        }
      }
      const parameterInputObj = JSON.parse(this.parameterInput)
      const paramKey = this.parameter.name
      const paramVal = this.newInputVal
      parameterInputObj[paramKey] = paramVal
      this.parameterInput = JSON.stringify(parameterInputObj)
      await this.setDefaultParams()
      this.reset()
    },
    validateJson() {
      try {
        // Treat empty or null inputs as valid
        const testVal = Array.isArray(this.inputVal)
          ? this.newInputVal[0]
          : this.newInputVal
        if (!testVal || (testVal && testVal.trim() === '')) {
          return 'MissingError'
        }
        // Attempt to parse JSON and catch syntax errors
        JSON.parse(testVal)
        return true
      } catch (err) {
        if (err instanceof SyntaxError) {
          // this.markJsonErrors(err)
          return 'SyntaxError'
        } else {
          throw err
        }
      }
    },
    resetValidation() {
      this.$refs.form.resetValidation()
    }
  }
}
</script>

<template>
  <v-col cols="12">
    <v-row align-end>
      <v-text-field
        ref="form"
        v-model="inputVal"
        class="mx-4"
        :type="newType || defaultType"
        :rules="[rules.typeCheck]"
      ></v-text-field>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <div v-on="on">
            <v-select
              data-public
              v-model="defaultType"
              class="select mx-4"
              :items="[
                { value: 'Array', text: 'List' },
                { value: 'string', text: 'String' },
                { value: 'object', text: 'Dictionary' },
                { value: 'number', text: 'Integer' },
                { value: 'boolean', text: 'Boolean' }
              ]"
              @change="resetValidation()"
            />
          </div>
        </template>
        <span
          >Select the type that this parameter should be set to. (Defaults to
          current parameter type).</span
        >
      </v-tooltip>
      <v-btn depressed class="mr-4 mt-4" @click="reset">
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        class="mt-4"
        :loading="loading"
        :disabled="!valid"
        @click="setIndividualParam(parameter)"
      >
        Update
      </v-btn>
    </v-row>
  </v-col>
</template>

<style scoped>
.select {
  width: 150px;
}
</style>
