<script>
export default {
  props: {
    white: {
      type: String,
      required: false,
      default: 'grey'
    }
  }
}
</script>

<template>
  <svg
    width="464px"
    height="745px"
    viewBox="0 0 464 745"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    class="icon"
  >
    <!-- Generator: Sketch 52.5 (67469) - http://www.bohemiancoding.com/sketch -->
    <title>logomark/primary-dark</title>
    <desc>Created with Sketch.</desc>
    <defs>
      <linearGradient id="linearGradient-1" x1="85%" y1="85%" x2="14%" y2="13%">
        <stop class="icon" offset="0%"></stop>
        <stop class="icon" offset="97%"></stop>
      </linearGradient>
      <polygon id="path-2" points="232 115 0.5 0 0.5 235"></polygon>
      <linearGradient id="linearGradient-4" x1="9%" y1="10%" x2="139%" y2="37%">
        <stop class="icon" offset="0%"></stop>
        <stop class="icon" offset="100%"></stop>
      </linearGradient>
      <linearGradient id="linearGradient-5" x1="9%" y1="10%" x2="65%" y2="109%">
        <stop class="icon" offset="0%"></stop>
        <stop class="icon" offset="100%"></stop>
      </linearGradient>
    </defs>
    <g
      id="logomark/primary-dark"
      stroke="none"
      stroke-width="1"
      fill-rule="evenodd"
    >
      <g id="Dark">
        <g id="middle-triangle" transform="translate(231.000000, 231.000000)">
          <mask id="mask-3" fill="white">
            <use xlink:href="#path-2"></use>
          </mask>
          <use id="triangle" xlink:href="#path-2"></use>
          <polygon
            id="left-shadow"
            fill-opacity="0.2"
            mask="url(#mask-3)"
            points="30 220 0.5 45 0.5 235"
          ></polygon>
          <polygon
            id="right-shadow"
            fill-opacity="0.2"
            mask="url(#mask-3)"
            points="202.5 101 0.5 0 0.5 25"
          ></polygon>
        </g>
        <path
          id="leg"
          d="M14,742 C14.5,742 226,639 227,639 C229,637 231,636 231,631 C231,631 231,231 231,231 C141,276 15,339 4,345 C0.5,346 0,348 0,351 L0,732 C0,740 0.5,749 14,742 Z"
        ></path>
        <path
          id="top"
          d="M463,119 L463,346 C463,346 31,130 16,122 C6,117 6,112 16,107.166 C25,102 200,14 227,1 C231,-0 232,-0 235,0 L458,112 C462,114 463,116 463,119 Z"
          f
        ></path>
      </g>
    </g>
  </svg>
</template>

<style lang="scss" scoped>
.icon {
  fill: currentColor;
  stop-color: currentColor;
}
</style>
