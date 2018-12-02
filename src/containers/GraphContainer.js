import {connect} from "react-redux"
import GraphDisplay from "../components/GraphDisplay"
import {compose} from "recompose"
import withKeyBindings from "../interactions/Keybindings"
import {
  getVisualGraph,
  getTransformationHandles,
  getToolboxes,
  getVisualGraphForSelectedCluster, getChildViewTransformation
} from "../selectors/index"
import {deleteSelection, duplicateSelection} from "../actions/graph"
import {removeSelectionPath} from "../actions/selectionPath"
import {selectAll, jumpToNextNode} from "../actions/selection";
import {computeCanvasSize} from "../model/applicationLayout";

const mapStateToProps = state => {
  return {
    visualGraph: getVisualGraph(state),
    childGraph: {}, // getVisualGraphForSelectedCluster(state),
    selection: state.selection,
    gestures: state.gestures,
    guides: state.guides,
    handles: getTransformationHandles(state),
    canvasSize: computeCanvasSize(state.applicationLayout),
    viewTransformation: state.viewTransformation,
    toolboxes: getToolboxes(state),
    childViewTransformation: getChildViewTransformation(state)
  }
}

const mapDispatchToProps = dispatch => {
  return {
    removeSelectionPath: () => dispatch(removeSelectionPath()),
    duplicateSelection: () => dispatch(duplicateSelection()),
    deleteSelection: () => dispatch(deleteSelection()),
    selectAll: () => dispatch(selectAll()),
    jumpToNextNode: (direction, extraKeys) => dispatch(jumpToNextNode(direction, extraKeys)),
    dispatch: dispatch
  }
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withKeyBindings
)(GraphDisplay)