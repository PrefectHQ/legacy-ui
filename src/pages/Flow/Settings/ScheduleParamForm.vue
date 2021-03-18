<script>
// import { parametersMixin } from '@/mixins/parametersMixin.js'

// {
//   "p": "param",
//   "param with default": "I am the default!!!"
// } ==> JSON INPUT

export default {
  // mixins: [parametersMixin],
  props: {
    param: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  data() {
    return {
      newType: '',
      parameterValue: ''
    }
  },
  computed: {
    // defaultType: {
    //   get() {
    //     const param = this.param.default
    //     if (Array.isArray(param)) return 'Array'
    //     return typeof param
    //   },
    //   set(x) {
    //     this.newType = x
    //   }
    // },
    // inputVal: {
    //   get() {
    //     if (
    //       typeof this.param.default == 'object' &&
    //       !Array.isArray(this.param.default)
    //     ) {
    //       let stringObj = '{'
    //       for (const [key, value] of Object.entries(this.param.default)) {
    //         stringObj += key + ':' + value
    //       }
    //       stringObj += '}'
    //       return stringObj
    //     }
    //     return this.param.default
    //   },
    //   set(x) {
    //     this.parameterValue = x
    //   }
    // }
  }
}
</script>

<template>
  <v-expansion-panels multiple>
    <v-expansion-panel height="90px" v-for="(parameter, i) in param" :key="i">
      <v-expansion-panel-header disable-icon-rotate>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="text-h6">
              {{ parameter.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              Default Value:
              {{ parameter.default }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <template #actions>
          <!-- <v-tooltip bottom>
            <template #activator="{ on }">
              <div v-on="on">
                <v-btn text>
                  <v-icon small class="ml-0 mr-2">fa-undo</v-icon>
                </v-btn>
              </div>
            </template>
            <span>Reset to the parameters set at flow registration</span>
          </v-tooltip> -->
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <div v-bind="attrs" v-on="on">
                <v-btn icon><v-icon>expand_more</v-icon> </v-btn>
              </div>
            </template>
            <span v-if="false">
              Read-only users cannot create or edit parameters.
            </span>
            <span v-else>
              Edit this parameter.
            </span>
          </v-tooltip>
        </template>
      </v-expansion-panel-header>

      <v-expansion-panel-content>
        <v-col cols="12">
          <v-row align-end>
            <v-text-field
              class="mx-4"
              v-model="parameterValue"
              placeholder="Default value"
            ></v-text-field>
            <!-- <v-tooltip bottom>
              <template #activator="{ on }">
                <div v-on="on">
                  <v-select
                    v-model="newType"
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
                >Select the type that this parameter should be set to. (Defaults
                to current parameter type).</span
              >
            </v-tooltip> -->
          </v-row>
        </v-col>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
