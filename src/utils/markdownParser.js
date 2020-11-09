import remark from 'remark'
import html from 'remark-html'
import breaks from 'remark-breaks'
import slug from 'remark-slug'

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

export function mdRoutes() {
  const mdFiles = require
    .context('../pages/Tutorials/Markdown', true, /\.md/)
    .keys()
  return mdFiles.map(file => {
    const name = file
      .replace(/\//g, '')
      .replace(/\./, '')
      .replace(/\.md/, '')
    return {
      name,
      path: name,
      component: () => import('@/pages/Tutorials/Wrapper.vue')
    }
  })
}
