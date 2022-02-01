<script>
const socialIcons = [
  {
    alt: 'GitHub',
    link: 'https://github.com/PrefectHQ',
    icon: 'fab fa-github'
  },
  {
    alt: 'Slack',
    link: 'https://prefect-community.slack.com',
    icon: 'fab fa-slack'
  },
  {
    alt: 'Twitter',
    link: 'https://twitter.com/PrefectIO',
    icon: 'fab fa-twitter'
  },
  {
    alt: 'Instagram',
    link: 'https://www.instagram.com/prefect.io',
    icon: 'fab fa-instagram'
  }
]
const links = [
  {
    text: 'Docs',
    link: 'https://docs.prefect.io/'
  },
  {
    text: 'Legal',
    link:
      'https://www.prefect.io/legal/prefect-cloud-software-as-a-service-saas-agreement'
  },
  {
    text: 'Community',
    link: 'https://www.prefect.io/community/updates'
  },
  {
    text: 'Blog',
    link: 'https://medium.com/the-prefect-blog'
  },
  {
    text: 'Careers',
    link: 'https://www.prefect.io/about/company#careers'
  },
  {
    text: 'Changelog',
    link: 'https://www.prefect.io/public-changelog/'
  }
]

const insetRoutes = ['user', 'tutorials']

export default {
  data() {
    return {
      visible: false
    }
  },
  computed: {
    inset() {
      return insetRoutes.includes(this.$route.path.split('/')[1])
    },
    linksLeft() {
      return links.slice(0, Math.ceil(links.length / 2))
    },
    linksRight() {
      return links.slice(Math.ceil(links.length / 2))
    },
    socialIconsLeft() {
      return socialIcons.slice(0, Math.ceil(socialIcons.length / 2))
    },
    socialIconsRight() {
      return socialIcons.slice(Math.ceil(socialIcons.length / 2))
    }
  },
  methods: {
    onIntersect([entry]) {
      this.visible = entry.isIntersecting
    }
  }
}
</script>

<template>
  <div v-intersect="onIntersect">
    <v-slide-y-reverse-transition>
      <v-footer
        v-if="visible"
        color="transparent"
        padless
        absolute
        :inset="inset"
        :class="{
          'sm-and-down-left-padding': inset && $vuetify.breakpoint.smAndDown,
          'sm-and-up-left-padding': inset && $vuetify.breakpoint.smAndUp,
          'sm-and-down-bottom-padding': $vuetify.breakpoint.smAndDown
        }"
      >
        <v-card flat tile width="100%" class="transparent">
          <v-divider class="mx-auto" style="max-width: 1440px;"></v-divider>

          <v-card-text class="d-flex align-center justify-center">
            <div class="block d-flex flex-column align-end justify-start">
              <div>
                <v-btn
                  v-for="(icon, i) in socialIconsLeft"
                  :key="i"
                  :href="icon.link"
                  target="_blank"
                  depressed
                  icon
                  :class="inset ? 'ml-2' : 'ml-4'"
                >
                  <v-icon>{{ icon.icon }}</v-icon>
                </v-btn>
              </div>

              <div
                class="mr-1 mt-4 d-flex w-100 flex-wrap"
                :class="{
                  'justify-space-between': $vuetify.breakpoint.smAndUp,
                  'justify-end': $vuetify.breakpoint.xsOnly,
                  'text-right': $vuetify.breakpoint.xsOnly
                }"
              >
                <div
                  v-for="(link, i) in linksLeft"
                  :key="i"
                  style="min-width: 66px;"
                >
                  <a class="link" :href="link.link">
                    {{ link.text }}
                  </a>
                </div>
              </div>
            </div>

            <div
              class="text-center"
              :class="{
                'mx-16': $vuetify.breakpoint.mdAndUp,
                'mx-2': $vuetify.breakpoint.smAndDown
              }"
            >
              <div class="text-overline">Made with ♡ in DC</div>

              <a href="https://prefect.io" target="_blank">
                <img
                  class="logo mt-2"
                  src="@/assets/logos/logomark-cerulean.svg"
                  alt="The Prefect Logo"
                />
              </a>
            </div>

            <div class="block d-flex flex-column align-start justify-start">
              <div>
                <v-btn
                  v-for="(icon, i) in socialIconsRight"
                  :key="i"
                  :href="icon.link"
                  target="_blank"
                  depressed
                  icon
                  :class="inset ? 'mr-2' : 'mr-4'"
                >
                  <v-icon>{{ icon.icon }}</v-icon>
                </v-btn>
              </div>

              <div class="ml-1 mt-4 d-flex w-100 flex-wrap">
                <div
                  v-for="(link, i) in linksRight"
                  :key="i"
                  :class="{
                    'justify-space-between': $vuetify.breakpoint.smAndUp,
                    'justify-start': $vuetify.breakpoint.xsOnly,
                    'text-left': $vuetify.breakpoint.xsOnly
                  }"
                  style="min-width: 66px;"
                >
                  <a class="link" :href="link.link">
                    {{ link.text }}
                  </a>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-footer>
    </v-slide-y-reverse-transition>
  </div>
</template>

<style lang="scss" scoped>
.logo {
  filter: grayscale(1);
  height: 50px;
  width: auto;
}

.block {
  width: 200px;
}

.w-100 {
  width: 100%;
}

.sm-and-up-left-padding {
  // Match left padding with sidebar widths
  padding-left: 256px;
}

.sm-and-down-left-padding {
  // Match left padding with collapsed sidebar widths
  padding-left: 56px;
}

.sm-and-down-bottom-padding {
  // padding-bottom: 56px;
}
</style>
