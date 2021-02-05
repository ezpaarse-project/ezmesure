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
  EuiFlexGroup,
  EuiFlexItem,
  EuiComboBox,
  EuiSpacer,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiPopover,
  EuiContextMenu,
  EuiIcon,
  EuiHealth,
  EuiHighlight,
} from '@elastic/eui';

import { i18n } from '@kbn/i18n';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';

import { PLUGIN_ID, PLUGIN_NAME } from '../../common';
import { EzReportingTable } from './table';
import {
  EzReportingTaskEditFlyout,
  openFlyOut as openEditFlyOut,
  closeFlyOut as closeEditFlyOutHandler,
} from './flyout/edit';
import { EzReportingHistoryFlyout } from './flyout/history';

import { httpClient, toasts, capabilities } from '../../lib/reporting';

interface EzReportingAppDeps {
  basename: string;
  navigation: NavigationPublicPluginStart;
  applicationName: string;
  admin: boolean;
}

interface EzReportingAppState {
  tasks: any[];
  dashboards: any[];
  frequencies: any[];
  spaces: any[];
  selectedSpaces: [];
  reportingName: string;
  accessDenied: boolean;
  selectedItems: any[];
  showDestroyModal: boolean;
  isPopoverOpen: boolean;
  dashboardsBySpace: any[];
  currentSpaces: any[];
  delay: number;
  interval: any;
  tasksInProgress: object;
}

export class EzReportingApp extends Component<EzReportingAppDeps, EzReportingAppState> {
  constructor(props: EzReportingAppDeps) {
    super(props);

    this.state = {
      tasks: [],
      dashboards: [],
      frequencies: [],
      spaces: [],
      selectedSpaces: [],
      reportingName: 'Reporting',
      accessDenied: false,
      selectedItems: [],
      showDestroyModal: false,
      isPopoverOpen: false,
      dashboardsBySpace: [],
      currentSpaces: [],
      delay: 5000,
      interval: null,
      tasksInProgress: {}
    };
  }

  componentDidMount = () => {
    this.refreshData();
    this.polling();
  };

  componentWillUnmount = () => {
    clearTimeout(this.state.interval);
    this.setState({ interval: null });
  };

  polling = () => {
    const { tasks, tasksInProgress } = this.state;

    if (tasks.length) {
      const tmp = JSON.parse(JSON.stringify(tasksInProgress));

      tasks.forEach(({ _id }) => {
        httpClient.get(`/api/ezreporting/tasks/${_id}/history`).then((histories) => {
          if (histories.length) {
            const { status, logs, startTime, endTime } = histories.shift();

            if (status !== 'success') {
              if (new Date(endTime).toISOString() <= new Date().toISOString()) {
                const log = logs.find(({ type }) => type === 'error');
                tmp[_id] = {
                  status,
                  log: log ? log.message : '',
                  startTime,
                  endTime,
                };
              }
            }
          }
        });

        this.setState({ tasksInProgress: tmp });
      });
    }

    this.setState({ interval: setTimeout(this.polling, this.state.delay) });
  };

