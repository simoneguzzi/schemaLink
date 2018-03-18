import snapToTargetNode from "./snapToTargetNode";
import {snapToDistancesAndAngles} from "./geometricSnapping";
import {Guides} from "../graphics/Guides";
import {idsMatch} from "../model/Id";
import { nodesInsidePolygon } from "../model/Graph";

export const TOGGLE_SELECTION_RING = 'TOGGLE_SELECTION_RING'
export const ENSURE_SELECTION_RING = 'ENSURE_SELECTION_RING'
export const UPDATE_SELECTION_PATH = 'UPDATE_SELECTION_PATH'
export const REMOVE_SELECTION_PATH = 'REMOVE_SELECTION_PATH'
export const CLEAR_SELECTION_RINGS = 'CLEAR_SELECTION_RINGS'
export const SET_MARQUEE = 'SET_MARQUEE'
export const REMOVE_MARQUEE = 'REMOVE_MARQUEE'

export const activateRing = (sourceNodeId) => {
  return {
    type: 'ACTIVATE_RING',
    sourceNodeId
  }
}

export const deactivateRing = () => {
  return {
    type: 'DEACTIVATE_RING'
  }
}

export const tryDragRing = (sourceNodeId, position) => {
  return function (dispatch, getState) {
    let graph = getState().graph;
    let targetSnaps = snapToTargetNode(graph, sourceNodeId, position)
    if (targetSnaps.snapped) {
      dispatch(ringDraggedConnected(sourceNodeId, targetSnaps.snappedNodeId, targetSnaps.snappedPosition))
    } else {
      let snaps = snapToDistancesAndAngles(
        graph,
        [graph.nodes.find((node) => idsMatch(node.id, sourceNodeId))],
        (nodeId) => true,
        position
      )
      if (snaps.snapped) {
        dispatch(ringDraggedDisconnected(sourceNodeId, snaps.snappedPosition, new Guides(snaps.guidelines, position)))
      } else {
        dispatch(ringDraggedDisconnected(sourceNodeId, position, new Guides()))
      }
    }
  }
}

const ringDraggedDisconnected = (sourceNodeId, position, guides) => {
  return {
    type: 'RING_DRAGGED',
    sourceNodeId,
    targetNodeId: null,
    position,
    guides
  }
}

const ringDraggedConnected = (sourceNodeId, targetNodeId, position) => {
  return {
    type: 'RING_DRAGGED',
    sourceNodeId,
    targetNodeId,
    position,
    guides: new Guides()
  }
}

export const toggleSelection = (entity, additive) => ({
  type: 'TOGGLE_SELECTION',
  entityType: entity.entityType,
  id: entity.id,
  additive
})

export const ensureSelectionRing = (selectedNodeIds) => ({
  type: ENSURE_SELECTION_RING,
  selectedNodeIds
})

export const clearSelectionRings = () => ({
  type: CLEAR_SELECTION_RINGS,
})

export const updateSelectionPath = (position) => ({
  type: UPDATE_SELECTION_PATH,
  position
})

export const removeSelectionPath = () => ({
  type: REMOVE_SELECTION_PATH
})

export const tryUpdateSelectionPath = (position, isDoubleClick) => {
  return function (dispatch, getState) {
    const { graph, gestures } = getState()

    if (isDoubleClick) {
      if (gestures.selection.path.length === 0) {
        dispatch(updateSelectionPath(position))
      } else {
        const selectedNodeIds = nodesInsidePolygon(graph, gestures.selection.path)
        if (selectedNodeIds.length > 0) {
          dispatch(ensureSelectionRing(selectedNodeIds))
        }
        dispatch(removeSelectionPath())
      }
    } else if (gestures.selection.path.length > 0) {
      dispatch(updateSelectionPath(position))
    } else {
      dispatch(clearSelectionRings())
    }
  }
}

export const setMarquee = (from, to) => ({
  type: SET_MARQUEE,
  marquee: {from, to}
})



export const removeMarquee = () => ({
  type: REMOVE_MARQUEE,
  marquee: null
})

export const updateMarquee = (from, to) => {
  return function (dispatch, getState) {
    const { graph } = getState()
    const bBox = getBboxFromCorners(from, to)
    const selectedNodeIds = nodesInsidePolygon(graph, bBox)
    if (selectedNodeIds.length > 0) {
      dispatch(ensureSelectionRing(selectedNodeIds))
    }
    dispatch(setMarquee(from, to))
  }
}

export const endMarquee = (from, to) => {
  return function (dispatch, getState) {
    const { graph } = getState()
    const bBox = getBboxFromCorners(from, to)
    const selectedNodeIds = nodesInsidePolygon(graph, bBox)
    if (selectedNodeIds.length > 0) {
      dispatch(ensureSelectionRing(selectedNodeIds))
    }
    dispatch(removeMarquee())
  }
}

const getBboxFromCorners = (from, to) => [
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