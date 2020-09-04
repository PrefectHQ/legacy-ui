import { Tree } from '@/utils/Tree'
import * as d3_dag from 'd3-dag'

global.process = process

// eslint-disable-next-line no-global-assign
// window = undefined

// Add our custom curve to d3 base
// and then merges the libraries together into one
// access point
const d3 = Object.assign({}, d3_dag)

let layout, dag

export function GenerateTree(data) {
  let tree = new Tree(Object.assign({}, data))
  return tree
}

export function Stratify(data) {
  dag = d3.dagStratify()(data)
  dag.each(node => (node.heightRatio = 1))
  return dag
}

export function GenerateLayout(data) {
  const tree = data.tree
  const height = data.height
  const layoutPlan = data.layoutPlan
  const width = data.width

  let canvasAdjustment = { h: null, w: null }
  let links, descendants
  // arquint - the layout algorithm of the graph - allows for node heights
  // size - array of width/height
  // decross - the amount of crossing edges that will be present in the
  //           layout; in order of speed (slowest to fastest):
  //              - decrossOpt (don't use this, it's v v slow for large graphs)
  //              - decrossTwoLayer().order(d3.twolayerOpt())
  //              - decrossTwoLayer
  // columnWidth - function should return a number, ex: () => 1
  // columnSeparation - space between columns; function should return a number, ex: () => 1
  // interLayerSeparation - vertical distance between layers
  // layering - node layer assignment (slowest to fastest):
  //              - layeringSimplex
  //              - layeringCoffmanGraham
  //              - layeringTopological
  //              - layeringLongestPath().topDown(false)
  //              - layeringLongestPath
  // columnAssignment - node column assignment:
  //             Simple Left     - columnSimpleLeft
  //             Simple Center   - columnSimpleCenter
  //             Adjacent Left   - columnAdjacent
  //             Adjacent Center - columnAdjacent.center(true)
  //             Complex Left    - columnComplex
  //             Complex Center  - columnComplex.center(true)
  // column2Coord(d3.column2CoordRect()) - converts the column assignment of each node to actual x0 and x1 coordinates
  // coord - coordinate assignment (slowest to fastest):
  //             Vertical          - coordVert
  //             Minimum Curves    - coordMinCurve
  //             Greedy            - coordGreedy
  //             Center            - coordCenter
  //
  if (tree.width <= 3 && tree.height <= 3) {
    canvasAdjustment.h = height * 0.35
    canvasAdjustment.w = width * 0.35
  } else {
    canvasAdjustment.h = height * (1 / tree.height)
    canvasAdjustment.w = width * (1 / tree.width)
  }

  if (layoutPlan == 'sugiyama' && !layout) {
    layout = d3
      .sugiyama()
      .size([width - canvasAdjustment.w, height - canvasAdjustment.h])
      .layering(d3.layeringLongestPath().topDown(false))
      .decross(d3.decrossTwoLayer().order(d3.twolayerOpt()))
      // .coord(d3.coordMinCurve()) // Disabling this due to some edge cases with quadratic positive definites
      .separation((a, b) => {
        return (a.data !== undefined) + (b.data !== undefined)
      })
  }

  layout(dag)

  descendants = dag.descendants()
  links = dag.links()
  return { canvasAdjustment, descendants, links }
}
