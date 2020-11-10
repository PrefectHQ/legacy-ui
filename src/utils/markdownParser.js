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
