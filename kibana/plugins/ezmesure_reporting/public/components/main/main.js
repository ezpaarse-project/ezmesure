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
import { capabilities } from 'ui/capabilities';

import { Table } from '../table';
import { Flyout, openFlyOut } from '../flyout';
import { Toast, addToast } from '../toast';

export class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tasks: [],
      dashboards: [],
      frequencies: [],
    };
  }

  componentDidMount = () => {
    const { httpClient, space } = this.props;

    httpClient.get(`../api/ezmesure/reporting/tasks/${space}`).then(res => {
      this.setState({ tasks: res.data.tasks });

      this.setState({ dashboards: res.data.dashboards });

      this.setState({ frequencies: res.data.frequencies });
    }).catch(err => console.log(err));
  }

  editTaskHandler = task => {
    if (capabilities.get().ezmesure_reporting.edit) {
      let reqData = {
        dashboardId: task.dashboardId,
        frequency: task.reporting.frequency,
        emails: task.reporting.emails,
        print: task.reporting.print,
      };
      if (this.props.space) {
        reqData = { ...reqData, space: this.props.space };
      }

      this.props.httpClient.patch(`../api/ezmesure/reporting/tasks/${task._id}`, reqData).then(() => {
        const index = this.state.tasks.findIndex(({ _id }) => _id === task._id);

        const tasks = this.state.tasks;
        tasks[index] = task;
        this.setState({ tasks });

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
  }

  saveTaskHandler = task => {
    if (capabilities.get().ezmesure_reporting.save) {
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

      this.props.httpClient.post('../api/ezmesure/reporting/tasks', reqData).then(res => {
        task._id = res.data._id;
        task.reporting.createdAt = res.data.createdAt;

        tasks.push(task);
        this.setState({ tasks });

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
  }

  removeTaskHandler = task => {
    if (capabilities.get().ezmesure_reporting.delete) {
      if (task) {
        this.props.httpClient.delete(`../api/ezmesure/reporting/tasks/${task._id}`).then(() => {
          const tasks = this.state.tasks.filter(({ _id }) => _id !== task._id);
          this.setState({ tasks });

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
  }

  render() {
    const { tasks, dashboards, frequencies } = this.state;  

    let createBtn;
    if (capabilities.get().ezmesure_reporting.create) {
      createBtn = (<EuiPageContentHeaderSection>
        <EuiButton
          fill
          iconType="plusInCircle"
          onClick={() => openFlyOut(null, false)}
        >
          <FormattedMessage id="ezmesureReporting.createNewTask" defaultMessage="Create new reporting task" />
        </EuiButton>
      </EuiPageContentHeaderSection>);
    }
    
    return (
      <Fragment>
        <Toast />
        <Flyout dashboards={dashboards} frequencies={frequencies} editTaskHandler={this.editTaskHandler} saveTaskHandler={this.saveTaskHandler} />
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
                {createBtn}
              </EuiPageContentHeader>

              <EuiPageContentBody>
                <Table tasks={tasks} frequencies={frequencies} dashboards={dashboards} removeTaskHandler={this.removeTaskHandler} />
              </EuiPageContentBody>
            </EuiPageContent>
          </EuiPageBody>
        </EuiPage>
      </Fragment>
    );
  }
}
