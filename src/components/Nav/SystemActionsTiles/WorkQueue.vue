<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  data() {
    return {
      loading: true,
      paused: this.tenant?.settings?.work_queue_paused
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant'])
  },
  watch: {
    'tenant.settings.work_queue_paused'(val) {
      this.queuePaused = val
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapActions('tenant', ['getTenants']),
    async haltWork(e) {
      // this.loading = true
      const value = e.target.checked ? 'resume' : 'pause'

      try {
        const { data } = await this.$apollo.mutate({
          mutation: require(`@/graphql/Nav/${value}-tenant-work-queue.gql`),
          variables: {
            tenantId: this.tenant.id
          }
        })

        if (data?.tenant_work_queue_result?.success) {
          console.log(data.tenant_work_queue_result)
          await this.getTenants()

          this.paused = this.tenant.settings.work_queue_paused
          console.log(this.paused)
        }
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage: e,
          alertType: 'error'
        })
      } finally {
        // this.loading = false
      }
      // console.log(res)
    }
  }
}
</script>

<template>
  <div
    class="rounded-lg system-action-container d-flex flex-column align-center justify-center"
  >
    <div class="system-icon mx-auto" :class="{ active: !paused }">
      <i class="fad fa-list-alt" />
    </div>

    <div class="text-h6 white--text mt-6 mb-2">
      Work queue
    </div>

    <input
      :checked="!paused"
      :indeterminate="loading"
      class="large-switch work-queue"
      type="checkbox"
      @change.stop="haltWork"
    />
  </div>
</template>

<style lang="scss" scoped>
.large-switch {
  appearance: none;
  width: 124px;
  height: 48px;
  display: inline-block;
  position: relative;
  border-radius: 50px;
  overflow: hidden;
  outline: none;
  border: none;
  cursor: pointer;
  background-color: rgba(254, 81, 150, 0.15);
  transition: background-color ease 0.3s;

  &::before {
    background: var(--v-warning-base);
    content: 'Active Paused';
    display: block;
    position: absolute;
    z-index: 2;
    width: 44px;
    height: 44px;
    left: 2px;
    top: 2px;
    border-radius: 50%;
    font: 14px/44px “Source Code Pro”;
    text-transform: uppercase;
    font-weight: bold;
    text-indent: -56px;
    word-spacing: 48px;
    color: #fff;
    white-space: nowrap;
    transition: all cubic-bezier(0.3, 1.5, 0.7, 1) 0.3s;
  }

  &:not(:checked) {
    background-color: rgba(0, 0, 0, 0.35);
  }

  &:checked {
    background-color: rgba(59, 141, 255, 0.35);
  }

  &:indeterminate {
    background-color: rgba(254, 81, 150, 0.15);
  }

  &:checked::before {
    background: var(--v-primary-base);
    left: 78px;
  }
}
</style>
