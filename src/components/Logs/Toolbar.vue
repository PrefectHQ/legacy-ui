<script>
import { formatTime } from '@/mixins/formatTimeMixin.js'
import DateTimePicker from '@/components/DateTimePicker'

export default {
  components: { DateTimePicker },
  mixins: [formatTime],
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
      date: [],
      input: null,
      internalValue: {},
      terms: []
    }
  },
  computed: {
    formattedDate() {
      if (!this.date) return
      console.log(this.date)
      const dates = this.date
        .map(d => d)
        .sort((a, b) => new Date(a) - new Date(b))
      return dates.map(date => this.formatDateLong(date)).join(' - ')
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

      clauses.forEach(c => {
        let clause = Object.keys(c)[0]
        this.internalValue[clause] = c[clause]
      })

      this.$emit('input', this.internalValue)
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
    },
    updateDateRange() {
      this.menu = false
      if (!this.date || this.date.length === 0) return
      if (this.date.length === 1) {
        const date0 = new Date(this.date[0])
        date0.setHours(0)
        date0.setMinutes(0)
        date0.setMilliseconds(0)
        const date1 = new Date(this.date[0])
        date1.setHours(23)
        date1.setMinutes(59)
        date1.setMilliseconds(999)
        this.internalValue['timestamp'] = {
          _gte: date0.toISOString(),
          _lte: date1.toISOString()
        }
      } else {
        const date0 = new Date(this.date[0])
        date0.setHours(0)
        date0.setMinutes(0)
        date0.setMilliseconds(0)
        const date1 = new Date(this.date[1])
        date1.setHours(23)
        date1.setMinutes(59)
        date1.setMilliseconds(999)
        this.internalValue['timestamp'] = {
          _gte: date0.toISOString(),
          _lte: date1.toISOString()
        }
      }
      this.$emit('input', this.internalValue)
    }
  }
}
</script>

<template>
  <div class="logs-toolbar blue-grey lighten-4 py-3 px-2 elevation-1">
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
        origin="top center"
        offset-y
        left
        min-width="auto"
      >
        <template #activator="{ on, attrs }">
          <v-text-field
            v-model="formattedDate"
            prepend-icon="date_range"
            class="rounded text-body-1"
            filled
            rounded
            dense
            readonly
            hide-details
            style="max-width: 200px;"
            v-bind="attrs"
            v-on="on"
          />
        </template>

        <!-- <div style="width: 650px; max-width: 100%;"></div>

        <v-date-picker v-model="date" no-title range scrollable>
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="menu = false">
            Cancel
          </v-btn>
          <v-btn text color="primary" @click="updateDateRange">
            OK
          </v-btn>
        </v-date-picker> -->
        <DateTimePicker />
      </v-menu>
    </div>
    <div class="d-flex align-center justify-start mt-3">
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
