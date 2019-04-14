import {createSelector} from "reselect";
import VisualNode from "../graphics/VisualNode";
import VisualEdge from "../graphics/VisualEdge";
import VisualGraph from "../graphics/VisualGraph";
import TransformationHandles from "../graphics/TransformationHandles";
import {bundle} from "../model/graph/relationshipBundling";
import {RoutedRelationshipBundle} from "../graphics/RoutedRelationshipBundle";
import { idsMatch } from "../model/Id";

const getSelection = (state) => state.selection
const getViewTransformation = (state) => state.viewTransformation

export const getPresentGraph = state => state.graph.present || state.graph

export const getGraph = (state) => {
  const { layers } = state.applicationLayout || { }

  if (layers && layers.length > 0) {
    const newState = layers.reduce((resultState, layer) => {
      if (layer.selector) {
        return layer.selector({ graph: resultState, [layer.name]: state[layer.name] })
      } else {
        return resultState
      }
    }, getPresentGraph(state))
    return newState
  } else {
    return getPresentGraph(state)
  }
}

export const getVisualGraph = createSelector(
  [getGraph, getSelection, getViewTransformation],
  (graph, selection, viewTransformation) => {
    const visualNodes = graph.nodes.reduce((nodeMap, node) => {
      nodeMap[node.id] = new VisualNode(node, graph)
      return nodeMap
    }, {})

    const visualRelationships = graph.relationships.map(relationship =>
      new VisualEdge(
        relationship,
        visualNodes[relationship.fromId],
        visualNodes[relationship.toId],
        selection.selectedRelationshipIdMap[relationship.id],
        graph),
    )
    const relationshipBundles = bundle(visualRelationships).map(bundle => {
      return new RoutedRelationshipBundle(bundle, graph);
    })

    return new VisualGraph(graph, visualNodes, relationshipBundles, viewTransformation)
  }
)

export const getTransformationHandles = createSelector(
  [getGraph, getSelection, getViewTransformation],
  (graph, selection, viewTransformation) => {
    return new TransformationHandles(graph, selection, viewTransformation)
  }
)

export const getPositionsOfSelectedNodes = (state) => {
  const graph = getGraph(state)
  const selectedNodes = Object.keys(state.selection.selectedNodeIdMap)
  const nodePositions = []
  selectedNodes.forEach((nodeId) => {
    const node = graph.nodes.find((node) => idsMatch(node.id, nodeId))
    nodePositions.push({
      nodeId: nodeId,
      position: node.position,
      radius: node.style && node.style.radius || graph.style.radius
    })
  })
  return nodePositions
}