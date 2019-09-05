import React, {Component} from 'react';
import {Image, Segment, Label, Icon} from 'semantic-ui-react'
import {renderSvg} from "../graphics/utils/offScreenSvgRenderer";

class SvgExport extends Component {

  render() {
    const {width, height, dataUrl} = renderSvg(this.props.graph)

    return (
      <Segment style={{
        maxHeight: 200,
        overflow: 'hidden',
      }}>
        <Label attached='top'>
          {width} × {height}
          <a href={dataUrl} download={this.props.diagramName + ".svg"}><Icon name="download"/>Download</a>
        </Label>
        <div style={{
          display: 'inline-block',
          backgroundImage: 'linear-gradient(45deg, #efefef 25%, transparent 25%), ' +
          'linear-gradient(-45deg, #efefef 25%, transparent 25%), ' +
          'linear-gradient(45deg, transparent 75%, #efefef 75%), ' +
          'linear-gradient(-45deg, transparent 75%, #efefef 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}>
          <Image src={dataUrl}/>
        </div>
      </Segment>
    )
  }
}

export default SvgExport