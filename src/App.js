import React, { Component } from 'react';
import { Tooltip, Button } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';

class App extends Component {
  render() {
    return (
      <div>
        <Tooltip title={
          <React.Fragment>
            <p style={{fontWeight:"bold"}}>Card Name</p>
            <span>Card description long</span>
          </React.Fragment>
        } placement="right">
          <div style={{width: 100}}>
            <AddIcon />
            <p>Card Name</p>
          </div>
        </Tooltip>
      </div>
    );
  }
}

export default App;
