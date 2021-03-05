<script>
//This page will need updating!
import { featureFlaggedCloudHookTypes } from '@/utils/cloudHooks'
import { mapGetters } from 'vuex'
const date = new Date().toDateString()

export default {
  data() {
    return {
      addName: false,
      tempType: '',
      messageType: { title: 'send a' },
      openSendMessage: true,
      openMessageConfig: false,
      messageConfig: { name: 'a URL' },
      messageText: 'default message',
      openMessageText: false,
      openName: false,
      newConfigName: '',
      isPagerDuty: false,
      isTwilio: false
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('user', ['user']),
    configName: {
      get() {
        return `send ${this.messageType.title} created by ${this.user.first_name} on ${date}`
      },
      set(x) {
        this.newConfigName = x
      }
    }
  },
  methods: {
    selectMessageType(type) {
      this.messageType = type
    },
    handleClose() {
      this.$emit('close-action')
    },
    actionTypes() {
      let allHooks
      //   if (
      //     this.canEdit &&
      //     this.editable &&
      //     this.tenant.prefectAdminSettings?.notifications
      //   ) {
      allHooks = featureFlaggedCloudHookTypes
      //   } else {
      //     allHooks =
      //       this.canEdit && this.editable
      //         ? openCloudHookTypes
      //         : openCloudHookTypes.filter(t => t.type == this.hook.type)
      //   }
      return allHooks.filter(
        t => (t.requiresCloud && this.isCloud) || !t.requiresCloud
      )
    }
  }
}
</script>

<template>
  <v-card elevation="0">
    <div class="pb-1 pt-2"
      ><v-btn
        text
        class="grey--text text--darken-2 light-weight-text"
        @click="handleClose"
      >
        <v-icon>chevron_left</v-icon
        ><span style="text-transform: none;">Back </span></v-btn
      >
    </div>
    <div class="headline black--text ma-4">
      <v-btn
        :style="{ 'text-transform': 'none', 'min-width': '0px' }"
        :color="openSendMessage ? 'codePink' : 'grey'"
        class="px-0 pb-1 headline"
        text
        @click="openSendMessage = !openSendMessage"
        >{{ messageType.title }}</v-btn
      >
      {{ ' ' }}
      <span>
        <v-btn
          :style="{ 'text-transform': 'none', 'min-width': '0px' }"
          class="px-0 pb-1 headline"
          text
          :color="openMessageText ? 'codePink' : 'grey'"
          @click="openMessageText = !openMessageText"
        >
          {{ messageText }}</v-btn
        >
      </span>
      to
      <v-btn
        :style="{ 'text-transform': 'none', 'min-width': '0px' }"
        class="px-0 pb-1 headline"
        text
        :color="openMessageConfig ? 'codePink' : 'grey'"
        @click="openMessageConfig = !openMessageConfig"
      >
        {{ messageConfig.name }}</v-btn
      >
      <span v-if="isTwilio"> for</span>

      <span v-if="isPagerDuty"> </span>

      .
    </div>

    <v-card-text v-if="openSendMessage" class="pt-0">
      <v-chip
        v-for="type in actionTypes()"
        :key="type.title"
        label
        :color="messageType === type ? 'codePink' : 'grey'"
        class="ma-1"
        outlined
        @click="selectMessageType(type)"
      >
        <v-icon left class="mr-2">
          {{ type.icon }}
        </v-icon>
        {{ type.title }}
      </v-chip>
    </v-card-text>
    <div class="mx-4">
      <v-checkbox
        v-model="addName"
        label="Save this config so I can use it again"
      >
      </v-checkbox>
      <v-text-field
        v-if="addName"
        v-model="configName"
        label="Save as"
        @keyup.enter="saveName()"
      ></v-text-field>
    </div>
    <div class="text-right mb-4 mr-4">
      <v-btn color="primary">
        Save Config
      </v-btn>
    </div>
  </v-card>
</template>
