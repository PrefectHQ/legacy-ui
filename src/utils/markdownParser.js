import remark from 'remark'
import html from 'remark-html'
import breaks from 'remark-breaks'
import slug from 'remark-slug'
import headings from 'remark-autolink-headings'
import gfm from 'remark-gfm'
import all from 'mdast-util-to-hast/lib/all'
import normalize from 'mdurl/encode'
import u from 'unist-builder'
import table from 'mdast-util-to-hast/lib/handlers/table'

export function parser(md) {
  let result = ''
  if (typeof md === 'string') {
    remark()
      .use(breaks)
      .use(slug)
      .use(headings, {
        content: {
          type: 'text',
          value: '# '
        }
      })
      .use(html, {
        sanitize: {
          clobberPrefix: ''
        }
      })
      .process(md, (err, file) => {
        result = String(file)
      })
  } else {
    result = `Error! A ${typeof md} was passed in instead of a string`
  }
  return result
}

export function artifact_parser(md) {
  let result = ''
  if (typeof md === 'string') {
    remark()
      .use(breaks)
      .use(slug)
      .use(gfm)
      .use(html, {
        handlers: {
          heading: function(h, node) {
            node.data = {
              hProperties: { className: ['h' + node.depth, 'mt-6'] }
            }
            return h(node, 'h' + node.depth, all(h, node))
          },
          link: function(h, node) {
            let props = { href: normalize(node.url), target: '_blank' }

            if (node.title !== null && node.title !== undefined) {
              props.title = node.title
            }

            return h(node.position, 'span', [
              h(node, 'a', props, all(h, node)),
              h(node.position, 'sup', [
                h(
                  node.position,
                  'i',
                  {
                    className: 'v-icon notranslate material-icons theme--light',
                    style: 'font-size: 12px'
                  },
                  [u('text', 'open_in_new')]
                )
              ])
            ])
          },
          paragraph: function(h, node) {
            node.data = {
              hProperties: { className: 'text-body-1' }
            }
            return h(node, 'p', all(h, node))
          },
          strong: function(h, node) {
            node.data = {
              hProperties: { className: 'font-weight-medium' }
            }
            return h(node, 'span', all(h, node))
          },
          table: function(h, node) {
            node.data = {
              hProperties: {
                className: [
                  'my-3',
                  'grey',
                  'lighten-5',
                  'px-4',
                  'py-2',
                  'text--darken-2',
                  'blue-grey--text'
                ]
              }
            }
            return table(h, node)
          },
          thematicBreak: function(h, node) {
            node.data = {
              hProperties: { className: ['my-6'] }
            }
            return h(node, 'hr')
          }
        }
      })
      .process(md, (err, str) => {
        result = String(str)
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
