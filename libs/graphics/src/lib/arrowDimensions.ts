import { Graph, getStyleSelector } from '@neo4j-arrows/model';
import { adaptForBackground } from './backgroundColorAdaption';
import { selectionBorder, Cardinality } from '@neo4j-arrows/model';
import { ResolvedRelationship } from './ResolvedRelationship';
import { VisualNode } from './VisualNode';

export interface ArrowDimensions {
  startRadius?: number;
  endRadius?: number;
  arrowWidth: any;
  arrowColor: any;
  selectionColor?: any;
  hasOutgoingArrowHead: boolean;
  hasIngoingArrowHead: boolean;
  headWidth: number;
  headHeight: number;
  chinHeight: number;
  separation?: any;
  leftToRight?: boolean;
}

export const relationshipArrowDimensions = (
  resolvedRelationship: ResolvedRelationship,
  graph: Graph,
  leftNode: VisualNode
): ArrowDimensions => {
  const style = (styleKey: string) =>
    getStyleSelector(resolvedRelationship.relationship, styleKey)(graph);
  const startRadius = resolvedRelationship.from.radius + style('margin-start');
  const endRadius = resolvedRelationship.to.radius + style('margin-end');
  const arrowWidth = style('arrow-width');
  const arrowColor = style('arrow-color');
  const selectionColor = adaptForBackground(selectionBorder, style);

  let hasOutgoingArrowHead = false;
  let hasIngoingArrowHead = false;
  let headWidth = 0;
  let headHeight = 0;
  let chinHeight = 0;

  const cardinality = resolvedRelationship.relationship.cardinality;
  if (cardinality !== Cardinality.MANY_TO_MANY) {
    hasOutgoingArrowHead = true;
    headWidth = arrowWidth + 6 * Math.sqrt(arrowWidth);
    headHeight = headWidth * 1.5;
    chinHeight = headHeight / 10;
  }
  if (cardinality === Cardinality.ONE_TO_ONE) {
    hasIngoingArrowHead = true;
  }

  const separation = style('margin-peer');
  const leftToRight = resolvedRelationship.from === leftNode;

  return {
    startRadius,
    endRadius,
    arrowWidth,
    arrowColor,
    selectionColor,
    hasOutgoingArrowHead,
    hasIngoingArrowHead,
    headWidth,
    headHeight,
    chinHeight,
    separation,
    leftToRight,
  };
};
