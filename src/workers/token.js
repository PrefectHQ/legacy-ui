/* eslint-disable */
// Have to disable the no-undef rule since workers use global variables
addEventListener('message', event => {
  postMessage(event)
})
