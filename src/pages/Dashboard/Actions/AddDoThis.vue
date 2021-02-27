<script>
//This page will need updating!
import { featureFlaggedCloudHookTypes } from '@/utils/cloudHooks'
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      tempType: ''
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud'])
  },
  methods: {
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
  <v-card>
    <div class="text-right">
      <v-btn icon @click="handleClose"><v-icon>close</v-icon></v-btn>
    </div>
    <v-card-text class="pt-0">
      <div>
        <v-row>
          <v-col>
            How should we send a message?
            <v-chip-group v-model="tempType" column mandatory>
              <v-chip
                v-for="type in actionTypes()"
                :key="type.title"
                class="px-6"
                label
                :value="type.type"
                large
              >
                <v-icon left class="mr-2">
                  {{ type.icon }}
                </v-icon>
                {{ type.title }}
              </v-chip>
            </v-chip-group>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
  </v-card>
</template>
