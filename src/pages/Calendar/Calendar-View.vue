<script>
import CalendarDay from '@/pages/Calendar/Calendar-Day'
import CalendarFlows from '@/pages/Calendar/Calendar-FlowFilter'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    CalendarDay,
    CalendarFlows
  },
  mixins: [formatTime],
  data() {
    return {
      calendarInterval: 60,
      date: this.formatCalendarDate(new Date()),
      skip: false,
      loadingKey: 0,
      refetching: false,
      type: 'day',
      flowId: null,
      typeToLabel: {
        day: 'Day',
        '4day': '4 Days'
      }
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    ...mapGetters('api', ['backend']),
    calTitle() {
      return this.getMonth(this.date)
    }
  },
  watch: {
    async tenant() {
      this.flowId = null
    },
    async backend() {
      this.flowId = null
    }
  },
  methods: {
    setToday() {
      this.date = this.formatCalendarDate(new Date())
    },
    handleSelectedFlow(flow) {
      this.flowId = flow
    }
  },
  apollo: {}
}
</script>

<template>
  <v-container class="ma-2 pl-0 pt-0">
    <v-row>
      <v-col class="pa-0" cols="12" md="3" lg="2">
        <v-date-picker
          v-model="date"
          no-title
          class="small-picker pl-0"
          flat
          width="100%"
          height="200px"
        ></v-date-picker>
        <CalendarFlows :day="date" @update="handleSelectedFlow" />
      </v-col>
      <v-col class="pa-0" cols="12" md="9" lg="10">
        <v-toolbar flat color="appBackground" class="pa-0 tbar">
          <v-btn outlined class="mx-4" color="grey darken-2" @click="setToday">
            Today
          </v-btn>
          <v-spacer />
          <v-toolbar-title>
            {{ calTitle }}
          </v-toolbar-title>
          <v-spacer />
          <v-menu bottom right>
            <template #activator="{ on, attrs }">
              <v-btn
                outlined
                color="grey darken-2"
                class="mr-4"
                v-bind="attrs"
                v-on="on"
              >
                <span>{{ typeToLabel[type] }}</span>
                <v-icon right>
                  expand_more
                </v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="type = 'day'">
                <v-list-item-title>Day</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = '4day'">
                <v-list-item-title>4 Days</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-toolbar>

        <CalendarDay
          v-if="flowId"
          :date="date"
          :type="type"
          :flow-id="flowId"
          :calendar-interval="calendarInterval"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
/* stylelint-disable */
.tbar {
  max-height: 50px;
  .v-toolbar__content {
    max-height: 50px;
  }
}

.small-picker {
  width: 25vw;

  .v-date-picker-table--date .v-btn {
    height: 25px;
    width: 25px;
  }

  .v-date-picker-table {
    max-height: 200px;
  }

  .v-btn:not(.v-btn--flat):not(.v-btn--text):not(.v-btn--outlined) {
    background-color: none !important;
  }

  .v-btn:before {
    background-color: #f9f9f9;
  }

  .theme--light {
    background: #f9f9f9;
  }

  .v-date-picker-table--month td {
    height: 30px;
  }
}
</style>
