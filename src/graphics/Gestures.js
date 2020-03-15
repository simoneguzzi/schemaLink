import { drawRing, drawPolygon, drawCircle} from "./canvasRenderer";
import { ringMargin as defaultRingMargin } from "./constants";
import { getVoronoi, isPointInPolygon, sortPoints } from "./utils/geometryUtils";
import {idsMatch} from "../model/Id";
import { green, blueGreen, purple } from "../model/colors";
import { Point } from "../model/Point";
import { getStyleSelector } from "../selectors/style";
import {StraightArrow} from "./StraightArrow";

export default class Gestures {
  constructor(graph, selection, gestures) {
    this.graph = graph
    this.selection = selection
    this.gestures = gestures
  }

  draw (ctx, displayOptions) {
    const { graph, selection, gestures } = this
    const { dragToCreate, selectionPath, selectionMarquee } = gestures
    const viewTransformation = displayOptions.viewTransformation
    const transform = (position) => viewTransformation.transform(position)
    const getBbox = (from, to) => [
      from, {
        x: to.x,
        y: from.y
      },
      to, {
        x: from.x,
        y: to.y
      },
      from
    ]

    const ringMargin = defaultRingMargin * viewTransformation.scale

    let newNodeRadius = graph.style.radius * viewTransformation.scale

    if (selectionMarquee && graph.nodes.length > 0) {
      const marqueeScreen = {from: transform(selectionMarquee.from), to: transform(selectionMarquee.to)}
      const bBox = getBbox(selectionMarquee.from, selectionMarquee.to)
      const bBoxScreen = getBbox(marqueeScreen.from, marqueeScreen.to)

      drawPolygon(ctx, bBoxScreen, null, 'black')

      const points = graph.nodes.map(node => node.position)
        .filter(point => isPointInPolygon(point, bBox))
      const voronoi = getVoronoi(points,
        selectionMarquee ? {
          xl: Math.min(selectionMarquee.from.x, selectionMarquee.to.x),
          xr: Math.max(selectionMarquee.from.x, selectionMarquee.to.x),
          yt: Math.min(selectionMarquee.from.y, selectionMarquee.to.y),
          yb: Math.max(selectionMarquee.from.y, selectionMarquee.to.y),
        } : { xl: 0, xr: 0, yt: 0, yb: 0}
      )

      if (voronoi) {
        if (voronoi.cells.length === 1) {
          drawPolygon(ctx, bBoxScreen, 'aliceblue', 'black')
        } else {
          voronoi.cells.forEach(cell => {
            let points = []
            cell.halfedges.forEach(halfedge => {
              const doesPointExist = point => points.indexOf(p => p.x === point.x && p.y === point.y) >= 0
              if (!doesPointExist(halfedge.edge.va)) {
                points.push(halfedge.edge.va)
              }
              if (!doesPointExist(halfedge.edge.vb)) {
                points.push(halfedge.edge.vb)
              }
            })
            points = sortPoints(points)
            drawPolygon(ctx, points.map(point => transform(new Point(point.x, point.y))), 'aliceblue', 'black')
          })
        }
      }
    }

    if (selectionPath.length > 0) {
      const points = sortPoints(selectionPath.slice(0)).map(point => transform(new Point(point.x, point.y)))
      drawPolygon(ctx, points, green)
      points.forEach(point => ctx.circle(point.x, point.y, 3, false, true))
    }


    Object.keys(selection.selectedNodeIdMap).forEach(nodeId => {
      if (!idsMatch(nodeId, dragToCreate.sourceNodeId)) {
        const node = graph.nodes.find((node) => idsMatch(node.id, nodeId))
        if (node) {
          const nodeRadius = getStyleSelector(node, 'radius')(graph)
          drawRing(ctx, transform(node.position), green, (nodeRadius * viewTransformation.scale + ringMargin / 2))
        }
      }
    })

    if (dragToCreate.sourceNodeId) {
      const sourceNode = graph.nodes.find((node) => idsMatch(node.id, dragToCreate.sourceNodeId))
      if (sourceNode) {
        const radius = getStyleSelector(sourceNode, 'radius')(graph) * viewTransformation.scale
        const outerRadius = radius + ringMargin
        const sourceNodeIdPosition = sourceNode.position
        if (dragToCreate.newNodePosition) {
          const delta = dragToCreate.newNodePosition.vectorFrom(sourceNodeIdPosition)
          let newNodePosition = sourceNodeIdPosition;
          if (delta.distance() > outerRadius) {
            if (delta.distance() < radius + outerRadius) {
              const ratio = (delta.distance() - radius - ringMargin) / radius
              newNodePosition = sourceNodeIdPosition.translate(delta.scale(ratio))
              newNodeRadius *= ratio
            } else {
              newNodePosition = dragToCreate.newNodePosition
            }
          }

          drawRing(ctx, transform(newNodePosition), blueGreen, newNodeRadius)

          const sourcePoint = transform(sourceNodeIdPosition)
          const targetPoint = transform(newNodePosition)
          const arrow = new StraightArrow(sourcePoint, targetPoint, radius, newNodeRadius, 4, 16, 24, 2.4, blueGreen)
          arrow.draw(ctx)
        } else {
          const drawNodeRing = sourceNode.drawRing || drawRing
          drawNodeRing(ctx, transform(sourceNodeIdPosition), purple, outerRadius)
        }
      }
    }
  }
}