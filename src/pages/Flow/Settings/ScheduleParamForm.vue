<script>
// import { parametersMixin } from '@/mixins/parametersMixin.js'

export default {
  // mixins: [parametersMixin],

  props: {
    parameter: {
      required: false
    },
    flowParameter: {
      required: false
    },
    title: {
      required: false
    }
  },
  data() {
    return {
      newParameterDefault: ''
    }
  },

  computed: {},
  methods: {
    paramTransform() {
      // this.flowParameter.map(param => {
      //   if (param.name === this.parameter.name) {
      //     param.default = this.newParameterDefault
      //   }
      //   console.log(param)
      //   return param
      // })
      // .map(item => ({
      //   [item.name]: item.default
      // }))
      // var mapped = this.flowParameter.map(item => ({
      //   [item.name]:
      //     item.name === this.parameter.name
      //       ? this.newParameterDefault
      //       : item.default
      // }))
      // var mapped = this.flowParameter.map(item => {
      //   if (item.name === this.parameter.name) {
      //     return { [item.name]: this.newParameterDefault }
      //   }
      // })
      // var newObj = Object.assign({}, ...mapped)
      // console.log(newObj)
      // const sorted = Object.fromEntries(Object.entries(newObj).sort())
      // const paramString = JSON.parse(JSON.stringify(sorted))
      // const paramKey = this.parameter.name
      // const paramVal = this.newParameterDefault
      // paramString[paramKey] = paramVal
      // console.log({ [paramKey]: paramVal })
    }
  },
  mounted() {}
}
</script>
<template>
  <v-col cols="12">
    <v-row align-end>
      <!-- <v-text-field
        class="mx-4"
        v-model="newParameterDefault"
        placeholder="Default value"
      ></v-text-field> -->

      <v-text-field
        class="mx-4"
        v-model="newParameterDefault"
        placeholder="Default value"
        :value="title"
      ></v-text-field>

      <!-- $emit('update:title', paramTransform) -->

      <!-- <v-tooltip bottom>
        <template #activator="{ on }">
          <div v-on="on">
            <v-select
              class="select mx-4"
              :items="[
                { value: 'Array', text: 'List' },
                { value: 'string', text: 'String' },
                { value: 'object', text: 'Dictionary' },
                { value: 'number', text: 'Integer' },
                { value: 'boolean', text: 'Boolean' }
              ]"
            />
          </div>
        </template>
        <span
          >Select the type that this parameter should be set to. (Defaults to
          current parameter type).</span
        >
      </v-tooltip> -->
    </v-row>
  </v-col>
</template>
