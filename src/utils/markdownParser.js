import remark from 'remark'
import html from 'remark-html'
import breaks from 'remark-breaks'
import slug from 'remark-slug'

import authNavGuard from '@/middleware/authNavGuard'
import multiguard from 'vue-router-multiguard'
import tenantNavGuard from '@/middleware/tenantNavGuard'

export function parser(md) {
  let result = ''
  if (typeof md === 'string') {
    remark()
      .use(html)
      .use(breaks)
      .use(slug)
      .process(md, function(error, file) {
        result = String(file)
      })
  } else {
    result = `Error! A ${typeof md} was passed in instead of a string`
  }

  return result
}

export function getRoutes() {
  const context = require.context('../pages/Tutorials/Markdown')
  const obj = context
    .keys()
    .map(context)
    .map((content, i) => {
      const htmlStr = parser(content)
      const removeSlash = context.keys()[i].replace(/\//g, '')
      const removePeriod = removeSlash.replace(/\./, '')
      const file = removePeriod.replace(/\.md/, '')
      const allIds = htmlStr
        .match(/id="(.*?)"/gm)
        .map(id => id.replace(/id="/gm, '#').replace(/^"|"$/g, ''))
      return {
        file: context.keys()[i],
        fileName: file,
        ids: allIds
      }
    })
  return obj
}

export function getMDRoutes() {
  const context = require.context('../pages/Tutorials/Markdown', true, /\.md/)
  const routes = context.keys()
  return routes.map(route => {
    const removeSlash = route.replace(/\//g, '')
    const removePeriod = removeSlash.replace(/\./, '')
    const removeMD = removePeriod.replace(/\.md/, '')
    return {
      name: removeMD,
      path: removeMD,
      component: () => import('../pages/Tutorials/Wrapper.vue'),
      beforeEnter: multiguard([authNavGuard, tenantNavGuard])
    }
  })
}