  refreshData = () => {
    const { admin } = this.props;

    httpClient
      .get(`/api/ezreporting/tasks/${admin ? 'admin' : 'user'}`)
      .then((res) => {
        this.setState({
          tasks: res.tasks,
          dashboards: res.dashboards,
          frequencies: res.frequencies,
          spaces: this.props.admin ? res.spaces : [],
          reportingName: res.reportingName,
        });
      })
      .catch((err) => {
        console.log(err);
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
        space: task.namespace,
      });

      return httpClient.patch(`/api/ezreporting/tasks/${task._id}`, { body }).then(() => {
        const index = this.state.tasks.findIndex(({ _id }) => _id === task._id);

        this.refreshData();

        toasts.addSuccess({
          title: 'Success',
          text: (
            <FormattedMessage
              id="ezReporting.editingSuccess"
              defaultMessage="Task edited successfully."
            />
          ),
        });

        this.closeEditFlyOut();
        this.forceUpdate();
      });
    }
  };

  closeEditFlyOut = () => {
    this.setState({ dashboardsBySpace: [], currentSpaces: [] });
    closeEditFlyOutHandler();
  };

  saveTaskHandler = (task) => {
    if (capabilities.create) {
      const tasks = this.state.tasks;

      const body = JSON.stringify({
        dashboardId: task.dashboardId,
        frequency: task.reporting.frequency,
        emails: task.reporting.emails,
        print: task.reporting.print,
        space: task.namespace,
      });

      return httpClient.post('/api/ezreporting/tasks', { body }).then((res) => {
        this.refreshData();
        this.setState({ dashboardsBySpace: [], currentSpaces: [] });

        toasts.addSuccess({
          title: 'Success',
          text: (
            <FormattedMessage
              id="ezreporting.creationSuccess"
              defaultMessage="Task saved successfully."
            />
          ),
        });

        this.closeEditFlyOut();
        this.forceUpdate();
      });
    }
  };

  downloadManyTask = () => {
    const { selectedItems } = this.state;

    if (capabilities.download && selectedItems.length) {
      selectedItems.forEach(({ _id }) => {
        httpClient
          .get(`/api/ezreporting/tasks/${_id}/download`)
          .then(() => {
            toasts.addSuccess({
              title: 'Success',
              text: (
                <FormattedMessage
                  id="ezReporting.generated"
                  defaultMessage="Your report will be sent to you by email."
                />
              ),
            });
          })
          .catch(() => {
            toasts.addDanger({
              title: 'Error',
              text: (
                <FormattedMessage
                  id="ezReporting.generationError"
                  defaultMessage="An error occurred while generating the report."
                />
              ),
            });
          });
      })
    }
  };

  onChange = (selectedSpaces) => {
    this.setState({ selectedSpaces });
  };

  onSelectionChangeHandler = (selectedItems) => {
    this.setState({ selectedItems });
  };

  removeManyTasks = () => {
    const { selectedItems } = this.state;

    if (capabilities.delete && selectedItems.length) {
      selectedItems.forEach(({ _id }) => {
        httpClient
          .delete(`/api/ezreporting/tasks/${_id}`)
          .then(() => {
            this.refreshData();

            toasts.addSuccess({
              title: 'Success',
              text: (
                <FormattedMessage
                  id="ezReporting.removalSuccess"
                  defaultMessage="Task removed successfully."
                />
              ),
            });
          })
          .catch(() => {
            toasts.addDanger({
              title: 'Error',
              text: (
                <FormattedMessage
                  id="ezReporting.removalError"
                  defaultMessage="An error occurred during the removal task."
                />
              ),
            });
          });
      });

      this.closeDestroyModal();
    }
  };

  openDestroyModal = () => {
    this.setState({ showDestroyModal: true });
  };

  closeDestroyModal = () => {
    this.setState({ showDestroyModal: false });
  };

  closePopover = () => {
    this.setState({ isPopoverOpen: false });
  };

  onButtonClick = () => {
    this.setState({ isPopoverOpen: true });
  };

  onChangeSpaceHandler = (selectedSpaces) => {
    const { dashboards } = this.state;

    this.setState({ dashboardsBySpace: [], currentSpaces: [] });

    if (selectedSpaces.length) {
      const { label: space } = selectedSpaces[0];
      const dashboardsBySpace = dashboards.filter((dashboard) => dashboard.namespace === space);
      this.setState({ dashboardsBySpace, currentSpaces: selectedSpaces });
    }
  };

  render() {
    const { basename, navigation, admin, applicationName } = this.props;
    const {
      tasks,
      dashboards,
      frequencies,
      spaces,
      selectedSpaces,
      accessDenied,
      selectedItems,
      showDestroyModal,
      isPopoverOpen,
      dashboardsBySpace,
      currentSpaces,
      tasksInProgress,
    } = this.state;

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

    let createBtn;
    if (capabilities.create) {
      createBtn = (
        <EuiButton
          fill
          iconType="plusInCircle"
          isDisabled={dashboards.length > 0 ? false : true}
          onClick={() => (dashboards.length > 0 ? openEditFlyOut(null, false) : null)}
        >
          <FormattedMessage id="ezreporting.createNewTask" defaultMessage="New reporting task" />
        </EuiButton>
      );
    }

    let tasksList = tasks;

    let searchBar;
    if (admin) {
      const spacesList = spaces.map((space) => ({
        value: space.id,
        label: space.name,
        color: space.color,
      }));

      const renderOption = (option, searchValue, contentClassName) => {
        const { color, label, value } = option;
        return (
          <EuiHealth color={color}>
            <span className={contentClassName}>
              <EuiHighlight search={searchValue}>{label}</EuiHighlight>
            </span>
          </EuiHealth>
        );
      };

      searchBar = (
        <EuiComboBox
          fullWidth
          options={spacesList}
          selectedOptions={selectedSpaces}
          onChange={this.onChange}
          renderOption={renderOption}
          placeholder={i18n.translate('ezReporting.searcg', { defaultMessage: 'Search...' })}
          isClearable={true}
          data-test-subj="spaceSearch"
        />
      );

      if (selectedSpaces.length) {
        const spacesNames = selectedSpaces.map(({ label }) => label);
        tasksList = tasks.filter(({ namespace }) => spacesNames.includes(namespace));
      }
    }

    let destroyModal;
    if (showDestroyModal) {
      destroyModal = (
        <EuiOverlayMask>
          <EuiConfirmModal
            title={i18n.translate('ezReporting.questionDeleteTasks', {
              defaultMessage: 'Are you sure you want to delete these tasks ?',
            })}
            onCancel={this.closeDestroyModal}
            onConfirm={this.removeManyTasks}
            cancelButtonText="Cancel"
            confirmButtonText="Yes, delete tasks"
            buttonColor="danger"
            defaultFocusedButton="confirm"
          >
            <FormattedMessage
              id="ezReporting.confirmDeleteTasks"
              defaultMessage="Are you about to delete the selected tasks."
            />
          </EuiConfirmModal>
        </EuiOverlayMask>
      );
    }

    const panels = [
      {
        id: 0,
        items: [
          {
            name: i18n.translate('ezReporting.generate', { defaultMessage: 'Generate' }),
            icon: <EuiIcon type="importAction" size="m" />,
            onClick: () => {
              this.downloadManyTask();
            },
          },
          {
            name: i18n.translate('ezReporting.remove', { defaultMessage: 'Delete' }),
            icon: 'trash',
            onClick: () => {
              this.openDestroyModal();
            },
          },
        ],
      },
    ];

    const button = (
      <EuiButton iconType="arrowDown" iconSide="right" onClick={this.onButtonClick}>
        Manage {selectedItems.length} task(s)
      </EuiButton>
    );

    let popover;
    if (selectedItems.length) {
      popover = (
        <EuiFlexItem grow={false}>
          <EuiPopover
            id="manageTasks"
            button={button}
            isOpen={isPopoverOpen}
            closePopover={this.closePopover}
            panelPaddingSize="none"
            anchorPosition="downLeft"
          >
            <EuiContextMenu initialPanelId={0} panels={panels} />
          </EuiPopover>
        </EuiFlexItem>
      );
    }

    return (
      <Router basename={basename}>
        <EzReportingTaskEditFlyout
          dashboards={dashboards}
          dashboardsBySpace={dashboardsBySpace}
          frequencies={frequencies}
          spaces={spaces}
          currentSpaces={currentSpaces}
          admin={admin}
          editTaskHandler={this.editTaskHandler}
          saveTaskHandler={this.saveTaskHandler}
          onChangeSpaceHandler={this.onChangeSpaceHandler}
        />
        <EzReportingHistoryFlyout />
        {destroyModal}
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
                            values={{ name: `${PLUGIN_NAME} ${applicationName}` }}
                          />
                        </h2>
                      </EuiTitle>
                    </EuiPageContentHeaderSection>

                    <EuiPageContentHeaderSection>{createBtn}</EuiPageContentHeaderSection>
                  </EuiPageContentHeader>
                  <EuiPageContentBody>
                    <EuiSpacer size="s" />

                    <EuiFlexGroup>
                      {popover}
                      <EuiFlexItem>{searchBar}</EuiFlexItem>
                    </EuiFlexGroup>

                    <EuiSpacer />
                    <EzReportingTable
                      tasks={tasksList}
                      tasksInProgress={tasksInProgress}
                      spaces={spaces}
                      dashboards={dashboards}
                      frequencies={frequencies}
                      admin={this.props.admin}
                      onSelectionChangeHandler={this.onSelectionChangeHandler}
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
