import { mapGetters, mapActions } from 'vuex'

export const teamProfileMixin = {
  data() {
    return {
      // User inputs
      tenantChanges: {
        name: '',
        slug: ''
      },

      // Regexes to check if a slug is invalid
      slugCharRegex: /^[a-z0-9|-]*$/,
      dashPositionRegex: /^(-)|-{2,}|(-)$/,

      // Flags that are set to true during async vaidation checks
      isCheckingName: false,
      isCheckingSlug: false,

      // Flag input icons so that they are only revealed during submission & validation
      showNameIcon: false,
      showSlugIcon: false,

      // Input errors
      nameErrors: [],
      slugErrors: [],

      // Form is submitted & tenant is updating
      isUpdatingTenant: false,

      // Tenant update returns a server error
      updateServerError: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('license', ['hasPermission']),
    permissionsCheck() {
      return this.hasPermission('update', 'tenant')
    },
    isUpdatable() {
      // Tenant cannot be updated during any kind of load state
      if (this.isUpdatingTenant) return false
      if (this.isCheckingSlug) return false

      // Tenant cannot be updated if any errors exist
      if (
        this.updateServerError ||
        this.nameErrors.length > 0 ||
        this.slugErrors.length > 0
      ) {
        return false
      }

      return (
        this.tenantChanges.name !== this.tenant.name ||
        this.tenantChanges.slug !== this.tenant.slug
      )
    },
    slug: {
      get() {
        return this.tenantChanges.slug
      },
      set(val) {
        this.tenantChanges.slug = val.replace(' ', '-')
      }
    },
    name: {
      get() {
        return this.tenantChanges.name
      },
      set(val) {
        this.tenantChanges.name = val
      }
    },
    showNameCheck() {
      return (
        this.showNameIcon &&
        this.nameErrors.length === 0 &&
        !this.updateServerError
      )
    },
    showNameClear() {
      return (
        this.showNameIcon &&
        (this.nameErrors.length > 0 || this.updateServerError)
      )
    },
    showSlugCheck() {
      return (
        this.showSlugIcon &&
        this.slugErrors.length === 0 &&
        !this.updateServerError
      )
    },
    showSlugClear() {
      return (
        this.showSlugIcon &&
        (this.slugErrors.length > 0 || this.updateServerError)
      )
    }
  },
  watch: {
    tenant(val) {
      this.tenantChanges.name = val.name || ''
      this.tenantChanges.slug = val.slug || ''
    }
  },
  created() {
    this.tenantChanges.name = this.tenant.name || ''
    this.tenantChanges.slug = this.tenant.slug || ''
  },
  methods: {
    ...mapActions('tenant', [
      'setCurrentTenant',
      'updateTenantSettings',
      'getTenants'
    ]),
    ...mapActions('alert', ['setAlert']),
    // Synchronous name check that occur on input blur
    checkName(name) {
      this.nameErrors = []

      // If name is not provided, reset to original value
      //
      // Make this field required if there is no original value
      if (name === '') {
        if (!this.tenant.name) {
          this.nameErrors = ['A team name is required.']
        } else {
          this.tenantChanges.name = this.tenant.name
        }
        return
      }

      if (name.length < 3) {
        this.nameErrors = ['Team names must contain a minimum of 3 characters.']
        return
      }
    },
    // Synchronous slug input check that occurs on input blur
    checkSlug(slug) {
      this.slugErrors = []

      // If slug is not provided, reset to original value
      //
      // Make this field required if there is no original value
      if (slug === '') {
        if (!this.tenant.slug) {
          this.slugErrors = ['A URL slug for your team is required.']
        } else {
          this.tenantChanges.slug = this.tenant.slug
        }
        return
      }

      if (slug.length < 3) {
        this.slugErrors = ['URL slug must contain a minimum of 3 characters.']
        return
      }

      if (!this.slugCharRegex.test(slug)) {
        this.slugErrors = [
          'URL slugs can only contain lowercase letters, numbers, and dashes.'
        ]
        return
      }

      if (this.dashPositionRegex.test(slug)) {
        this.slugErrors = [
          'URL slugs cannot begin, end, or contain more than 1 dash in a row.'
        ]
      }
    },
    // Asynchronous name input "check" that occurs when user attempts to submit the form
    //
    // Quotes around "check" because a check doesn't actually occur
    //
    // Instead, a timeout is returned purely to surface a loader on the UI to keep it
    // inline with the slug async check
    checkNameAsync() {
      // Stop immediately if the input never changed
      if (this.showNameIcon) return

      this.isCheckingName = true

      return new Promise(resolve => {
        setTimeout(() => {
          this.showNameIcon = true
          this.isCheckingName = false
          resolve()
        }, 750)
      })
    },
    // Asynchronous slug input check that occurs when user attempts to submit the form
    //
    // Currently checks only for slug uniqueness
    checkSlugAsync() {
      // Stop immediately if the input never changed
      if (this.showSlugIcon) return

      this.isCheckingSlug = true

      return new Promise(resolve => [
        setTimeout(async () => {
          // Check slug uniqueness
          try {
            const checkSlug = await this.$apollo.query({
              query: require('@/graphql/Tenant/tenant-by-slug.gql'),
              variables: {
                slug: this.slug
              }
            })
            if (
              checkSlug?.data?.tenant?.length !== 0 &&
              this.slug != this.tenant.slug
            ) {
              this.slugErrors = ['Sorry, that URL slug is already in use.']
            }
          } catch {
            this.updateServerError = true
          }

          this.showSlugIcon = true
          this.isCheckingSlug = false
          resolve()
        }, 750)
      ])
    },
    resetNameMetadata() {
      this.showNameIcon = false
      this.nameErrors = []
      this.updateServerError = false
    },
    resetSlugMetadata() {
      this.showSlugIcon = false
      this.slugErrors = []
      this.updateServerError = false
    },
    handleError(alert) {
      this.setAlert({
        alertMessage:
          alert ||
          'Something went wrong while trying to update your team profile settings. Please try again later.',
        alertType: 'error',
        alertShow: true
      })
    },
    handleSuccess() {
      this.setAlert({
        alertMessage:
          "Your team's profile settings have been successfully updated.",
        alertType: 'success',
        alertShow: true
      })
      setTimeout(() => {
        this.resetNameMetadata()
        this.resetSlugMetadata()
      }, 3000)
    },
    async updateTenant() {
      if (this.nameErrors.length > 0 || this.slugErrors.length > 0) {
        return
      }
      this.updateServerError = false
      this.isUpdatingTenant = true

      // Async tenant checks
      await this.checkNameAsync()
      await this.checkSlugAsync()

      if (
        this.tenantChanges.slug == this.tenant.slug &&
        this.tenantChanges.name == this.tenant.name
      ) {
        await this.updateTenantSettings({
          teamNamed: true
        })

        this.handleSuccess()
        this.isUpdatingTenant = false
        return
      }

      let newTenant

      try {
        newTenant = await this.$apollo.mutate({
          mutation: require('@/graphql/Tenant/update-tenant.gql'),
          variables: {
            name: this.tenantChanges.name || this.tenant.name,
            slug: this.tenantChanges.slug || this.tenant.slug
          }
        })
      } catch (error) {
        // Otherwise, surface the global error alert.
        const e = error.toString()
        const alert = e.includes('Uniqueness violation')
          ? 'Sorry, that URL slug is already in use. Please try another URL Slug.'
          : null
        this.handleError(alert)
        this.updateServerError = true
        this.isUpdatingTenant = false
        return
      }
      if (
        !newTenant?.data?.update_tenant_name ||
        !newTenant?.data?.update_tenant_slug
      ) {
        this.handleError()
        this.updateServerError = true
        return
      }

      await this.getTenants()
      await this.setCurrentTenant(this.tenantChanges.slug)

      this.$router.replace({
        name: 'account',
        params: { tenant: this.tenantChanges.slug }
      })

      this.handleSuccess()
      this.isUpdatingTenant = false
    }
  }
}
