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
      loading: false,
      refetching: false,
      type: 'day',
      flowId: null,
      typeToLabel: {
        day: 'Day',
        '4day': '4 Days'
      },
      refresh: false,
      timeout: null
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    ...mapGetters('api', ['backend', 'connected']),
    calTitle() {
      return this.getMonth(this.date)
    }
  },
  watch: {
    async tenant() {
      clearTimeout(this.timeout)
      this.refresh = true
      this.timeout = setTimeout(() => {
        this.refresh = false
      }, 2000)
      this.flowId = null
    },
    async backend() {
      clearTimeout(this.timeout)
      this.refresh = true
      this.timeout = setTimeout(() => {
        this.refresh = false
      }, 3000)
      this.flowId = null
    }
  },
  methods: {
    setToday() {
      this.date = this.formatCalendarDate(new Date())
    },
    handleSelectedFlow(flow) {
      this.flowId = flow
    },
    handleLoad(bool) {
      this.loading = bool
    },
    prev() {
      const day = this.subtractDay(this.date, 1)
      this.date = this.formatCalendarDate(day)
    },
    next() {
      const day = this.addDay(this.date, 1)
      this.date = this.formatCalendarDate(day)
    }
  }
}
</script>

<template>
  <div v-if="!refresh" class="mt-6 ma-2 pl-0 pt-0">
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
          <v-row>
            <v-col cols="12" sm="4">
              <v-btn
                outlined
                class="mx-4"
                color="utilGrayMid"
                @click="setToday"
              >
                Today
              </v-btn>
              <v-btn
                v-if="$vuetify.breakpoint.smAndUp"
                fab
                text
                small
                color="utilGrayMid"
                @click="prev"
              >
                <v-icon>
                  chevron_left
                </v-icon>
              </v-btn>
              <v-btn
                v-if="$vuetify.breakpoint.smAndUp"
                fab
                text
                small
                color="utilGrayMid"
                @click="next"
              >
                <v-icon>
                  chevron_right
                </v-icon>
              </v-btn>
            </v-col>
            <v-col
              v-if="$vuetify.breakpoint.smAndUp"
              cols="4"
              class="text-center mt-2"
            >
              <v-toolbar-title>
                {{ calTitle }}
              </v-toolbar-title>
            </v-col>
            <v-col cols="6" sm="4" class="text-right">
              <v-menu bottom right>
                <template #activator="{ on, attrs }">
                  <v-btn
                    outlined
                    color="utilGrayMid"
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
            </v-col>
            <v-progress-linear
              absolute
              bottom
              :active="loading"
              :indeterminate="loading"
              color="primary"
            ></v-progress-linear>
          </v-row>
        </v-toolbar>

        <CalendarDay
          v-if="flowId"
          :date="date"
          :type="type"
          :flow-id="flowId"
          :calendar-interval="calendarInterval"
          @loading="handleLoad"
        />
      </v-col>
    </v-row>
  </div>
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
  .v-date-picker-table--date .v-btn {
    height: 25px;
    width: 25px;
  }

  .v-date-picker-years {
    width: 250px;
  }

  .v-date-picker-table {
    max-height: 200px;
  }

  .v-date-picker-header__value button {
    padding: 0;
  }

  .v-btn:not(.v-btn--flat):not(.v-btn--text):not(.v-btn--outlined) {
    background-color: none !important;
  }

  .v-btn:before {
    background-color: var(--v-appBackground-base);
  }

  .theme--light {
    background: var(--v-appBackground-base);
  }

  .v-date-picker-table--month td {
    height: 30px;
  }
}
</style>
