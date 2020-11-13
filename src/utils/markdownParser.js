import remark from 'remark'
import html from 'remark-html'
import slug from 'remark-slug'

export function parser(md) {
  let result = ''
  if (typeof md === 'string') {
    remark()
      .use(html)
      .use(slug)
      .process(md, (err, file) => {
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
      const allIds = htmlStr.match(/id="(.*?)"/gm).map(id => {
        const getIDName = id.replace(/id="/gm, '#').replace(/^"|"$/g, '')
        return { name: getIDName, file }
      })
      return { name: file, children: allIds }
    })
  return obj
}
