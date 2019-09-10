import React, { Component, Fragment } from 'react';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
} from '@elastic/eui';
import { defaultDashboard } from '../lib/reporting';
import Form from './form';

let openFlyOutHandler;

export function openFlyOut(dashboard, edit) {
  openFlyOutHandler(dashboard, edit);
}

export default class Flyout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      httpClient: props.httpClient,
      isFlyoutVisible: false,
      edit: false,
      currentDashboard: null,
    };

    openFlyOutHandler = this.open;
  }

  open = (dashboard, edit) => {
    this.setState({ isFlyoutVisible: true });
    this.setState({ edit });
    this.setState({ currentDashboard: JSON.parse(JSON.stringify(dashboard || defaultDashboard)) });
  }

  close = () => {
    this.setState({ isFlyoutVisible: false });
  }

  render() {
    const { httpClient, isFlyoutVisible, currentDashboard, edit } = this.state;
    let flyOutRender;

    if (isFlyoutVisible) {
      flyOutRender = (
        <EuiFlyout
          onClose={this.close}
          size="m"
          aria-labelledby="flyoutSmallTitle">
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2>Creating a reporting task</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <Form httpClient={httpClient} currentDashboard={currentDashboard} edit={edit} />
          </EuiFlyoutBody>
        </EuiFlyout>
      );
    }

    return (
      <Fragment>
        {flyOutRender}
      </Fragment>
    );
  }
}
