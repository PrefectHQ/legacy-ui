<script>
import GraphiQL from 'graphiql'
import React from 'react'
import ReactDOM from 'react-dom'

// Load GraphiQL React based UI within a Vue Component from CDN
// example: https://gist.github.com/metafeather/ebda15c00c737c4d95cdc11ea71af32a
// ref: https://github.com/graphql/graphiql/tree/main/packages/graphiql#cdn-bundle
const js = (id, url) =>
  new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      console.error(`Error loading ${url} async: ${id} is not unique`)
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
  name: 'Playground',
  meta: {
    title: 'GraphiQL',
    link: {
      'graphiql-css': {
        rel: 'stylesheet',
        href: 'https://unpkg.com/graphiql/graphiql.min.css'
      }
    }
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
      fetch(
        'http://localhost:4200/graphql', //this is the wrong url, what's correct?
        {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        }
      ).then(res => res.json())
    ReactDOM.render(
      React.createElement(GraphiQL, { fetcher }),
      document.getElementById('graphiql')
    )
  }
}
</script>

<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <div id="graphiql" style="height: 100vh;"></div>
</template>

<style>
@import 'https://unpkg.com/graphiql/graphiql.min.css';
/* stylelint-disable */
.CodeMirror {
  background: #282d34 !important;
}
.graphiql-container .doc-explorer-contents,
.graphiql-container .history-contents {
  background-color: #21262b;
  border-top: 1px solid #181a1f;
}

.graphiql-container .toolbar-button {
  background: #1c2125 !important;
  box-shadow: none !important;
  color: #5c626d !important;
  border: 1px solid #181a1f !important;
}

.graphiql-container .result-window .CodeMirror-gutters {
  background: #282d33;
  border: none !important;
}

.graphiql-container .resultWrap {
  border-left: solid 1px #181a1f;
}

.graphiql-container .variable-editor-title {
  background: #21262b;
  border-bottom: 1px solid #181a1f;
  border-top: 1px solid #181a1f;
  color: #cacdd3;
}

.graphiql-container .topBar {
  background: #21262b;
  border-color: #181a1f;
}

.graphiql-container .docExplorerHide {
  color: #606671;
}

.graphiql-container .doc-explorer-title,
.graphiql-container .history-title,
.doc-explorer-back {
  color: #cacdd3 !important;
}

.graphiql-container .doc-explorer {
  background: #21262b;
}

.graphiql-container .docExplorerWrap,
.graphiql-container .historyPaneWrap {
  box-shadow: none;
}

.graphiql-container .docExplorerShow {
  border-left: none;
}
.graphiql-container .docExplorerShow,
.graphiql-container .historyShow {
  background: #21262b;
  border-bottom: 1px solid #181a1e;
  color: #cacdd3;
}

.graphiql-container .docExplorerShow:before,
.graphiql-container .doc-explorer-back:before {
  border-color: #cacdd3;
}

.graphiql-container .search-box {
  margin: auto auto 10px auto;
  border: none;
}
.graphiql-container .search-box input {
  background: #1e2127;
  padding-left: 28px;
}

.graphiql-container .search-box .search-box-clear,
.graphiql-container .search-box .search-box-clear:hover {
  background: #1d2126;
}

.graphiql-container .search-box:before {
  color: #c1c4ca;
  font-size: 21px;
  left: 8px;
}

.graphiql-container,
.graphiql-container button,
.graphiql-container input {
  color: #9299a7;
}

.CodeMirror-gutters {
  border: none !important;
  background-color: #282d33;
}

.graphiql-container .execute-button {
  background: #21262b;
  border: 1px solid rgb(91, 98, 107);
  box-shadow: none !important;
  fill: #c9ccd2;
}

.graphiql-container .history-contents p {
  border: none;
}

.graphiql-container .historyPaneWrap {
  background: #21262b;
}

.graphiql-container .execute-options > li.selected,
.graphiql-container .toolbar-menu-items > li.hover,
.graphiql-container .toolbar-menu-items > li:active,
.graphiql-container .toolbar-menu-items > li:hover,
.graphiql-container .toolbar-select-options > li.hover,
.graphiql-container .toolbar-select-options > li:active,
.graphiql-container .toolbar-select-options > li:hover,
.graphiql-container .history-contents > p:hover,
.graphiql-container .history-contents > p:active {
  background: #383c41;
}

.graphiql-container .doc-category-title {
  border-bottom: 1px solid #181a1f;
  color: #cacdd3;
}

.graphiql-container .field-name {
  color: #9ca3ac;
}

.graphiql-container .type-name {
  color: #95be76;
}

.cm-property {
  color: #a5acb8;
}

.cm-string {
  color: #97be7b;
}

.cm-variable {
  color: #a87f5b;
}

.cm-attribute {
  color: #b58860;
}

.cm-def {
  color: #cc3932;
}

.cm-keyword {
  color: #7cf3ff;
}

.graphiql-container .keyword {
  color: #9ea5b0;
}

.graphiql-container .arg-name {
  color: #b5875d;
}

.graphiql-container .doc-category-item {
  color: #bc6069;
}

a {
  color: #7b9ad4;
}

.CodeMirror-lint-tooltip {
  background: #1a1e22 !important;
  color: red;
}

.cm-atom {
  color: #d27caf;
}

.CodeMirror-hints {
  background: #21262a;
  box-shadow: 0 16px 13px -10px rgba(0, 0, 0, 0.3);
}
.CodeMirror-hint {
  border-top: solid 1px #212629;
  color: #8ab16f;
}
.CodeMirror-hint-information {
  border-top: solid 1px #181a1e;
}
li.CodeMirror-hint-active {
  background-color: #262c2f;
  border-top-color: #212629;
  color: #b8ff87;
}
.CodeMirror-hint-information .content {
  color: #a4abb7;
}
/* stylelint-enable */
</style>
