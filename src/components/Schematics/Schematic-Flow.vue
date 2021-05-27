<script>
import { mapGetters } from 'vuex'
import * as d3_base from 'd3'
import { zoom } from 'd3-zoom'
import uniqueId from 'lodash.uniqueid'
import throttle from 'lodash.throttle'
import Legend from '@/components/Schematics/Legend'
import LogRocket from 'logrocket'
import SchematicNode from '@/components/Schematics/Schematic-Node'
import PreviewTile from '@/components/Schematics/Preview-Tile'
import Tooltip from '@/components/Schematics/Tooltip'
import {
  curveMetro,
  makeQuadraticBezierPoints,
  isDiagonal
} from '@/utils/curveMetro'
import { STATE_COLORS } from '@/utils/states'
// TODO: Remove the workerize-loader package and adjust this worker to
// a more classic pub/sub style
import SchematicWorker from 'workerize-loader?inline!@/workers/schematic'

// Add our custom curve to d3 base
// and then merges the libraries together into one
// access point
const d3 = Object.assign({}, d3_base, { curveMetro: curveMetro })

export default {
  components: {
    Legend,
    SchematicNode,
    PreviewTile,
    Tooltip
  },
  props: {
    hideControls: { type: Boolean, required: false, default: () => false },
    schematicId: { type: String, required: false, default: '' },
    showCards: { type: Boolean, required: false, default: () => true },
    showLegend: { type: Boolean, required: false, defaul: () => false },
    tasks: { type: Array, required: true }
  },
  data() {
    return {
      id: uniqueId('schematic'),
      canvas: null,
      offscreenCanvas: null,
      canvasAdjustment: { h: 0, w: 0 },
      canvasFocus: false,
      collapsed: true,
      context: null,
      offscreenContext: null,
      curve: 'curveMetro',
      custom: null,
      dag: null,
      debug: false,
      defaultEdgeColor: { r: 132, g: 132, b: 132, a: 1 },
      defaultArrowColor: { r: 132, g: 132, b: 132, a: 1 },
      defaultNodeColor: { r: 0, g: 118, b: 255, a: 1 },
      edgeColorUpstream: { r: 255, g: 238, b: 88, a: 0.7 },
      edgeColorDownstream: { r: 249, g: 168, b: 37, a: 0.7 },
      edgeColor: null,
      error: false,
      errorReportLoading: false,
      errorSubmitted: false,
      fadedNodeColor: { r: 189, g: 189, b: 189, a: 1 },
      fadedEdgeColor: { r: 220, g: 220, b: 220, a: 1 },
      flow: null,
      globalGroup: null,
      hasFit: false,
      height: 1250,
      labels: null,
      layout: null,
      layoutPlan: 'sugiyama',
      line: null,
      links: null,
      loadingKey: 0,
      mappedTasks: {},
      nodes: null,
      nodeColor: null,
      nodeData: null,
      painting: false,
      path: null,
      previousSchematicId: null,
      scaledZoom: null,
      searchOptions: [],
      selectedTaskId: this.$route.query.schematic
        ? this.$route.query.schematic
        : null,
      showCanvas: false,
      showEdgeColorSwatch: false,
      showNodeColorSwatch: false,
      showLabels: false,
      showTooltip: true,
      size: 0,
      timer: null,
      tooltipData: null,
      transitionDuration: 250,
      transform: null,
      transformEventK: 1,
      transformEventX: 0,
      transformEventY: 0,
      tree: null,
      width: 1250,
      worker: null
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    canvasStyle() {
      return {
        opacity: this.loading || !this.showCanvas ? 0 : 1
      }
    },
    color: {
      get() {
        return this.showNodeColorSwatch
          ? this.nodeColor
            ? this.nodeColor
            : this.defaultNodeColor
          : this.edgeColor
          ? this.edgeColor
          : this.defaultEdgeColor
      },
      set(val) {
        this[this.showNodeColorSwatch ? 'nodeColor' : 'edgeColor'] = val
      }
    },
    loading() {
      return this.loadingKey > 0
    },
    nodeDataGroupTranslate() {
      return {
        opacity: this.loading || !this.showCanvas ? 0 : 1
      }
    },
    // Should expand this to show certain details at different levels later
    showDetails() {
      return {
        level1: this.transform?.k / this.size > 0.05,
        level2: this.transform?.k / this.size > 0.15
      }
    },
    animateCanvas: function() {
      return throttle(this.rawAnimateCanvas, 16)
    },
    visibleNodes() {
      if (!this.transform) return []
      const buf = 100 // buffer
      return this.nodeData.filter(node => {
        let [x, y] = this.transform.apply([node.x, node.y])
        return (
          x >= -buf &&
          y >= -buf &&
          x <= this.width + buf &&
          y <= this.height + buf
        )
      })
    }
  },
  watch: {
    tasks(val) {
      if (!this.canvas) this.createCanvas()
      if (this.nodeData && this.previousSchematicId == this.schematicId) {
        this.updateData(val)
      } else {
        this.previousSchematicId = this.schematicId
        this.createDag(val)
      }
    },
    showCards() {
      this.animateCanvas()
    }
  },
  mounted() {
    this.layout = null
    this.worker = SchematicWorker({ type: 'module' })
    this.createCanvas()

    if (this.tasks?.length > 0) {
      this.createDag(this.tasks)
    }
  },
  beforeDestroy() {
    cancelAnimationFrame(this.drawCanvas)
    this.id = null
    this.hasFit = null
    this.nodeData = null
    this.worker = null
    this.custom = null
    this.timer.stop()
    this.timer = null
  },
  methods: {
    _zoomed(event) {
      // Disabling for now to prevent flickering when throttling
      // drawing the canvas
      // this.context.clearRect(0, 0, this.width, this.height)

      if (event && event.sourceEvent && event.sourceEvent.ctrlKey) {
        if (event.sourceEvent.deltaY > 0) {
          event.transform.k = event.transform.k - event.transform.k * 0.03
        } else if (event && event.sourceEvent.deltaY < 0) {
          event.transform.k = event.transform.k + event.transform.k * 0.03
        }
      }
      this.transform = event.transform
      this.transformEventK = event.transform.k
      this.transformEventX = event.transform.x
      this.transformEventY = event.transform.y
      requestAnimationFrame(this.drawCanvas)
    },
    _zoomIn() {
      if (this.transform.k < 0.01) return
      this.canvas
        .transition()
        .duration(500)
        .call(this.scaledZoom.scaleBy, 2)
    },
    _zoomOut() {
      if (this.transform.k > 10) return
      this.canvas
        .transition()
        .duration(500)
        .call(this.scaledZoom.scaleBy, 0.5)
    },
    createCanvas() {
      this.loadingKey++
      this.canvas = d3.select(`#${this.id}`)

      let parent = this.canvas.select(function() {
        return this.parentNode
      })

      let computedStyle = window.getComputedStyle(parent._groups[0][0], null)

      let paddingLeft = parseFloat(
          computedStyle.getPropertyValue('padding-left')
        ),
        paddingRight = parseFloat(
          computedStyle.getPropertyValue('padding-right')
        ),
        paddingTop = parseFloat(computedStyle.getPropertyValue('padding-top')),
        paddingBottom = parseFloat(
          computedStyle.getPropertyValue('padding-left')
        )
      this.height =
        parent._groups[0][0].clientHeight - paddingTop - paddingBottom

      this.width = parent._groups[0][0].clientWidth - paddingLeft - paddingRight

      this.canvas.attr('width', this.width).attr('height', this.height)
      this.context = this.canvas.node().getContext('2d')
      this.customBase = document.createElement('custom')
      this.custom = d3.select(this.customBase)

      // Have to add this because the normal d3 wheel event
      // isn't being captured for some reason
      const filter = () => {
        return event.isTrusted
      }

      this.scaledZoom = zoom()
        .on('zoom', this._zoomed)
        .scaleExtent([0.45, Infinity])
        .filter(filter)

      this.canvas.call(this.scaledZoom).on('dblclick.zoom', null)
      this.loadingKey--
    },
    async createDag(tasks) {
      if (tasks.length === 0 || this.loading) return
      this.loadingKey += 2
      this.mappedTasks = {}

      this.painting = true

      // eslint-disable-next-line
      if (this.debug) console.time('Pre-stratify')

      let preStratify = tasks
        .sort((a, b) => {
          let _a = a.task ? a.task : a
          let _b = b.task ? b.task : b

          let diff = _b.upstream_edges.length - _a.upstream_edges.length

          if (diff !== 0) return diff

          return _a.name.localeCompare(_b.name)
        })
        .map(task => {
          let parsedTask = task.task ? task.task : task

          let child = {
            ...task,
            ...parsedTask
          }

          if (parsedTask.upstream_edges.length) {
            child.parentIds = parsedTask.upstream_edges.map(
              edge => edge.upstream_task.id
            )
          } else {
            child.parentIds = []
          }
          this.searchOptions.push({ id: parsedTask.id, name: parsedTask.name })
          return child
        })
      // eslint-disable-next-line
      if (this.debug) console.timeEnd('Pre-stratify')

      // If it takes more than 60 seconds to calculate the
      // dag layout, we'll stop the calculation,
      // terminate the worker, and show an error message
      let timeout = setTimeout(() => {
        this.error = true
        this.worker.terminate()
        this.loadingKey = 0

        let message = `
            There was an issue loading a flow schematic... this is an automated feedback message\n
                Tenant: ${this.tenant.name}\n
                Tenant ID: ${this.tenant.id}\n
                Path: ${this.$route.path}\n
            `
        LogRocket.warn(message, {
          extra: {
            pageName: 'Flow Schematics',
            stage: 'Worker Termination'
          }
        })
        return
      }, 60000)

      this.loadingKey++
      this.dag = await this.worker.Stratify(preStratify)
      this.loadingKey--

      this.loadingKey++
      this.tree = await this.worker.GenerateTree(this.dag)
      this.loadingKey--

      this.size = Math.max(this.tree.height, this.tree.width)

      const {
        canvasAdjustment,
        descendants,
        links
      } = await this.worker.GenerateLayout({
        tree: this.tree,
        height: this.height,
        layoutPlan: this.layoutPlan,
        width: this.width,
        dag: this.dag
      })
      this.loadingKey--

      clearTimeout(timeout)

      this.canvasAdjustment = canvasAdjustment
      this.nodeData = descendants
      this.links = links

      if (!this.error) this.redraw()
      this.loadingKey--
    },
    async updateData(tasks) {
      if (tasks.length === 0) return
      this.mappedTasks = {}

      let taskMap = Object.assign(
        {},
        ...tasks.map(t => ({ [t.task?.id || t.id]: t }))
      )

      this.nodeData.forEach(node => {
        let task = taskMap[node.id]
        // This ensures the id isn't incorrectly overwritten
        let parsedTask = task.task ? { ...task, ...task.task } : task
        parsedTask = { ...parsedTask, ...{ name: task?.name } }

        node.data = parsedTask
      })

      this.links.forEach(link => {
        let _t = taskMap[link.source.id] // Source task
        let t_ = taskMap[link.target.id] // Target task

        let _tP = _t.task ? { ..._t, ..._t.task } : _t // Parsed source task
        let tP_ = t_.task ? { ...t_, ...t_.task } : t_ // Parsed target task
        link.source.data = _tP
        link.target.data = tP_
      })

      this.redraw()
    },
    fitViz() {
      this.canvas.call(
        this.scaledZoom.transform,
        d3.zoomIdentity
          .translate(this.canvasAdjustment.w / 2, this.canvasAdjustment.h / 2)
          .scale(1)
      )
    },
    rawAnimateCanvas() {
      cancelAnimationFrame(this.drawCanvas)

      this.timer?.stop()
      this.timer = d3.timer(elapsed => {
        this.canvas.call(
          this.scaledZoom.transform,
          d3.zoomIdentity
            .translate(this.transformEventX, this.transformEventY)
            .scale(this.transformEventK)
        )

        if (elapsed > this.transitionDuration + 100) {
          setTimeout(() => {
            // Final fit
            this.painting = false

            // Fit after the first drawing
            if (!this.hasFit) {
              this.hasFit = true
              this.fitViz()
              setTimeout(() => {
                this.showCanvas = true
              }, 600)
            }
          }, 500)

          this.timer.stop()
        }
      })
    },
    drawCanvas() {
      // If the custom ref has been destroyed we don't want to continue trying
      // to draw the canvas (this can happen if this has been queued)
      if (!this.custom) return

      this.context.clearRect(0, 0, this.width, this.height)

      const transform = this.transform
      const context = this.context
      const showNodes = !this.showCards
      const showDetails = this.showDetails
      const size = this.size

      const scaledLine = (75 / this.size) * transform.k
      const scaledArrow = (100 / this.size) * transform.k
      const scaledNode = (150 / this.size) * transform.k

      const lineWidth =
        scaledLine > 3 ? 3 : scaledLine < 1.85 ? 1.85 : scaledLine
      const arrowSize =
        scaledArrow > 10 ? 10 : scaledArrow < 5 ? 5 : scaledArrow
      const nodeSize =
        scaledNode + Math.min(scaledNode, scaledNode * (size / scaledNode))

      if (!this.custom) return

      let edges = this.custom.selectAll('path')

      edges.each(function() {
        context.beginPath()

        let edge = d3.select(this)
        context.strokeStyle = edge.attr('stroke')
        context.lineCap = edge.attr('stroke-linecap')
        context.lineWidth = lineWidth

        // We only use alpha if the size is relatively small
        // because there's a significant rendering overhead
        context.globalAlpha = this.size < 100 ? edge.attr('stroke-opacity') : 1

        edge.each(d => {
          let _p
          let _context
          d.data.points.forEach((p, i) => {
            let point = transform.apply([p.x, p.y])
            switch (i) {
              case 0:
                _p = point
                context.moveTo(...point)
                break
              default:
                _p = point
                if (isDiagonal(_context[0], _context[1], point[0], point[1])) {
                  let to = makeQuadraticBezierPoints(
                    _context[0],
                    _context[1],
                    point[0],
                    point[1]
                  )
                  context.lineTo(...to[0])
                  context.lineTo(...to[1])
                }

                context.lineTo(point[0], point[1])
                break
            }
            _context = point
          })

          context.stroke()
          if (showDetails.level2) {
            context.fillStyle = edge.attr('arrow-color')
            context.beginPath()

            context.moveTo(_p[0], _p[1] - nodeSize)
            context.lineTo(_p[0] - arrowSize, _p[1] - nodeSize - arrowSize)
            context.lineTo(_p[0] + arrowSize, _p[1] - nodeSize - arrowSize)
            context.lineTo(_p[0], _p[1] - nodeSize)
            context.fill()
          }
        })
      })

      if (!showNodes && showDetails?.level1) return

      let nodes = this.custom.selectAll('circle')

      if (!nodes) return

      // Resets the alpha before we draw nodes,
      // which we always want to be opaque
      context.globalAlpha = 1

      nodes.each(function() {
        let node = d3.select(this)
        let point = transform.apply([node.attr('cx'), node.attr('cy')])

        context.beginPath()
        context.fillStyle = node.attr('fill')
        context.arc(point[0], point[1], nodeSize, 0, 2 * Math.PI)
        context.fill()

        context.fillStyle = 'transparent'
        this.path2D = new Path2D()
        this.path2D.arc(
          point[0],
          point[1],
          nodeSize + Math.min(nodeSize, nodeSize * (size / nodeSize)),
          0,
          2 * Math.PI
        )
        context.fill(this.path2D)
      })
    },
    labelNodes() {
      this.canvas.selectAll('text').remove()

      this.labels = this.globalGroup
        .append('g')
        .attr('id', 'labelGroup')
        .selectAll('text')
        .data(this.nodeData)
        .enter()
        .append('text')
        .text(d => d.data.name)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .style('font-size', '0.55rem')
        .attr('display', this.showLabels ? 'block' : 'none')
        .attr('x', d => (d.x ? d.x : d.x1) + 10)
        .attr('y', d => (d.y ? d.y : d.y1) - 10)
    },
    redraw() {
      this.updateEdges()
      this.updateNodes()
      this.animateCanvas()
    },
    updateNodes() {
      // Preserves references to this for event handlers
      const size = 96 / this.size

      this.custom
        .selectAll('circle')
        .data(this.nodeData)
        .join(
          enter =>
            enter
              .append('circle')
              .attr('fill', this.calcNodeColor)
              .attr('id', data => data.id)
              .attr('opacity', 0)
              .attr('cursor', 'pointer')
              .attr('cy', data =>
                typeof data.y == 'number'
                  ? data.y
                  : data.y0 + (data.y1 - data.y0) / 2
              )
              .call(enter =>
                enter
                  .transition()
                  .duration(this.transitionDuration)
                  .delay((d, i) => i * 10)
                  .attr('r', d =>
                    d.id == this.selectedTaskId ? size : size * 0.9
                  )
                  .attr('opacity', 1)
                  .attr('cx', data =>
                    typeof data.x == 'number'
                      ? data.x
                      : data.x0 + (data.x1 - data.x0) / 2
                  )
              ),
          update =>
            update
              .attr('fill', this.calcNodeColor)
              .attr('r', d => (d.id == this.selectedTaskId ? size : size * 0.9))
              .attr('opacity', 1)
              .attr('cy', data =>
                typeof data.y == 'number'
                  ? data.y
                  : data.y0 + (data.y1 - data.y0) / 2
              )
              .attr('cx', data =>
                typeof data.x == 'number'
                  ? data.x
                  : data.x0 + (data.x1 - data.x0) / 2
              ),
          exit =>
            exit.call(exit =>
              exit
                .transition()
                .duration(this.transitionDuration)
                .remove()
            )
        )
    },
    updateEdges() {
      // We don't use this right now
      // since the shape of the line
      // is determined in the canvas
      // context method
      // this.line = d3
      //   .line()
      //   .curve(d3[this.curve])
      //   .x(d => d.x)
      //   .y(d => d.y)

      this.custom
        .selectAll('path')
        .data(this.links)
        .join(
          enter =>
            enter
              .append('path')
              .attr('stroke-linecap', 'round')
              .attr('fill', 'none')
              .attr('class', 'path')
              .attr('arrow-color', () => this.calcColor(this.defaultArrowColor))
              .attr('stroke-width', 4)
              .attr('stroke', this.calcStrokeColor)
              .call(enter => {
                enter
                  .transition()
                  .duration(this.transitionDuration)
                  .delay((d, i) => i * 10)
                  .attr('stroke-opacity', d => {
                    let opacity
                    if (this.selectedTaskId) {
                      if (
                        d.source.id == this.selectedTaskId ||
                        d.target.id == this.selectedTaskId
                      ) {
                        opacity = 1
                      } else {
                        opacity = 0.2
                      }
                    } else {
                      opacity = 1
                    }
                    return opacity
                  })
              }),
          update =>
            update.attr('stroke', this.calcStrokeColor).call(update => {
              update
                .transition()
                .duration(this.transitionDuration)
                .delay((d, i) => i * 10)
                .attr('stroke-opacity', d => {
                  let opacity
                  if (this.selectedTaskId) {
                    if (
                      d.source.id == this.selectedTaskId ||
                      d.target.id == this.selectedTaskId
                    ) {
                      opacity = 1
                    } else {
                      opacity = 0.2
                    }
                  } else {
                    opacity = 1
                  }
                  return opacity
                })
            }),
          exit =>
            exit.call(exit =>
              exit
                .transition()
                .duration(this.transitionDuration)
                .remove()
            )
        )
    },
    handleCanvasClick(e) {
      if (!this.canvasFocus) return (this.canvasFocus = true)
      if (!this.showCards || !this.showDetails.level1) {
        const context = this.context
        const handleSelect = this.handleSelect
        let found = false
        this.custom.selectAll('circle').each(function() {
          try {
            if (context?.isPointInPath(this.path2D, e.offsetX, e.offsetY)) {
              found = true
              handleSelect({ id: this.id })
            }
          } catch {
            // do nothing
          }
        })
        if (!found && this.selectedTaskId)
          this.handleSelect({ id: this.selectedTaskId })
      } else {
        if (!this.selectedTaskId) return
        this.handleSelect({ id: this.selectedTaskId })
      }
    },
    handleCanvasMove(e) {
      if (this.showDetails.level1 && this.showCards) return
      const context = this.context
      const canvas = this.canvas
      const nodeData = this.nodeData
      const updateTooltip = this.updateTooltip
      let found = false
      this.custom.selectAll('circle').each(function() {
        try {
          if (found) return
          if (context?.isPointInPath(this.path2D, e.offsetX, e.offsetY)) {
            canvas._groups[0][0].style.cursor = 'pointer'
            found = true
            updateTooltip(nodeData.find(node => node.id == this.id))
          } else {
            canvas._groups[0][0].style.cursor = null
          }
        } catch {
          // do nothing
        }
      })
      if (!found) updateTooltip(null)
    },
    handleSelect(task) {
      this.$emit('node-click', task)

      let taskId = task.id

      if (taskId !== this.selectedTaskId) {
        this.selectedTaskId = taskId

        this.fadeAllNodes()
        this.highlightNode(taskId)

        this.fadeAllEdges()
        this.highlightUpstreamEdges(taskId)
        this.highlightDownstreamEdges(taskId)

        this.$router.replace({
          query: { ...this.$route.query, schematic: taskId }
        })
      } else {
        this.selectedTaskId = null

        this.showAllNodes()
        this.showAllEdges()

        this.$router.replace({
          query: { ...this.$route.query, schematic: '' }
        })
      }

      this.animateCanvas()
    },
    showAllNodes() {
      this.custom
        .selectAll('circle')
        .transition()
        .duration(this.transitionDuration)
        .attr('fill', this.calcNodeColor)
    },
    showAllEdges() {
      this.custom
        .selectAll('path')
        .transition()
        .duration(this.transitionDuration)
        .attr('stroke', this.calcStrokeColor)
        .attr('stroke-opacity', 1)
    },
    fadeAllNodes() {
      this.custom
        .selectAll('circle')
        .transition()
        .duration(this.transitionDuration)
        .attr('fill', this.calcColor(this.fadedNodeColor))
    },
    fadeAllEdges() {
      this.custom
        .selectAll('path')
        .transition()
        .duration(this.transitionDuration)
        .attr('stroke', this.calcColor(this.fadedEdgeColor))
        // We only use alpha if the size is relatively small
        // because there's a significant rendering overhead
        .attr('stroke-opacity', this.size < 100 ? 0.2 : 1)
    },
    highlightNode(id) {
      this.custom
        .selectAll('circle')
        .filter(({ data }) => data.id == id)
        .transition()
        .duration(this.transitionDuration)
        .attr('fill', this.calcNodeColor)
    },
    highlightUpstreamEdges(id) {
      // Upstream edges
      this.custom
        .selectAll('path')
        .filter(({ source }) => source.id == id)
        .transition()
        .duration(this.transitionDuration)
        .attr('stroke', this.calcStrokeColor)
        .attr('stroke-opacity', 1)
    },
    highlightDownstreamEdges(id) {
      // Downstream edges
      this.custom
        .selectAll('path')
        .filter(({ target }) => target.id == id)
        .transition()
        .duration(this.transitionDuration)
        .attr('stroke', this.calcStrokeColor)
        .attr('stroke-opacity', 1)
    },
    calcStrokeColor(d) {
      if (d?.source?.data?.state) {
        return STATE_COLORS[d.source.data.state]
      }
      return this.calcEdgeColor()
    },
    calcNodeColor(d) {
      if (d?.data?.state) {
        return STATE_COLORS[d.data.state]
      }
      let c = this.defaultNodeColor || this.nodeColor
      return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`
    },
    calcEdgeColor() {
      let c = this.edgeColor || this.defaultEdgeColor
      return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`
    },
    calcColor(c) {
      return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`
    },
    rgba2hex(orig) {
      let a,
        rgb = orig
          .replace(/\s/g, '')
          .match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
        alpha = ((rgb && rgb[4]) || '').trim(),
        hex = rgb
          ? (rgb[1] | (1 << 8)).toString(16).slice(1) +
            (rgb[2] | (1 << 8)).toString(16).slice(1) +
            (rgb[3] | (1 << 8)).toString(16).slice(1)
          : orig

      if (alpha !== '') {
        a = alpha
      } else {
        a = 1
      }
      // multiply before convert to HEX
      a = ((a * 255) | (1 << 8)).toString(16).slice(1)
      hex = hex + a

      return hex
    },
    async submitReport() {
      this.errorReportLoading = true
      let message = `
            There was an issue loading a flow schematic... this is an automated feedback message\n
                Tenant: ${this.tenant.name}\n
                Tenant ID: ${this.tenant.id}\n
                Path: ${this.$route.path}\n
            `
      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/support/send-feedback.gql'),
          variables: {
            type: 'Schematics',
            message: message
          }
        })
        setTimeout(() => {
          this.errorSubmitted = true
        }, 1500)
      } catch (e) {
        this.error = true
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Flow Schematics',
            stage: 'Automated Feedback Submission'
          }
        })
      }
      setTimeout(() => {
        this.errorReportLoading = false
      }, 1500)

      LogRocket.warn(message, {
        extra: {
          pageName: 'Flow Schematics',
          stage: 'Automated Feedback Submission'
        }
      })
    },
    tooltipStyle(data) {
      let t = this.transform?.apply([data?.x, data?.y])
      return {
        left: `${t[0]}px`,
        top: `${t[1] + 10}px`,
        position: 'absolute'
      }
    },
    updateTooltip(data) {
      if (!data) {
        this.showTooltip = false
        this.tooltipData = null
      }
      this.tooltipData = data
      this.showTooltip = true
    }
  }
}
</script>

<template>
  <div
    ref="container"
    class="position-relative full-height ma-0 pa-0"
    style="overflow: hidden;"
  >
    <v-progress-circular
      v-if="loading"
      color="primary"
      class="position-absolute center"
      indeterminate
      size="150"
      width="10"
    />

    <div
      v-if="tasks && !error && hasFit"
      class="position-absolute task-preview-tile"
      @click="canvasFocus = false"
      @mouseover="canvasFocus = false"
      @focus="canvasFocus = false"
    >
      <PreviewTile
        :options="searchOptions"
        :tasks="tasks"
        @clear-task="handleSelect({ id: selectedTaskId })"
        @select-task="handleSelect"
      />
    </div>

    <canvas
      v-if="!error"
      :id="id"
      :style="canvasStyle"
      @click="handleCanvasClick"
      @mousemove="handleCanvasMove"
    />

    <div
      v-if="showCards && transform && showDetails.level1 && !error"
      class="node-data-group position-absolute"
      :style="nodeDataGroupTranslate"
    >
      <SchematicNode
        v-for="data in visibleNodes"
        :key="data.id"
        :disabled="selectedTaskId && selectedTaskId !== data.id"
        :multiplier="size"
        :node-data="data"
        :show-details="showDetails.level2"
        :size="size"
        :transform="transform"
        @mouseover="
          updateTooltip()
          canvasFocus = true
        "
        @mouseout="updateTooltip"
        @node-click="handleSelect"
      ></SchematicNode>
    </div>

    <!-- eslint-disable -->
    <Tooltip
      v-if="tooltipData && showTooltip && transform"
      :data="tooltipData.data"
      :style="tooltipStyle(tooltipData)"
    />

    <v-toolbar
      v-if="!hideControls && !error && hasFit"
      dense
      class="toolbar px-0 mx-0"
      elevation="2"
    >
      <v-tooltip top>
        <template #activator="{ on }">
          <v-btn icon tile v-on="on" @click="fitViz">
            <v-icon>center_focus_strong</v-icon>
          </v-btn>
        </template>
        <span>
          Reset Viewport
        </span>
      </v-tooltip>

      <v-tooltip top>
        <template #activator="{ on }">
          <v-btn icon tile v-on="on" @click="_zoomIn">
            <v-icon>zoom_in</v-icon>
          </v-btn>
        </template>
        <span>
          Zoom In
        </span>
      </v-tooltip>

      <v-tooltip top>
        <template #activator="{ on }">
          <v-btn icon tile v-on="on" @click="_zoomOut">
            <v-icon>zoom_out</v-icon>
          </v-btn>
        </template>
        <span>
          Zoom Out
        </span>
      </v-tooltip>
    </v-toolbar>

    <Legend
      v-if="showLegend && !error"
      class="position-absolute legend"
      :tasks="tasks"
    />

    <v-card v-if="error" class="position-absolute center" tile>
      <v-card-text class="text-center">
        <transition name="fade-expand" mode="out-in">
          <div v-if="!errorSubmitted && !errorReportLoading" key="step1">
            <div class="text-h4">
              Sorry, we're unable to load this schematic.
            </div>
            <div class="mt-2">Help us improve by submitting a report.</div>
          </div>
          <div v-else-if="errorReportLoading" key="step2" class="text-h4">
            Submitting report...
          </div>
          <div v-else key="step2">
            <div class="text-h4 mb-2">
              Thanks! We'll get our team on it immediately.
            </div>
            By the way, you can
            <a target="_blank" href="https://prefect.io/slack"
              >join our Slack</a
            >
            to ask questions, provide feedback, or just to chat! You can also
            check out our
            <a target="_blank" href="https://docs.prefect.io">docs</a>, which
            are filled with lots of helpful tutorials, explanations, and useful
            information.
          </div>
        </transition>
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-if="!errorSubmitted"
          depressed
          color="warning"
          class="ma-auto"
          :loading="errorReportLoading"
          @click="submitReport"
        >
          Submit Report
        </v-btn>
        <v-btn v-else color="success" :ripple="false" depressed class="ma-auto">
          <v-icon class="mr-2">check</v-icon>
          Report submitted
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<style lang="scss">
// This block is has no style scoping,
// which allows us to use css
// to style dynamically attached svg elements
// .path {
// animation: dash 120s reverse linear;
// animation-iteration-count: infinite;
// stroke-dasharray: 5 7;
// }

@keyframes dash {
  to {
    stroke-dashoffset: 500;
  }
}
</style>

<style lang="scss" scoped>
canvas {
  cursor: grab;
  min-height: 800px;
  transition: opacity 500ms linear;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
}

.legend {
  bottom: 0.2rem;
  right: 0.15rem;
}

.center {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.node-data-group {
  height: 100%;
  left: 0;
  pointer-events: none;
  top: 0;
  transform-origin: 0 0;
  transition: opacity 500ms linear;
  width: 100%;
}

.task-preview-tile {
  min-width: 250px;
  right: 0.15rem;
  top: 0.15rem;
  width: 25%;
  z-index: 2;
}

.toolbar {
  border-bottom-right-radius: 0 !important;
  bottom: 0.2rem;
  left: 0.15rem;
  position: absolute;
}
</style>

<style lang="scss" scoped>
.h-100 {
  height: calc(100% - 64px) !important;
  min-height: calc(100% - 64px) !important;
}

.toolbox {
  bottom: 1rem;
  height: 350px;
  overflow: hidden;
  position: absolute;
  right: calc(200px + 2rem);
  transform-origin: right;
  transition: all 500ms;
  width: 350px;
  z-index: 1;

  &.swatch-open {
    width: 700px;
  }

  &.collapsed {
    height: 50px;
    width: 50px;
  }
}

.no-flows {
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}

.color-picker {
  cursor: pointer;
  font-size: 1rem;
  line-height: 1rem;
  user-select: none;

  &.selected {
    background-color: rgba(0, 0, 0, 0.2);
  }
}
</style>
