import remark from 'remark'
import recommended from 'remark-preset-lint-recommended'
import html from 'remark-html'

export function parser(md) {
  let result = ''
  remark()
    .use(recommended)
    .use(html)
    .process(md, function(error, file) {
      if(error) {
        result = error
      }
      result = String(file)
    })
  return result
}

