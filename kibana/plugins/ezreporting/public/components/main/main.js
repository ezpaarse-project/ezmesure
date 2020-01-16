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
  EuiEmptyPrompt,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import { capabilities } from 'ui/capabilities';

import { Table } from '../table';
import { Flyout, openFlyOut, closeFlyOut } from '../flyout';
import { Toast, addToast } from '../toast';

export class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tasks: [],
      dashboards: [],
      frequencies: [],
      reportingName: 'Reporting',
      accessDenied: false,
    };
  }

  componentDidMount = () => {
    const { httpClient, space } = this.props;

    httpClient.get(`../api/ezreporting/reporting/tasks/${space}`).then(res => {
      this.setState({ tasks: res.data.tasks });

      this.setState({ dashboards: res.data.dashboards });

      this.setState({ frequencies: res.data.frequencies });

      this.setState({ reportingName: res.data.reportingName });
    }).catch((err) => {
      if (err.data.code === 403) {
        this.setState({ accessDenied: true });
      }
      return addToast(
        'Error',
        <FormattedMessage id="ezReporting.errorOccured" defaultMessage="An error occurred while loading the data." />,
        'danger'
      );
    });
  }

  editTaskHandler = (task) => {
    if (capabilities.get().ezreporting.edit) {
      let reqData = {
        dashboardId: task.dashboardId,
        frequency: task.reporting.frequency,
        emails: task.reporting.emails,
        print: task.reporting.print,
      };
      if (this.props.space) {
        reqData = { ...reqData, space: this.props.space };
      }

      return this.props.httpClient.patch(`../api/ezreporting/reporting/tasks/${task._id}`, reqData).then(() => {
        const index = this.state.tasks.findIndex(({ _id }) => _id === task._id);

        const tasks = this.state.tasks;
        tasks[index] = task;
        this.setState({ tasks });

        addToast(
          'Success',
          <FormattedMessage id="ezReporting.editingSuccess" defaultMessage="Task editing successfully." />,
          'success',
        );

        closeFlyOut();
        this.forceUpdate();
      });
    }
  }

  saveTaskHandler = (task) => {
    if (capabilities.get().ezreporting.save) {
      const tasks = this.state.tasks;

      let reqData = {
        dashboardId: task.dashboardId,
        frequency: task.reporting.frequency,
        emails: task.reporting.emails,
        print: task.reporting.print,
      };
      if (this.props.space) {
        reqData = { ...reqData, space: this.props.space };
      }

      return this.props.httpClient.post('../api/ezreporting/reporting/tasks', reqData).then(res => {
        task._id = res.data._id;
        task.reporting.createdAt = res.data.createdAt;

        tasks.push(task);
        this.setState({ tasks });

        addToast(
          'Success',
          <FormattedMessage id="ezReporting.creationSuccess" defaultMessage="Task created successfully." />,
          'success',
        );

        closeFlyOut();
        this.forceUpdate();
      });
    }
  }

  removeTaskHandler = (task) => {
    if (capabilities.get().ezreporting.delete) {
      if (task) {
        this.props.httpClient.delete(`../api/ezreporting/reporting/tasks/${task._id}`).then(() => {
          const tasks = this.state.tasks.filter(({ _id }) => _id !== task._id);
          this.setState({ tasks });

          addToast(
            'Success',
            <FormattedMessage id="ezReporting.removalSuccess" defaultMessage="Task removed successfully." />,
            'success',
          );

          this.forceUpdate();
        }).catch(() => {
          addToast(
            'Error',
            <FormattedMessage id="ezReporting.removalError" defaultMessage="An error occurred during the removal of the task." />,
            'danger'
          );
        });
      }

      if (!task._id) {
        addToast(
          'Error',
          <FormattedMessage id="ezReporting.removalError" defaultMessage="An error occurred during the removal of the task." />,
          'danger'
        );
      }
    }
  }

  loadHistory = (taskId) => {
    if (capabilities.get().ezreporting.show) {
      if (taskId) {
        return this.props.httpClient.get(`../api/ezreporting/reporting/tasks/${taskId}/history`);
      }
    }
  }

  downloadReport = (taskId) => {
    if (capabilities.get().ezreporting.save) {
      if (taskId) {
        return this.props.httpClient.get(`../api/ezreporting/reporting/tasks/${taskId}/download`);
      }
    }
  }

  render() {
    const { tasks, dashboards, frequencies, reportingName, accessDenied } = this.state;

    if (accessDenied) {
      const defaultMsg = `
        You are not authorized to access Reporting.
        To use Reporting management, you need the privileges granted by the \`reporting\` role.
      `;
      return (
        <EuiEmptyPrompt
          iconType="reportingApp"
          title={<h2><FormattedMessage id="ezReporting.accessDeniedTitle" defaultMessage="Access denied" /></h2>}
          body={
            <Fragment>
              <p>
                <FormattedMessage
                  id="ezReporting.accessDenied"
                  defaultMessage={defaultMsg}
                />,
              </p>
            </Fragment>
          }
        />
      );
    }

    let createBtn;
    if (capabilities.get().ezreporting.create) {
      createBtn = (
        <EuiPageContentHeaderSection>
          <EuiButton
            fill
            iconType="plusInCircle"
            isDisabled={dashboards.length > 0 ? false : true}
            onClick={() => dashboards.length > 0 ? openFlyOut(null, false) : null}
          >
            <FormattedMessage id="ezReporting.createNewTask" defaultMessage="Create new reporting task" />
          </EuiButton>
        </EuiPageContentHeaderSection>
      );
    }

    return (
      <Fragment>
        <Toast />
        <Flyout
          dashboards={dashboards}
          frequencies={frequencies}
          editTaskHandler={this.editTaskHandler}
          saveTaskHandler={this.saveTaskHandler}
        />
        <EuiPage>
          <EuiPageBody className="euiPageBody--restrictWidth-default">
            <EuiPageContent horizontalPosition="center">
              <EuiPageContentHeader>
                <EuiPageContentHeaderSection>
                  <EuiTitle>
                    <h2>
                      <FormattedMessage
                        id="ezReporting.title"
                        values={{ REPORTING_NAME: reportingName }}
                        defaultMessage="{REPORTING_NAME}"
                      />
                    </h2>
                  </EuiTitle>
                </EuiPageContentHeaderSection>
                {createBtn}
              </EuiPageContentHeader>

              <EuiPageContentBody>
                <Table
                  tasks={tasks}
                  frequencies={frequencies}
                  dashboards={dashboards}
                  removeTaskHandler={this.removeTaskHandler}
                  loadHistory={this.loadHistory}
                  downloadReport={this.downloadReport}
                />
              </EuiPageContentBody>
            </EuiPageContent>
          </EuiPageBody>
        </EuiPage>
      </Fragment>
    );
  }
}
