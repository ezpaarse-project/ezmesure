/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { Component, Fragment } from 'react';
import { FormattedMessage, I18nProvider } from '@kbn/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
  EuiButton,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiTitle,
  EuiPageContentHeaderSection,
  EuiEmptyPrompt,
} from '@elastic/eui';

import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';

import { PLUGIN_ID } from '../../common';
import { EzreportingTable } from './table';
import {
  EzreportingTaskEditFlyout,
  openFlyOut as openEditFlyOut,
  closeFlyOut as closeEditFlyOut,
} from './flyout/edit';
import { EzreportingHistoryFlyout } from './flyout/history';

import { httpClient, toasts, capabilities } from '../../lib/reporting';

interface EzreportingAppDeps {
  basename: string;
  navigation: NavigationPublicPluginStart;
}

interface EzreportingAppState {
  tasks: any[];
  dashboards: any[];
  frequencies: any[];
  reportingName: string;
  accessDenied: boolean;
}

export class EzreportingApp extends Component<EzreportingAppDeps, EzreportingAppState> {
  constructor(props: EzreportingAppDeps) {
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
    httpClient
      .get('/api/ezreporting/tasks')
      .then((res) => {
        this.setState({
          tasks: res.tasks,
          dashboards: res.dashboards,
          frequencies: res.frequencies,
          reportingName: res.reportingName,
        });
      })
      .catch((err) => {
        if (err.code === 403) {
          this.setState({ accessDenied: true });
        }
        return toasts.addDanger({
          title: 'Error',
          text: (
            <FormattedMessage
              id="ezReporting.errorOccured"
              defaultMessage="An error occurred while loading the data."
            />
          ),
        });
      });
  };

  editTaskHandler = (task) => {
    if (capabilities.edit) {
      const body = JSON.stringify({
        dashboardId: task.dashboardId,
        frequency: task.reporting.frequency,
        emails: task.reporting.emails,
        print: task.reporting.print,
      });

      return httpClient.patch(`/api/ezreporting/tasks/${task._id}`, { body }).then(() => {
        const index = this.state.tasks.findIndex(({ _id }) => _id === task._id);

        const tasks = this.state.tasks;
        tasks[index] = task;
        this.setState({ tasks });

        toasts.addSuccess({
          title: 'Success',
          text: (
            <FormattedMessage
              id="ezReporting.editingSuccess"
              defaultMessage="Task edited successfully."
            />
          ),
        });

        closeEditFlyOut();
        this.forceUpdate();
      });
    }
  };

  saveTaskHandler = (task) => {
    if (capabilities.save) {
      const tasks = this.state.tasks;

      const body = JSON.stringify({
        dashboardId: task.dashboardId,
        frequency: task.reporting.frequency,
        emails: task.reporting.emails,
        print: task.reporting.print,
      });

      return httpClient.post('/api/ezreporting/tasks', { body }).then((res) => {
        task._id = res._id;
        task.reporting.createdAt = res.createdAt;

        tasks.push(task);
        this.setState({ tasks });

        toasts.addSuccess({
          title: 'Success',
          text: (
            <FormattedMessage
              id="ezreporting.editingSuccess"
              defaultMessage="Task edited successfully."
            />
          ),
        });

        closeEditFlyOut();
        this.forceUpdate();
      });
    }
  };

  removeTaskHandler = (task) => {
    if (capabilities.delete) {
      if (task) {
        httpClient
          .delete(`/api/ezreporting/tasks/${task._id}`)
          .then(() => {
            const tasks = this.state.tasks.filter(({ _id }) => _id !== task._id);
            this.setState({ tasks });

            toasts.addSuccess({
              title: 'Success',
              text: (
                <FormattedMessage
                  id="ezReporting.removalSuccess"
                  defaultMessage="Task removed successfully."
                />
              ),
            });

            this.forceUpdate();
          })
          .catch(() => {
            toasts.addDanger({
              title: 'Error',
              text: (
                <FormattedMessage
                  id="ezReporting.removalError"
                  defaultMessage="An error occurred during the removal of the task."
                />
              ),
            });
          });
      }

      if (!task._id) {
        toasts.addDanger({
          title: 'Error',
          text: (
            <FormattedMessage
              id="ezReporting.removalError"
              defaultMessage="An error occurred during the removal of the task."
            />
          ),
        });
      }
    }
  };

  downloadReport = (taskId) => {
    if (capabilities.save && taskId) {
      return httpClient.get(`/api/ezreporting/tasks/${taskId}/download`);
    }
  };

  render() {
    const { basename, navigation } = this.props;
    const { tasks, dashboards, frequencies, reportingName, accessDenied } = this.state;

    if (accessDenied) {
      const defaultMsg = `
        You are not authorized to access Reporting.
        To use Reporting management, you need the privileges granted by the \`reporting\` role.
      `;
      return (
        <EuiEmptyPrompt
          iconType="reportingApp"
          title={
            <h2>
              <FormattedMessage id="ezReporting.accessDeniedTitle" defaultMessage="Access denied" />
            </h2>
          }
          body={
            <Fragment>
              <p>
                <FormattedMessage id="ezReporting.accessDenied" defaultMessage={defaultMsg} />,
              </p>
            </Fragment>
          }
        />
      );
    }

    return (
      <Router basename={basename}>
        <EzreportingTaskEditFlyout
          dashboards={dashboards}
          frequencies={frequencies}
          editTaskHandler={this.editTaskHandler}
          saveTaskHandler={this.saveTaskHandler}
        />
        <EzreportingHistoryFlyout />
        <I18nProvider>
          <>
            <navigation.ui.TopNavMenu appName={PLUGIN_ID} showSearchBar={false} />
            <EuiPage restrictWidth="1000px">
              <EuiPageBody>
                <EuiPageContent>
                  <EuiPageContentHeader>
                    <EuiPageContentHeaderSection>
                      <EuiTitle>
                        <h2>
                          <FormattedMessage
                            id="ezreporting.title"
                            defaultMessage="{name}"
                            values={{ name: reportingName }}
                          />
                        </h2>
                      </EuiTitle>
                    </EuiPageContentHeaderSection>

                    <EuiPageContentHeaderSection>
                      <EuiButton
                        fill
                        iconType="plusInCircle"
                        isDisabled={dashboards.length > 0 ? false : true}
                        onClick={() => (dashboards.length > 0 ? openEditFlyOut(null, false) : null)}
                      >
                        <FormattedMessage
                          id="ezreporting.createNewTask"
                          defaultMessage="New reporting task"
                        />
                      </EuiButton>
                    </EuiPageContentHeaderSection>
                  </EuiPageContentHeader>
                  <EuiPageContentBody>
                    <EzreportingTable
                      tasks={tasks}
                      dashboards={dashboards}
                      frequencies={frequencies}
                      removeTaskHandler={this.removeTaskHandler}
                      downloadReport={this.downloadReport}
                    />
                  </EuiPageContentBody>
                </EuiPageContent>
              </EuiPageBody>
            </EuiPage>
          </>
        </I18nProvider>
      </Router>
    );
  }
}
