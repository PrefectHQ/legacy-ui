import Velocity from 'velocity-animate'

export default {
  functional: true,
  render: function(createElement, context) {
    const data = {
      props: {
        name: 'height-transition',
        mode: 'out-in'
      },
      on: {
        beforeEnter: function(el) {
          el.style['max-height'] = 0
          el.style.opacity = 0
        },
        enter: function(el, done) {
          // This will try to find a parent component
          // whose height isn't set to auto, up to 2 levels
          // above the transitioning components
          let parent =
            getComputedStyle(el.parentElement)?.height == 'auto'
              ? el.parentElement.parentElement
              : el.parentElement

          let elHeight = getComputedStyle(el).height

          let height =
            parseFloat(getComputedStyle(parent).height) +
            parseFloat(elHeight) +
            'px'
          Velocity(parent, { 'max-height': height }, { complete: done })
          Velocity(
            el,
            { opacity: 1, 'max-height': elHeight },
            { complete: done }
          )
        },
        leave: function(el, done) {
          let delay = el.dataset.index * 150
          let parent =
            getComputedStyle(el.parentElement)?.height == 'auto'
              ? el.parentElement.parentElement
              : el.parentElement

          let height =
            parseFloat(getComputedStyle(parent).height) -
            parseFloat(getComputedStyle(el).height) +
            'px'

          Velocity(el, { opacity: 0, 'max-height': 0 }, { complete: done })
          setTimeout(function() {
            Velocity(parent, { 'max-height': height }, { complete: done })
          }, delay)
        }
      }
    }
    return createElement('transition-group', data, context.children)
  }
}
