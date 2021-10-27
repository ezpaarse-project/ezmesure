import React, { Component, Fragment } from 'react';
import { FormattedMessage, I18nProvider } from '@kbn/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
  EuiButton,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
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
  EuiPageHeader,
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
import { ISelectedSpace } from '../../common/models/edit';

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
  accessDenied: boolean;
  selectedItems: any[];
  showDestroyModal: boolean;
  isPopoverOpen: boolean;
  tasksInProgress: object;
  delay: number;
}

export class EzReportingApp extends Component<EzReportingAppDeps, EzReportingAppState> {
  private state: EzReportingAppState;
  private props: EzReportingAppDeps;

  constructor(props: EzReportingAppDeps) {
    super(props);

    this.state = {
      tasks: [],
      dashboards: [],
      frequencies: [],
      spaces: [],
      selectedSpaces: [],
      accessDenied: false,
      selectedItems: [],
      showDestroyModal: false,
      isPopoverOpen: false,
      tasksInProgress: {},
      delay: 5000,
    };
  }

  componentDidMount = () => {
    this.refreshData();
  };

  polling = async () => {
    const { tasks, tasksInProgress } = this.state;

    if (tasks.length) {
      const tmp = JSON.parse(JSON.stringify(tasksInProgress));

      tasks.forEach(({ id }) => {
        httpClient.get(`/api/ezreporting/tasks/${id}/history`).then((histories) => {
          if (histories.length) {
            const { status, logs, startTime, endTime } = histories.shift();

            if (status !== 'success') {
              if (new Date(endTime).toISOString() <= new Date().toISOString()) {
                const log = logs.find(({ type }) => type === 'error');
                tmp[id] = {
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
        this.forceUpdate();
      });
    }

    return new Promise(() => setTimeout(this.polling, this.state.delay));
  };

  refreshData = () => {
    const { admin } = this.props;

    httpClient
      .get(`/api/ezreporting/tasks${admin ? '/management' : ''}`)
      .then((res) => {
        this.setState({
          tasks: res.tasks,
          dashboards: res.dashboards,
          frequencies: res.frequencies,
          spaces: this.props.admin ? res.spaces : [],
        });

        this.polling();
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
        space: task.space,
      });

      return httpClient.patch(`/api/ezreporting/tasks/${task.id}`, { body }).then(() => {
        const index = this.state.tasks.findIndex(({ id }) => id === task.id);

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
        space: task.space,
      });

      return httpClient.post('/api/ezreporting/tasks', { body }).then((res) => {
        this.refreshData();

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
      selectedItems.forEach(({ id }) => {
        httpClient
          .get(`/api/ezreporting/tasks/${id}/download`)
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
      selectedItems.forEach(({ id }) => {
        httpClient
          .delete(`/api/ezreporting/tasks/${id}`)
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

  render() {
    const { basename, navigation, admin, applicationName } = this.props;
    const {
      tasks,
      dashboards,
      spaces,
      selectedSpaces,
      accessDenied,
      selectedItems,
      showDestroyModal,
      isPopoverOpen,
      frequencies,
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
          fill={true}
          iconType="plusInCircleFilled"
          isDisabled={dashboards.length > 0 ? false : true}
          onClick={() => (dashboards.length > 0 ? openEditFlyOut(null, false) : null)}
        >
          <FormattedMessage id="ezreporting.createNewTask" defaultMessage="New reporting task" />
        </EuiButton>
      );
    }

    let reloadBtn;
    if (capabilities.show) {
      reloadBtn = (
        <EuiButton
          fill={true}
          iconType="refresh"
          onClick={() => this.refreshData()}
        >
          <FormattedMessage id="ezreporting.reloadTasks" defaultMessage="Reload tasks" />
        </EuiButton>
      );
    }

    let tasksList = tasks;

    let searchBar;
    let spacesList: Array<ISelectedSpace> = [];
    if (admin) {
      if (spaces.length > 0) {
        spacesList = spaces.map((space) => ({
          value: space.id,
          label: space.name,
          color: space.color,
        }));
      }

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
        if (tasks.length > 0) {
          tasksList = tasks.filter(({ space }) => spacesNames.includes(space));
        }
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

    const restrictWidth = admin ? 'none' : true;
    const paddingSize = admin ? 'none' : 'l';
    const descriptionHeader = i18n.translate('ezReporting.manageYourReportingTasks', { defaultMessage: 'Manage your reporting tasks.' });

    let pageHeader = (
      <EuiPageHeader
        restrictWidth={restrictWidth}
        pageTitle={i18n.translate('ezReporting.title', {
          defaultMessage: '{name}',
          values: { name: `${PLUGIN_NAME} ${applicationName}` }
        })}
        rightSideItems={[reloadBtn, createBtn]}
        description={admin ? descriptionHeader : null}
        bottomBorder={admin}
      />
    );

    let pageHeaderAdmin;
    if (admin) {
      pageHeaderAdmin = pageHeader;
      pageHeader = '';
    }

    return (
      <Router basename={basename}>
        <EzReportingTaskEditFlyout
          dashboards={dashboards}
          frequencies={frequencies}
          spaces={spaces}
          admin={admin}
          editTaskHandler={this.editTaskHandler}
          saveTaskHandler={this.saveTaskHandler}
        />
        <EzReportingHistoryFlyout />
        {destroyModal}
        <I18nProvider>
          <>
            <navigation.ui.TopNavMenu appName={PLUGIN_ID} showSearchBar={false} />
            <EuiPage paddingSize={paddingSize}>
              <EuiPageBody>
                {pageHeader}
                <EuiPageContent restrictWidth={restrictWidth} borderRadius="none" hasShadow={false} paddingSize="none">
                  <EuiPageContentBody restrictWidth={restrictWidth}>
                    {pageHeaderAdmin}

                    <EuiSpacer size={admin ? 'l' : 's'} />

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
