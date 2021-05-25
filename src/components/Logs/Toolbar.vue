<script>
export default {
  props: {
    value: {
      type: Object,
      required: false,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      menu: false,
      date: null,
      input: null,
      internalValue: {},
      terms: []
    }
  },
  watch: {
    terms(val) {
      let clauses = []
      val.forEach(term => {
        const fields = term.split(':')
        console.log(term)

        let clause = null
        switch (fields[0]) {
          // This is a standin for the 'name' field on the logs table,
          // which doesn't seem useful in this context?
          // case 'source':

          // I'm not sure it's possible to get task or flow run state with this query
          // case 'state':
          case 'is':
            if (fields[1] == 'audit_log') {
              clause = { is_audit_log: { _eq: true } }
            } else {
              clause = { object_table: { _eq: fields[1] } }
            }
            break

          // These aren't possible with the current log table structure
          // case 'flow_id':
          // case 'task_id':
          // case 'project_id':

          case 'not':
            clause = { object_table: { _neq: fields[1] } }
            break
          case 'level':
            clause = { level: { _eq: fields[1] } }
            break

          // Once the object_id field is populated for flow and task runs
          // we can group these together with user_id
          case 'flow_run_id':
            clause = { flow_run_id: { _eq: fields[1] } }
            break
          case 'task_run_id':
            clause = { task_run_id: { _eq: fields[1] } }
            break
          case 'user_id':
            clause = { object_id: { _eq: fields[1] } }
            break
          case 'log_id':
            clause = { id: { _eq: fields[1] } }
            break
          default:
            clause = { message: { _ilike: `%${term}%` } }
            break
        }

        clauses.push(clause)
      })

      const value = {}

      clauses.forEach(c => {
        let clause = Object.keys(c)[0]
        value[clause] = c[clause]
      })

      this.$emit('input', value)
    }
  },
  methods: {
    handleInput() {
      if (!this.input) return
      this.terms = [...this.terms, ...this.input.split(' ')]
      this.input = null
    },
    removeTerm(i) {
      this.terms.splice(i, 1)
    }
  }
}
</script>

<template>
  <div class="logs-toolbar blue-grey lighten-2 py-3 px-2 rounded elevation-1">
    <div class="d-flex align-center justify-start">
      <div>
        <v-icon class="d-inline-block" large color="white">
          search
        </v-icon>

        <v-text-field
          v-model="input"
          class="d-inline-block white rounded text-body-1"
          filled
          rounded
          dense
          hide-details
          @keyup.enter="handleInput"
        />
      </div>

      <v-spacer />

      <v-menu
        ref="menu"
        v-model="menu"
        :close-on-content-click="false"
        :return-value.sync="date"
        transition="scale-transition"
        offset-y
        min-width="auto"
      >
        <template #activator="{ on, attrs }">
          <v-text-field
            v-model="date"
            prepend-icon="date_range"
            class="rounded text-body-1"
            filled
            rounded
            dense
            readonly
            hide-details
            v-bind="attrs"
            v-on="on"
          />
        </template>

        <v-date-picker v-model="date" no-title range scrollable>
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="menu = false">
            Cancel
          </v-btn>
          <v-btn text color="primary" @click="$refs.menu.save(date)">
            OK
          </v-btn>
        </v-date-picker>
      </v-menu>
    </div>
    <div class="d-flex align-center justify-start">
      <div v-for="(term, i) in terms" :key="term">
        <v-chip class="ma-2" close @click:close="removeTerm(i)">
          {{ term }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* */
</style>
