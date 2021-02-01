import { STATE_COLORS } from '@/utils/states'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'

//material design icons
import 'material-design-icons-iconfont/dist/material-design-icons.css'

// Custom icons
import DockerIcon from '@/components/Icons/Docker.vue'
import FargateIcon from '@/components/Icons/Fargate.vue'
import KubernetesIcon from '@/components/Icons/Kubernetes.vue'
import mrIcon from '@/components/Icons/mr.vue'
import NomadIcon from '@/components/Icons/Nomad.vue'
import PrefectIcon from '@/components/Icons/Prefect.vue'
import TwilioIcon from '@/components/Icons/twilio.vue'
import PagerDutyIcon from '@/components/Icons/PagerDuty.vue'
import Hashicorp from '@/components/Icons/Hashicorp.vue'

export const THEME_COLORS = {
  prefect: '#27b1ff', // prefect blue
  primary: '#3b8dff', // primary blue
  primaryDark: '#2580FF',
  primaryLight: '#e0f4ff',
  secondaryGray: '#465968',
  secondaryGrayDark: '#1d252b',
  secondaryGrayLight: '#edf0f3',
  accentPink: '#fe5196',
  accentCyan: '#2edaff',
  accentGreen: '#07e798',
  accentOrange: '#f77062',
  codePink: '#da2072',
  codeBlue: '#0073df',
  codeBlueBright: '#004bff',
  cloudUIPrimaryBlue: '#007acc',
  cloudUIPrimaryDark: '#003d66',
  cloudUIPrimaryLight: '#e0f3ff',
  secondaryBlue: '#3b8dff',
  plan: '#2edaff',
  tertiaryBlue: '#0076ff',
  secondary: '#2F383F', // primary grey-light
  accent: '#1b5da4', // accent blue
  'accent-pink': '#fe5196',
  error: '#FF5252', // alerts error
  info: '#2196F3', // vuetify default
  success: '#4CAF50', // alerts success
  warning: '#FFC107', // alerts warning
  deepRed: '#B00000',
  failRed: '#D50000',
  appBackground: '#f9f9f9'
}

export const THEME_COLORS_ALT = {
  appBackground: '#f9f9f9',
  prefect: '#003d66',
  primary: '#007acc'
}

Vue.use(Vuetify)

const CUSTOM_ICONS = {
  docker: { component: DockerIcon },
  fargate: { component: FargateIcon },
  kubernetes: { component: KubernetesIcon },
  mr: { component: mrIcon },
  nomad: { component: NomadIcon },
  prefect: { component: PrefectIcon },
  twilio: { component: TwilioIcon },
  pagerDuty: { component: PagerDutyIcon },
  hashicorp: { component: Hashicorp }
}

export default new Vuetify({
  icons: {
    iconfont: 'md',
    values: CUSTOM_ICONS
  },
  theme: {
    options: {
      customProperties: true
    },
    themes: {
      // We'll add Core and Cloud themes here
      light: Object.assign({}, THEME_COLORS, STATE_COLORS),
      dark: Object.assign({}, THEME_COLORS, THEME_COLORS_ALT, STATE_COLORS)
    }
  }
})
