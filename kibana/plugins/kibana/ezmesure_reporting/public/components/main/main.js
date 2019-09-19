/* eslint-disable @kbn/eslint/require-license-header */
import React, { Fragment } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiTitle,
  EuiButton,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';

import { Table } from '../table';
import { Flyout, openFlyOut } from '../flyout';
import { Toast, addToast } from '../toast';

export class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      reporting: [],
      dashboards: [],
    };
  }

  componentDidMount = () => {
    const { httpClient, space } = this.props;

    httpClient.get(`../api/ezmesure/reporting/tasks/${space}`).then(res => {
      this.setState({ reporting: res.data.reporting });

      this.setState({ dashboards: res.data.dashboards });
    }).catch(err => console.log(err));
  }

  editTaskHandler = task => {
    let reqData = {
      dashboardId: task.dashboard.value,
      frequency: task.reporting.frequency,
      emails: task.reporting.emails,
    };
    if (this.props.space) {
      reqData = { ...reqData, space: this.props.space };
    }

    this.props.httpClient.patch(`../api/ezmesure/reporting/tasks/${task._id}`, reqData).then(() => {
      const index = this.state.reporting.findIndex(({ _id }) => _id === task._id);

      const reporting = this.state.reporting;
      reporting[index] = task;
      this.setState({ reporting });

      addToast(
        'Success',
        <FormattedMessage id="ezmesureReporting.editingSuccess" defaultMessage="Task editing successfully." />,
        'success',
      );

      this.forceUpdate();
    }).catch(() => {
      addToast(
        'Error',
        <FormattedMessage id="ezmesureReporting.editingError" defaultMessage="An error occurred when editing the task." />,
        'danger'
      );
    });
  }

  saveTaskHandler = task => {
    const reporting = this.state.reporting;

    let reqData = {
      dashboardId: task.dashboard.value,
      frequency: task.reporting.frequency,
      emails: task.reporting.emails,
    };
    if (this.props.space) {
      reqData = { ...reqData, space: this.props.space };
    }

    this.props.httpClient.post('../api/ezmesure/reporting/tasks', reqData).then(res => {
      task._id = res.data._id;
      task.reporting.createdAt = res.data.createdAt;

      reporting.push(task);
      this.setState({ reporting });

      addToast(
        'Success',
        <FormattedMessage id="ezmesureReporting.creationSuccess" defaultMessage="Task created successfully." />,
        'success',
      );

      this.forceUpdate();
    }).catch(() => {
      addToast(
        'Error',
        <FormattedMessage id="ezmesureReporting.creationError" defaultMessage="An error occurred when creating the task." />,
        'danger'
      );
    });
  }

  removeTaskHandler = task => {
    if (task) {
      this.props.httpClient.delete(`../api/ezmesure/reporting/tasks/${task._id}`).then(() => {
        const reporting = this.state.reporting.filter(({ _id }) => _id !== task._id);
        this.setState({ reporting });

        addToast(
          'Success',
          <FormattedMessage id="ezmesureReporting.removalSuccess" defaultMessage="Task removed successfully." />,
          'success',
        );

        this.forceUpdate();
      }).catch(() => {
        addToast(
          'Error',
          <FormattedMessage id="ezmesureReporting.removalError" defaultMessage="An error occurred during the removal of the task." />,
          'danger'
        );
      });
    }

    if (!task._id) {
      addToast(
        'Error',
        <FormattedMessage id="ezmesureReporting.removalError" defaultMessage="An error occurred during the removal of the task." />,
        'danger'
      );
    }
  }

  render() {
    const { reporting, dashboards } = this.state;

    return (
      <Fragment>
        <Toast />
        <Flyout dashboards={dashboards} editTaskHandler={this.editTaskHandler} saveTaskHandler={this.saveTaskHandler} />
        <EuiPage>
          <EuiPageBody className="euiPageBody--restrictWidth-default">
            <EuiPageContent horizontalPosition="center">
              <EuiPageContentHeader>
                <EuiPageContentHeaderSection>
                  <EuiTitle>
                    <h2>
                      <FormattedMessage id="ezmesureReporting.title" defaultMessage="Reporting ezMESURE" />
                    </h2>
                  </EuiTitle>
                </EuiPageContentHeaderSection>
                <EuiPageContentHeaderSection>
                  <EuiButton
                    fill
                    iconType="plusInCircle"
                    onClick={() => openFlyOut(null, false)}
                  >
                    <FormattedMessage id="ezmesureReporting.createNewTask" defaultMessage="Create new reporting task" />
                  </EuiButton>
                </EuiPageContentHeaderSection>
              </EuiPageContentHeader>

              <EuiPageContentBody>
                <Table reporting={reporting} removeTaskHandler={this.removeTaskHandler} />
              </EuiPageContentBody>
            </EuiPageContent>
          </EuiPageBody>
        </EuiPage>
      </Fragment>
    );
  }
}
