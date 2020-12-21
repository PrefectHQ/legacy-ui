<script>
import { mapGetters } from 'vuex'
// Load GraphiQL React based UI within a Vue Component from CDN
// example: https://gist.github.com/metafeather/ebda15c00c737c4d95cdc11ea71af32a
// ref: https://github.com/graphql/graphiql/tree/main/packages/graphiql#cdn-bundle
const js = (id, url) =>
  new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      return
    }
    const el = document.createElement('script')
    el.src = url
    el.async = true
    el.id = id
    el.onload = () => {
      resolve()
    }
    el.onerror = err => {
      reject(err)
    }
    document.body.appendChild(el)
  })

export default {
  data() {
    return {
      defaultQuery:
        this.role === 'READ_ONLY_USER'
          ? 'Sorry this page is not available to Read-only users.'
          : `# Enter your query/mutation here
# Example:
query { hello }`,
      readOnly: this.role === 'READ_ONLY_USER'
    }
  },
  computed: {
    ...mapGetters('auth0', ['authorizationToken']),
    ...mapGetters('api', ['url']),
    ...mapGetters('tenant', ['role'])
  },
  meta: {
    title: 'GraphiQL'
  },
  async mounted() {
    // wait for latest CDN scripts
    await js('react', 'https://unpkg.com/react/umd/react.production.min.js')
    await js(
      'react-dom',
      'https://unpkg.com/react-dom/umd/react-dom.production.min.js'
    )
    await js('graphiql-js', 'https://unpkg.com/graphiql/graphiql.min.js')
    const fetcher = params =>
      fetch(this.url, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${this.authorizationToken}`
        },
        body: JSON.stringify(params)
      }).then(res => res.json())
    /* eslint-disable no-undef */
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher,
        defaultQuery: this.defaultQuery,
        readOnly: this.readOnly
      }),
      /* eslint-enable no-undef */
      document.getElementById('graphiql')
    )
  }
}
</script>

<template>
  <div
    id="graphiql"
    style="height: calc(100vh - 64px);
    padding-bottom: 0;"
  ></div>
</template>

<style lang="scss">
@import 'https://unpkg.com/graphiql/graphiql.min.css';
$editor-black: #1d252b; // secondaryGrayDark
$toolbar-black: #21262b;
$divider-gray: #4e5965;
$text-gray: #edf0f3; // secondaryGrayLight
$accent-pink: #fe5196;
$accent-orange: #f77062;
$accent-cyan: #2edaff;
$code-blue: #0073df;
$code-pink: #da2072;
$brackets-gray: #8d98a5;
/* stylelint-disable selector-class-pattern */
/* since we're not writing these class names, we can't abide by stylelint's naming rules */
.CodeMirror-info {
  // this popover isn't technically inside the container
  background: $divider-gray;

  .info-description {
    color: $text-gray;
  }

  .type-name {
    color: $accent-cyan;
  }

  .field-name {
    color: $accent-orange;
  }
}

.graphiql-container {
  /* overall styles */
  .CodeMirror {
    background: $editor-black !important;
  }

  .CodeMirror-cursor {
    border-left: 1px solid $text-gray;
  }

  .CodeMirror-hints {
    background: $divider-gray;

    /* stylelint-disable-next-line selector-max-compound-selectors */
    .CodeMirror-hint,
    .CodeMirror-hint-information .content {
      color: $text-gray;
    }
  }

  .CodeMirror-gutters,
  .result-window .CodeMirror-gutters,
  .resultWrap,
  .secondary-editor-title {
    background: $divider-gray;
    border: 0;
    color: $text-gray;
  }

  .secondary-editor {
    height: 28px;
  }

  .secondary-editor-title > div {
    color: $text-gray !important;
  }

  button,
  input {
    color: $text-gray;
  }
  /* History and Documentation sidebars */
  .historyPaneWrap {
    z-index: 4 !important; // keeps history panel under sidenav
  }

  .doc-explorer-title-bar,
  .history-title-bar {
    background: $toolbar-black;
    color: $text-gray;
    height: 40px;
    padding: 0 8px;

    .history-title,
    .doc-explorer-title {
      margin-top: 14px;
      overflow: hidden;
      padding: 0 0 0 10px;
    }

    .docExplorerHide {
      padding-top: 22px;
    }
  }

  .doc-category-title {
    border-bottom: 1px solid $divider-gray;
  }

  .history-contents,
  .doc-explorer-contents {
    background: $toolbar-black;
    border-top: 2px solid $divider-gray;
    color: $text-gray;
    top: 40px;
  }

  .history-contents li {
    border-bottom: 1px solid $divider-gray;

    &:hover,
    &:focus {
      background: $accent-pink;
    }

    /* stylelint-disable-next-line selector-max-compound-selectors */
    button:not(.history-label) {
      font-size: 20px;
    }
  }

  .search-box {
    input {
      padding: 6px 24px;
    }

    .search-box-clear {
      background: $divider-gray;
    }
  }

  .doc-category {
    * {
      color: $brackets-gray;
    }

    /* stylelint-disable-next-line selector-max-compound-selectors */
    .doc-category-title,
    .field-short-description > * {
      color: $text-gray;
    }

    .field-name {
      color: $accent-cyan;
    }

    .arg-name {
      color: $accent-orange;
    }

    .type-name {
      color: $code-blue;
    }
  }

  /* Top nav */
  .topBar {
    background: $toolbar-black;
    border-bottom: 2px solid $divider-gray;
    height: 42px;

    /* stylelint-disable-next-line a11y/no-display-none */
    .title {
      display: none;
    }

    .execute-button {
      background: $accent-pink;
      border: 0;
      box-shadow: none;
      height: 32px;
      width: 32px;
      /* stylelint-disable-next-line selector-max-compound-selectors */
      * {
        fill: $text-gray;
      }
    }

    .toolbar-button {
      background: $divider-gray;
      box-shadow: none;
      color: $text-gray;
      padding: 2px 8px;
    }
  }

  .docExplorerShow {
    background: $divider-gray;
    border: 0;
    box-shadow: none;
    color: $text-gray;
    padding: 2px 8px;

    &::before {
      border-left: 2px solid $text-gray;
      border-top: 2px solid $text-gray;
    }
  }

  .doc-explorer-back {
    background: $divider-gray;
    border-radius: 3px;
    color: $text-gray;
    height: 25px;
    margin: 8px 0 0;
    overflow: hidden;
    padding: 2px 8px;

    &::before {
      border-left: 2px solid $text-gray;
      border-top: 2px solid $text-gray;
    }
  }
  /* code colors */
  .cm-keyword,
  .cm-def {
    color: $code-pink;
  }

  .cm-property {
    color: $code-blue;
  }

  .cm-string {
    color: $accent-orange;
  }

  .cm-variable,
  .cm-attribute {
    color: $accent-orange;
  }

  .cm-punctuation {
    color: $brackets-gray;
  }
  /* scrollbar styling */
  ::-webkit-scrollbar-thumb {
    background: radial-gradient($divider-gray, #434c56);
    border-radius: 6px;
  }

  ::-webkit-scrollbar-track,
  .CodeMirror-vscrollbar,
  .CodeMirror-hscrollbar {
    background-color: transparent;
    scrollbar-color: transparent;
  }

  ::-webkit-scrollbar {
    background-color: transparent;
    width: 10px;
  }

  /* stylelint-disable-next-line a11y/no-display-none */
  ::-webkit-scrollbar-button {
    display: none;
  }
}
</style>
