<script>
import { teamProfileMixin } from '@/mixins/teamProfileMixin.js'
import PlanCard from '@/components/PlanCard'
export default {
  components: { PlanCard },
  mixins: [teamProfileMixin],

  data() {
    return {
      disabled: false,
      loading: false,
      height: '',
      // Reveal animation bools
      revealNote: false,
      revealNameInput: false,
      revealUrlInput: false,
      revealPendingTeams: false,
      revealConfirm: false
    }
  },
  computed: {},
  mounted() {
    this.tenantChanges.name = this.tenant.name
    this.tenantChanges.slug = this.tenant.slug

    setTimeout(() => {
      this.revealNote = true

      setTimeout(() => {
        this.height = getComputedStyle(this.$refs['main-row']).height
      })
    }, 500)

    setTimeout(() => {
      this.revealNameInput = true
      this.revealUrlInput = true
      this.revealPendingTeams = true
      this.revealConfirm = true

      setTimeout(() => {
        this.height = getComputedStyle(this.$refs['main-row']).height
      })
    }, 1000)
  },
  methods: {
    goToResources() {
      this.$router.push({
        name: 'onboard-resources',
        params: { tenant: this.tenant.slug }
      })
    }
  }
}
</script>
<template>
  <v-card
    v-if="tenant.id"
    class="text-center mx-auto px-12 py-8 white--text"
    flat
    tile
    style="width: fit-content !important;"
    color="transparent"
  >
    <v-row
      align="center"
      justify="center"
      :style="{ 'max-height': height }"
      class="transition-height"
    >
      <div ref="main-row">
        <transition-group name="fade">
          <v-col v-if="revealNote" key="name" cols="12" class="pb-4">
            <div class="display-1 text-center"
              >You'll start on the Starter Plan</div
            >

            <div class="body-2 text--darken-1 py-4">
              (If you want to add more task runs or get cool features like
              alerts or concurrency limits, you can upgrade later.)
            </div>
            <div
              style="display: flex;
            flex-direction: row;"
              class="py-8"
            >
              <PlanCard plan="good" selected class="elevation-4" />
              <span
                style="
              transform: scale(0.9);
              transform-origin: left;"
                ><PlanCard
                  plan="better"
                  class="elevation-2"
                  style="filter: contrast(65%);"
              /></span>
              <span
                style="
              transform: scale(0.8);
              transform-origin: -50%;"
                ><PlanCard
                  plan="best"
                  class="elevation-0"
                  style="filter: contrast(35%);"
              /></span>
            </div>
          </v-col>
          <v-col
            v-if="revealConfirm"
            key="revealConfirm"
            cols="12"
            class="my-2"
          >
            <v-btn
              v-if="tenant.role == 'TENANT_ADMIN'"
              color="primary"
              width="auto"
              data-cy="submit-team-info"
              :loading="loading > 0"
              :disabled="disabled"
              @click="goToResources"
            >
              OK!
              <v-icon right>arrow_right</v-icon>
            </v-btn>
          </v-col>
        </transition-group>
      </div>
    </v-row>
  </v-card>
</template>

<style lang="scss" scoped>
.h-80 {
  min-height: calc(80vh - 64px) !important;
}

.transition-height {
  transition: max-height 500ms ease;
}

.name-team-input {
  max-width: 700px;
}

.w-100 {
  width: 100vw;
}
</style>
