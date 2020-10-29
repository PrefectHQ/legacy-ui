import remark from 'remark'
import html from 'remark-html'
import breaks from 'remark-breaks'

export function parser(md) {
  let result = ''
  if (typeof md === 'string') {
    remark()
      .use(html)
      .use(breaks)
      .process(md, function(error, file) {
        result = String(file)
      })
  } else {
    result = `Error! A ${typeof md} was passed in instead of a string`
  }

  return result
}
