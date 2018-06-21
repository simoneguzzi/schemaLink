import {
  FETCHING_GRAPH, FETCHING_GRAPH_SUCCEEDED, FETCHING_GRAPH_FAILED,
  UPDATING_GRAPH, UPDATING_GRAPH_FAILED, UPDATING_GRAPH_SUCCEEDED
} from "../state/storageStatus";

export function fetchingGraph() {
  return {
    type: FETCHING_GRAPH
  }
}

export function fetchingGraphFailed() {
  return {
    type: FETCHING_GRAPH_FAILED
  }
}

export function fetchingGraphSucceeded(storedGraph) {
  return {
    type: FETCHING_GRAPH_SUCCEEDED,
    storedGraph
  }
}

export function updatingGraph() {
  return {
    type: UPDATING_GRAPH
  }
}

export function updatingGraphFailed() {
  return {
    type: UPDATING_GRAPH_FAILED
  }
}

export function updatingGraphSucceeded() {
  return {
    type: UPDATING_GRAPH_SUCCEEDED
  }
}