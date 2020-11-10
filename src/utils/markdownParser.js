import marked from 'marked'

export function parser(md) {
  let result = ''
  if (typeof md === 'string') {
    result = marked(md, { gfm: true, breaks: true })
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
