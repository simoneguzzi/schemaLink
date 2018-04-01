import {updatingGraph, updatingGraphFailed, updatingGraphSucceeded} from "../actions/neo4jStorage";
import {stringTypeToDatabaseType} from "../model/Relationship";
import {propertyKeyToDatabaseKey, styleKeyToDatabaseKey} from "../model/properties";

const neo4j = require("neo4j-driver/lib/browser/neo4j-web.min.js").v1;
const host = "bolt://localhost:7687"
const driver = neo4j.driver(host, neo4j.auth.basic("neo4j", "a"))

let pendingMoveNodeActions = {}

export const storageMiddleware = store => next => action => {
  const runInSession = (work) => {
    store.dispatch(updatingGraph())
    const session = driver.session()
    work(session)
      .then(() => {
        session.close()
        store.dispatch(updatingGraphSucceeded())
      })
      .catch((error) => {
        console.log(error)
        store.dispatch(updatingGraphFailed())
      })
  }

  switch (action.type) {
    case 'CREATE_NODE': {
      const styleProperties = {}
      Object.keys(action.style).forEach((key) => {
        styleProperties[styleKeyToDatabaseKey(key)] = action.style[key]
      })

      runInSession((session) => session.run('CREATE (n:Diagram0 {_id: $id, _x: $x, _y: $y, _radius: $radius, ' +
        '_caption: $caption}) SET n += $style', {
        id: action.newNodeId,
        x: action.newNodePosition.x,
        y: action.newNodePosition.y,
        radius: action.radius,
        caption: action.caption,
        style: styleProperties
      }))
      break
    }

    case 'CREATE_NODE_AND_RELATIONSHIP': {
      const styleProperties = {}
      Object.keys(action.style).forEach((key) => {
        styleProperties[styleKeyToDatabaseKey(key)] = action.style[key]
      })

      runInSession((session) => session.run('MATCH (n:Diagram0 {_id: $sourceNodeId}) ' +
        'CREATE (n)-[:_RELATED {_id: $newRelationshipId}]->' +
        '(t:Diagram0 {_id: $targetNodeId, _x: $x, _y: $y, _radius: $radius, ' +
        '_caption: $caption}) SET t += $style', {
        sourceNodeId: action.sourceNodeId,
        newRelationshipId: action.newRelationshipId,
        targetNodeId: action.targetNodeId,
        x: action.targetNodePosition.x,
        y: action.targetNodePosition.y,
        radius: action.radius,
        caption: action.caption,
        style: styleProperties
      }))
      break
    }

    case 'CONNECT_NODES': {
      runInSession((session) => session.run('MATCH (source:Diagram0 {_id: $sourceNodeId}), (target:Diagram0 {_id: $targetNodeId}) ' +
        'CREATE (source)-[:_RELATED {_id: $newRelationshipId}]->(target)', {
        sourceNodeId: action.sourceNodeId,
        newRelationshipId: action.newRelationshipId,
        targetNodeId: action.targetNodeId
      }))
      break
    }

    case 'SET_NODE_CAPTION': {
      runInSession((session) => session.run('MATCH (n:Diagram0) WHERE n._id IN $ids ' +
        'SET n._caption = $caption', {
        ids: Object.keys(action.selection.selectedNodeIdMap),
        caption: action.caption
      }))
      break
    }

    case 'RENAME_PROPERTY': {
      runInSession((session) => {
        session.run('MATCH (n:Diagram0) WHERE n._id IN $ids ' +
          'SET n.`' + propertyKeyToDatabaseKey(action.newPropertyKey) + '` = n.`' + propertyKeyToDatabaseKey(action.oldPropertyKey) + '` ' +
          'REMOVE n.`' + propertyKeyToDatabaseKey(action.oldPropertyKey) + '`', {
          ids: Object.keys(action.selection.selectedNodeIdMap)
        });
        return session.run('MATCH (:Diagram0)-[r]->(:Diagram0) WHERE r._id IN $ids ' +
          'SET r.`' + propertyKeyToDatabaseKey(action.newPropertyKey) + '` = r.`' + propertyKeyToDatabaseKey(action.oldPropertyKey) + '` ' +
          'REMOVE r.`' + propertyKeyToDatabaseKey(action.oldPropertyKey) + '`', {
          ids: Object.keys(action.selection.selectedRelationshipIdMap)
        });
      })
      break
    }

    case 'SET_PROPERTIES': {
      const properties = {}
      action.keyValuePairs.forEach((keyValuePair) => {
        properties[propertyKeyToDatabaseKey(keyValuePair.key)] = keyValuePair.value
      })
      runInSession((session) => {
        session.run('MATCH (n:Diagram0) WHERE n._id IN $ids ' +
          'SET n += $properties', {
          ids: Object.keys(action.selection.selectedNodeIdMap),
          properties: properties
        });
        return session.run('MATCH (:Diagram0)-[r]->(:Diagram0) WHERE r._id IN $ids ' +
          'SET r += $properties', {
          ids: Object.keys(action.selection.selectedRelationshipIdMap),
          properties: properties
        });
      })
      break
    }

    case 'SET_ARROWS_PROPERTIES': {
      const styleProperties = {}
      action.keyValuePairs.forEach((keyValuePair) => {
        styleProperties[styleKeyToDatabaseKey(keyValuePair.key)] = keyValuePair.value
      })
      runInSession((session) => {
        session.run('MATCH (n:Diagram0) WHERE n._id IN $ids ' +
          'SET n += $properties', {
          ids: Object.keys(action.selection.selectedNodeIdMap),
          properties: styleProperties
        });
        return session.run('MATCH (:Diagram0)-[r]->(:Diagram0) WHERE r._id IN $ids ' +
          'SET r += $properties', {
          ids: Object.keys(action.selection.selectedRelationshipIdMap),
          properties: styleProperties
        });
      })
      break
    }

    case 'REMOVE_PROPERTY': {
      runInSession((session) => {
        session.run('MATCH (n:Diagram0) WHERE n._id IN $ids ' +
          'REMOVE n.`' + propertyKeyToDatabaseKey(action.key) + '`', {
          ids: Object.keys(action.selection.selectedNodeIdMap)
        });
        return session.run('MATCH (:Diagram0)-[r]->(:Diagram0) WHERE r._id IN $ids ' +
          'REMOVE r.`' + propertyKeyToDatabaseKey(action.key) + '`', {
          ids: Object.keys(action.selection.selectedRelationshipIdMap)
        });
      })
      break
    }

    case 'MOVE_NODES': {
      action.nodePositions.forEach((nodePosition) => {
        pendingMoveNodeActions[nodePosition.nodeId] = nodePosition.position
      })
      break
    }

    case 'END_DRAG': {
      if (Object.keys(pendingMoveNodeActions).length !== 0) {
        runInSession((session) => {
          let result = session
          Object.keys(pendingMoveNodeActions).forEach((nodeId) => {
            const position = pendingMoveNodeActions[nodeId]
            result = session.run('MATCH (n:Diagram0 {_id: $id}) ' +
              'SET n._x = $x, n._y = $y', {
              id: nodeId,
              x: position.x,
              y: position.y
            })
          })
          return result
        })
        pendingMoveNodeActions = {}
      }
      break
    }

    case 'SET_RELATIONSHIP_TYPE': {
      const newType = stringTypeToDatabaseType(action.relationshipType)
      runInSession((session) => {
        let result = session
        Object.keys(action.selection.selectedRelationshipIdMap).forEach((relationshipId) => {
          result = session.run(`MATCH (n)-[r]->(m)
            WHERE r._id = $id
            CREATE (n)-[r2:\`${newType}\`]->(m)
            SET r2 = r
            WITH r
            DELETE r`, {
            id: relationshipId
          })
        })
        return result
      })
      break
    }

    case 'DELETE_NODES_AND_RELATIONSHIPS': {
      const nodeIds = Object.keys(action.nodeIdMap)
      const relIds = Object.keys(action.relationshipIdMap)
      runInSession(session => {
        let result = session
        if (relIds.length > 0) {
          result = session.run(`match(d:Diagram0)-[r]-()
          where r._id in $ids
          delete r`, {
              ids: relIds
            }
          )
        }
        if (nodeIds.length > 0) {
          result = session.run(`match(d:Diagram0)
          where d._id in $ids
          delete d`, {
              ids: nodeIds
            }
          )
        }
        return result
      })
      break
    }

    default:
      // other actions do not need to be stored
  }

  return next(action)
}