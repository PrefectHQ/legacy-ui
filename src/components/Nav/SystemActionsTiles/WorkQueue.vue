<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  data() {
    return {
      loading: true
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    paused() {
      return this.tenant?.settings?.work_queue_paused
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapActions('tenant', ['getTenants']),
    async haltWork() {
      this.loading = true
      const value = this.paused ? 'resume' : 'pause'

      try {
        const { data } = await this.$apollo.mutate({
          mutation: require(`@/graphql/Nav/${value}-tenant-work-queue.gql`),
          variables: {
            tenantId: this.tenant.id
          }
        })

        if (data?.tenant_work_queue_result?.success) {
          this.getTenants()
        }
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage: e,
          alertType: 'error'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<template>
  <button
    class="rounded-lg action-container d-flex flex-column align-center justify-center"
    :disabled="loading"
    @click="haltWork"
  >
    <div class="system-icon mx-auto" :class="{ active: !paused }">
      <i class="fad fa-list-alt" />
    </div>

    <div class="text-h6 white--text mt-2 mb-2">
      Work queue
    </div>

    <div>
      <input
        ref="checkbox"
        class="large-switch work-queue"
        :class="{ loading: loading, active: !paused }"
        :disabled="loading"
        type="checkbox"
      />
    </div>
  </button>
</template>

<style lang="scss" scoped>
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.large-switch {
  appearance: none;
  background-color: rgba(254, 81, 150, 0.15);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  display: inline-block;
  height: 48px;
  outline: none;
  overflow: hidden;
  position: relative;
  transition: background-color ease 0.3s;
  width: 124px;

  &:disabled {
    cursor: not-allowed;
  }

  &::before {
    background: rgba(255, 193, 7, 1);
    border-radius: 50%;
    color: #fff;
    content: 'Active Paused';
    display: block;
    font: 14px/44px 'Roboto', sans-serif;
    font-weight: bold;
    height: 44px;
    left: 2px;
    position: absolute;
    text-indent: -56px;
    text-transform: uppercase;
    top: 2px;
    transition: all cubic-bezier(0.3, 1.5, 0.7, 1) 0.3s;
    white-space: nowrap;
    width: 44px;
    word-spacing: 58px;
    z-index: 2;
  }

  &::after {
    animation: spin 2s cubic-bezier(0, 0.87, 0.92, 0.91) 0.3s infinite;
    background-color: transparent;
    border: 6px solid transparent;
    border-radius: 50%;
    border-right: 6px solid #fff;
    content: '';
    display: block;
    height: 44px;
    left: 2px;
    opacity: 0;
    position: absolute;
    top: 2px;
    transition: opacity 50ms;
    width: 44px;
    z-index: 3;
  }

  &:not(.active) {
    background-color: rgba(0, 0, 0, 0.35);
  }

  &.active {
    background-color: rgba(59, 141, 255, 0.45);

    &::before {
      background: var(--v-primary-base);
    }

    &::after,
    &::before {
      left: 78px;
    }
  }

  &.loading {
    &::after {
      opacity: 1;
    }
  }

  &.loading.active {
    background-color: rgba(59, 141, 255, 0.15);

    &::before,
    &::after {
      left: 78px !important;
    }
  }

  &.loading:not(.active) {
    background-color: rgba(255, 193, 7, 0.15);

    &.active {
      &::before,
      &::after {
        left: 2px !important;
      }
    }
  }
}

.action-container {
  background-color: #455a64;
  height: 100%;
  margin: auto;
  padding: 36px;
  position: relative;
  transition: transform 150ms ease-in-out;
  width: 220px;

  &:focus {
    outline: none;
  }

  &:active {
    outline: none;
    transform: scale(0.97);
  }

  &:disabled {
    background-color: #90a4ae;
    color: #eee;
    cursor: not-allowed;
  }
}
</style>
