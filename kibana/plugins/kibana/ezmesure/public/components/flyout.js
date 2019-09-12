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

let updateEdit;
export function updateEditData(edit) {
  updateEdit(edit);
}

export default class Flyout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      httpClient: props.httpClient,
      space: props.space,
      isFlyoutVisible: false,
      edit: false,
      currentDashboard: null,
    };

    openFlyOutHandler = this.open;
    updateEdit = this.updateEdit;
  }

  open = (dashboard, edit, callback) => {
    this.setState({ isFlyoutVisible: true });
    this.setState({ edit });
    this.setState({ currentDashboard: JSON.parse(JSON.stringify(dashboard || defaultDashboard)) });
  }

  close = () => {
    this.setState({ isFlyoutVisible: false });
  }

  updateEdit = edit => {
    this.setState({ edit });
    this.forceUpdate();
  }

  render() {
    const { httpClient, isFlyoutVisible, currentDashboard, edit, space } = this.state;
    let flyOutRender;

    if (isFlyoutVisible) {
      const title = edit ? 'Editing' : 'Creating'
      flyOutRender = (
        <EuiFlyout
          onClose={this.close}
          size="m"
          aria-labelledby="flyoutSmallTitle">
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2>{ title } a reporting task</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <Form httpClient={httpClient} currentDashboard={currentDashboard} edit={edit} space={space} />
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
