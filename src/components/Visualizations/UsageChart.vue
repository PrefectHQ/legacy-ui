<script>
import uniqueId from 'lodash.uniqueid'

export default {
  id: uniqueId('usage')
}
</script>

<template>
  <div>
    <svg :id="`${id}-svg`" class="svg" />
  </div>
</template>
