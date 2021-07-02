<script>
import jsBeautify from 'js-beautify'
import { mapActions } from 'vuex'

export default {
  props: {
    filter: {
      type: Object,
      required: true
    },
    buttonClass: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      menu: false,
      outputType: 'text',
      outputOptions: [
        { text: 'JSON', ext: '.json', value: 'json', icon: 'fad fa-file-code' },
        { text: 'CSV', ext: '.csv', value: 'csv', icon: 'fad fa-file-csv' },
        {
          text: 'Plain Text',
          ext: '.txt',
          value: 'text',
          icon: 'fad fa-file-alt'
        }
      ]
    }
  },
  methods: {
    ...mapActions('alert', ['addNotification', 'updateNotification']),
    createCsvFromLogs(logs) {
      const headers =
        'Timestamp,Level,Message,Tenant ID,Object,Object ID,Log ID\n'
      const content = logs
        .map(log => {
          return `${log.timestamp},${log.level},${log.message},${log.tenant_id},${log.object_table},${log.object_id},${log.id}\n`
        })
        .join('')

      return headers + content
    },
    createJsonFromLogs(logs) {
      return jsBeautify(
        JSON.stringify(
          logs.map(log => ({
            id: log.id,
            timestamp: log.timestamp,
            level: log.level,
            message: log.message,
            tenant_id: log.tenant_id,
            object: log.object_table,
            object_id: log.object_id
          }))
        )
      )
    },
    createTextFromLogs(logs) {
      const headers =
        'Timestamp\tLevel\tMessage\tTenant ID\tObject\tObject ID\tLog ID\n'
      const content = logs
        .map(log => {
          return `${log.timestamp}\t${log.level}\t${log.message}\t${log.tenant_id}\t${log.object_table}\t${log.object_id}\t${log.id}\n`
        })
        .join('')

      return headers + content
    },
    async download() {
      this.loading = true
      let error, mimeType, fileExtension, content
      const notificationId = await this.addNotification({
        color: 'primaryLight',
        loading: true,
        text: 'Downloading...',
        dismissable: false
      })

      try {
        const { data } = await this.$apollo.query({
          query: require('@/graphql/Logs/logs.gql'),
          variables: {
            where: this.filter,
            limit: null,
            offset: null
          }
        })

        switch (this.outputType) {
          case 'csv':
            content = this.createCsvFromLogs(data.log)
            mimeType = 'text/csv'
            fileExtension = 'csv'
            break
          case 'json':
            content = this.createJsonFromLogs(data.log)
            mimeType = 'application/json'
            fileExtension = 'json'
            break
          case 'text':
            content = this.createTextFromLogs(data.log)
            mimeType = 'text/plain'
            fileExtension = 'txt'
            break
          default:
            throw new Error('Unexpected file type found when downloading logs')
        }

        this.menu = false
      } catch (e) {
        error = e
      } finally {
        this.loading = false
        await this.updateNotification({
          id: notificationId,
          notification: {
            color: error ? 'error' : 'primary',
            text: error ? error : 'Finished!',
            loading: false,
            dismissable: true,
            timeout: 7000
          }
        })

        const blob = new Blob([content], { type: mimeType })
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.setAttribute('download', `logs.${fileExtension}`)
        link.click()
      }
    }
  }
}
</script>

<template>
  <v-menu v-model="menu" :close-on-content-click="false" offset-y>
    <template #activator="{ on, attrs }">
      <v-btn
        depressed
        class="px-2"
        small
        text
        :class="buttonClass"
        v-bind="attrs"
        v-on="on"
      >
        <span class="mr-2 primary--text">
          <v-icon class="fad fa-file-download" small />
        </span>

        <span class="text-overline">
          Download
        </span>

        <span>
          <v-icon small>
            {{ menu ? 'arrow_drop_up' : 'arrow_drop_down' }}
          </v-icon>
        </span>
      </v-btn>
    </template>

    <div class="appForeground elevation-1 pa-4">
      <div class="font-weight-light text-h5">Download logs</div>

      <v-select
        v-model="outputType"
        outlined
        label="File type"
        :items="outputOptions"
        dense
        offset-y
        menu-props="auto, offsetY"
        hide-details
        class="mt-4"
        style="width: 300px;"
      >
        <template #item="{ item }">
          <div>
            <v-icon :class="item.icon" small />
            <span class="ml-1">
              {{ item.text }}
              <span class="ml-2 text-caption text--disabled">
                ({{ item.ext }})
              </span>
            </span>
          </div>
        </template>

        <template #selection="{ item }">
          <div>
            <v-icon color="primary" :class="item.icon" small />
            <span class="ml-1">
              {{ item.text }}
              <span class="ml-2 text-caption text--disabled">
                ({{ item.ext }})
              </span>
            </span>
          </div>
        </template>
      </v-select>

      <div class="mt-4 d-flex align-center justify-end">
        <v-btn class="ml-2" depressed small text @click="menu = false">
          Close
        </v-btn>

        <v-btn
          class="ml-2"
          color="primary"
          depressed
          small
          :disabled="!outputType"
          @click="download"
        >
          Download
        </v-btn>
      </div>
    </div>
  </v-menu>
</template>

<style lang="scss" scoped>
/* // */
</style>
