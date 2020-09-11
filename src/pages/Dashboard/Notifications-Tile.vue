<script>
import { mapGetters } from 'vuex'
import CardTitle from '@/components/Card-Title'

export default {
  components: {
    CardTitle
  },
  data() {
    return {
      loadingKey: 0
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    isLoading() {
      return this.loadingKey > 0
    }
  }
}
</script>

<template>
  <v-card class="py-2 position-relative" style="height: 330px;" tile>
    <CardTitle
      title="Recent notifications"
      icon="notifications"
      icon-class="mb-1"
      :loading="isLoading"
    />

    <v-list class="card-content">
      This is where i'd put notificaitons...
    </v-list>

    <v-card-actions>
      <v-spacer />
      <v-btn small color="primary" text>
        View all notifications
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.card-content {
  height: 100%;
  max-height: 210px;
  overflow-y: scroll;
}
</style>
