<script>
import LogRocket from 'logrocket'
import { mapActions, mapGetters } from 'vuex'
import { clearCache } from '@/vue-apollo'

import { adjectives } from '@/components/RunConfig/adjectives'
import { animals } from '@/components/RunConfig/animals'

const adjectivesLength = adjectives.length
const animalsLength = animals.length

export default {
  data() {
    return {
      currentTeam: null,
      loading: false,
      teamName: this.generateRandomName(),
      teamSlug: null,
      slugErrors: [],

      // Regexes to check if a slug is invalid
      slugCharRegex: /^[a-z0-9|-]*$/,
      dashPositionRegex: /^(-)|-{2,}|(-)$/,
      unsubscribeTenants: null
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'tenants'])
  },
  watch: {
    teamName(val) {
      try {
        this.teamSlug = this.slugifyString(val)
      } catch {
        /* */
      }
    }
  },
  mounted() {
    this.teamSlug = this.slugifyString(this.teamName)
    this.currentTeam = this.tenant.slug
  },
  async beforeMount() {
    this.unsubscribeTenants = await this.$store.dispatch(
      'polling/subscribe',
      'tenants'
    )
  },
  beforeDestroy() {
    this.unsubscribeTenants()
  },
  methods: {
    ...mapActions('alert', ['addNotification', 'updateNotification']),
    ...mapActions('data', ['resetData']),
    ...mapActions('tenant', ['setCurrentTenant', 'updateTenantSettings']),
    ...mapActions('user', ['getUser']),
    generateRandomName() {
      const adjective = adjectives[Math.floor(Math.random() * adjectivesLength)]
      const animal = animals[Math.floor(Math.random() * animalsLength)]
      return (
        adjective.charAt(0).toUpperCase() +
        adjective.slice(1) +
        ' ' +
        animal.charAt(0).toUpperCase() +
        animal.slice(1) +
        's'
      )
    },
    slugifyString(str) {
      return encodeURI(
        str
          .replace(' ', '-')
          .replace(/[^a-zA-Z0-9-_]/g, '')
          .toLowerCase()
      )
    },
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
          'URL slugs cannot begin or end with a dash or contain more than 1 dash in a row.'
        ]
      }
    },
    async createTenant() {
      let error
      this.loading = true

      const notificationId = await this.addNotification({
        color: 'primaryLight',
        loading: true,
        text: 'Creating team...',
        dismissable: false
      })

      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/Tenant/create-enterprise-tenant.gql'),
          variables: {
            input: {
              name: this.teamName,
              slug: this.teamSlug
            }
          }
        })

        await this.getUser()
        await this.$globalApolloQueries['tenants']?.refetch()

        // This makes sure we don't route to the welcome screen
        // after switching to the tenant
        localStorage.setItem('haltTenantRouting', true)
        await this.setCurrentTenant(this.teamSlug)

        await this.updateTenantSettings({
          teamNamed: true
        })

        this.$emit('team-created')

        this.resetData()

        clearCache()

        await this.updateNotification({
          id: notificationId,
          notification: {
            color: 'primary',
            text: 'Team created!',
            loading: false,
            subtext: this.teamName,
            dismissable: true,
            timeout: 10000
          }
        })
      } catch (e) {
        error = e

        if (e?.toString().includes('Uniqueness violation')) {
          this.slugErrors = ['Sorry, that URL slug is already in use.']
        } else {
          LogRocket.captureException(e)
        }
        // eslint-disable-next-line no-console
        console.error(e)
      } finally {
        this.loading = false
        await this.updateNotification({
          id: notificationId,
          notification: {
            color: error ? 'error' : 'primary',
            text: error
              ? 'There was a problem creating your team. If the issue persists, contact help@prefect.io.'
              : 'Team created!',
            loading: false,
            subtext: error ? error : this.teamName,
            dismissable: true,
            timeout: 10000
          }
        })
      }
    }
  }
}
</script>

<template>
  <v-card class="utilGrayDark--text mx-4 " flat outlined>
    <v-card-text>
      <v-container fluid>
        <v-row class="my-2 pb-8" no-gutters>
          <v-col cols="12">
            <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
              <div class="text-h4 font-weight-light">
                Create your team
              </div>
            </div>
          </v-col>
        </v-row>

        <v-row class="my-2 pb-8" no-gutters>
          <v-col cols="12" md="3">
            <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
              <div class="text-h5">
                Name
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="9">
            <div class=" mt-4 mt-md-0 d-flex align-center">
              <v-btn
                color="primary"
                fab
                depressed
                x-small
                title="Randomize team name"
                @click="teamName = generateRandomName()"
              >
                <v-icon>fad fa-random</v-icon>
              </v-btn>

              <v-text-field
                v-model="teamName"
                placeholder="Team name"
                class="ml-2 text-h5"
                hide-details
                outlined
                dense
                :disabled="loading"
              />
            </div>
          </v-col>
        </v-row>

        <v-row class="my-2 pb-8" no-gutters>
          <v-col cols="12" md="3">
            <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
              <div class="text-h5">
                Slug
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="9">
            <div class=" mt-4 mt-md-0 d-flex align-center">
              <v-text-field
                v-model="teamSlug"
                placeholder="URL slug"
                class="ml-2 text-h5"
                outlined
                :error-messages="slugErrors"
                dense
                :disabled="loading"
                @change="checkSlug"
              />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>

    <v-card-actions class="create-tenant-actions px-4 d-flex align-center">
      <v-spacer></v-spacer>

      <v-btn
        class="text-none text-h5 px-4"
        color="primary"
        depressed
        x-large
        :loading="loading"
        :disabled="teamName && teamSlug && slugErrors.length > 0"
        @click="createTenant"
      >
        Create
        <!-- <i class="fad fa-rocket ml-2" /> -->
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.create-tenant-actions {
  background-color: var(--v-appForeground-base);
  border-top: 1px solid var(--v-utilGrayLight-base);
  height: 86px;
  width: 100%;
}
</style>
