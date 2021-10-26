import React, { Component, Fragment } from 'react';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiSelect,
  EuiListGroup,
  EuiListGroupItem,
  EuiFieldText,
  EuiButton,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiForm,
  EuiCheckbox,
  EuiSpacer,
  EuiHealth,
  EuiHighlight,
} from '@elastic/eui';
import { get, set } from 'lodash';
import { FormattedMessage } from '@kbn/i18n/react';
import { i18n } from '@kbn/i18n';

import { httpClient, toasts, defaultTask, capabilities } from '../../../lib/reporting';
import { IEditProps, IEditState, ISelectedDashboard, ISelectedSpace } from '../../../common/models/edit';
import { IDashboard } from '../../../common/models/dashboard';
import { ITask } from '../../../common/models/task';
import { IFrequency } from '../../../common/models/frequency';
import { ISpace } from '../../../common/models/space';

let openFlyOutHandler;
export function openFlyOut(task, edit): void {
  openFlyOutHandler(task, edit);
}

let closeFlyOutHandler;
export function closeFlyOut(): void {
  closeFlyOutHandler();
}

export class EzReportingTaskEditFlyout extends Component<IEditProps, IEditState> {
  private props: IEditProps;
  private state: IEditState;

  constructor(props: IEditProps) {
    super(props);

    this.state = {
      isFlyoutVisible: false,
      edit: false,
      currentTask: {
        id: '',
        dashboardId: null,
        exists: false,
        reporting: {
          frequency: '',
          emails: [],
          createdAt: '',
          sentAt: '',
          runAt: '',
          print: false,
        },
        space: '',
      },
      email: '',
      receivers: [],
      mailErrorMessages: [],
      dashboardErrorMessages: [],
      spaceErrorMessages: [],
    };

    openFlyOutHandler = this.open;
    closeFlyOutHandler = this.close;
  }

  open = (dashboard: IDashboard, edit: boolean) => {
    const currentTask: ITask = JSON.parse(
      JSON.stringify(dashboard || defaultTask(this.props.dashboards[0].id))
    );
    const currentFrequency: string = get(currentTask, 'reporting.frequency');
    const frequency: string = this.props.frequencies.find((f: IFrequency) => f.value === currentFrequency);
    let receivers: Array<string> | string = get(currentTask, 'reporting.emails', []);

    if (typeof receivers === 'string') {
      receivers = receivers.split(',').map(e => e.trim());
    }

    if (!frequency && this.props.frequencies.length > 0) {
      // If the task frequency doesn't exist anymore, auto-select first frequency
      set(currentTask, 'reporting.frequency', this.props.frequencies[0].value);
    }

    this.setState({
      isFlyoutVisible: true,
      currentTask,
      edit,
      receivers,
      email: '',
      mailErrorMessages: [],
      dashboardErrorMessages: [],
    });
  };

  close = (): void => {
    this.setState({ isFlyoutVisible: false });
  };

  onChangeSpace = (selectedSpaces: Array<ISelectedSpace>): void => {
    const currentTask: ITask = { ...this.state.currentTask };

    if (selectedSpaces.length === 0) {
      currentTask.space = '';
      this.setState({ currentTask });
    }

    if (selectedSpaces.length > 0) {
      currentTask.space = selectedSpaces[0].label;
      this.setState({ currentTask });
    }
  };

  onChangeDashboard = (selectedDashboards: Array<IDashboard>): void => {
    const dashboard: IDashboard = selectedDashboards[0];
    const currentTask: ITask = { ...this.state.currentTask };
    currentTask.dashboardId = dashboard && dashboard.value;
    const dashboardErrorMessages = [];

    if (!currentTask.dashboardId) {
      dashboardErrorMessages.push(
        i18n.translate('ezReporting.pleaseSelectDashboard', {
          defaultMessage: 'Please select a dashboard',
        })
      );
    }

    this.setState({
      currentTask,
      dashboardErrorMessages,
    });
  };

  onChangeFrequency = (event: { target: { value: string; } }): void => {
    const currentTask: ITask = { ...this.state.currentTask };
    currentTask.reporting.frequency = event.target.value;
    this.setState({ currentTask });
  };

  onChangeEmail = (event: { target: { value: string; } }): void => {
    this.setState({ email: event.target.value });
  };

  onChangeLayout = (event: { target: { checked: boolean; } }): void => {
    const currentTask: ITask = { ...this.state.currentTask };
    currentTask.reporting.print = event.target.checked;
    this.setState({ currentTask });
  };

  addReceiver = async (event) => {
    event.preventDefault();
    const { email, receivers } = this.state;

    const emailsList = email.split(',') || [email];

    const wrongEmails = [];
    for (let i = 0; i < emailsList.length; i += 1) {
      try {
        const body = JSON.stringify({ email: emailsList[i] });
        await httpClient.post('/api/ezreporting/email', { body });

        const exists = receivers.includes(emailsList[i]);
        if (!exists) {
          receivers.push(emailsList[i]);
        }
      } catch (e) {
        wrongEmails.push(emailsList[i]);
      }
    }

    if (!wrongEmails.length) {
      this.setState({
        email: '',
        mailErrorMessages: [],
        receivers,
      });
    }

    if (wrongEmails.length) {
      const mailErrorMessages = wrongEmails.map((emailAddress) => {
        return i18n.translate('ezReporting.pleaseEnterValidEmail', {
          values: { EMAIL_ADDRESS: emailAddress },
          defaultMessage: `Please enter a valid email address ({EMAIL_ADDRESS})`,
        });
      });
      this.setState({
        mailErrorMessages,
        email: wrongEmails.join(','),
      });
    }
  };

  removeReceiver = (email: string): void => {
    this.setState({
      receivers: this.state.receivers.filter((r) => r !== email),
    });
  };

  saveOrUpdate = (): Promise<any> => {
    if (capabilities.create) {
      const { edit, currentTask, receivers } = this.state;

      set(currentTask, 'reporting.emails', receivers);

      if (edit) {
        return this.props
          .editTaskHandler(currentTask)
          .catch((err) =>
            toasts.addDanger({ title: 'Error', text: get(err, 'data.error', 'Error') })
          );
      }

      return this.props
        .saveTaskHandler(currentTask)
        .catch((err) =>
          toasts.addDanger({ title: 'Error', text: get(err, 'data.error', 'Error') })
        );
    }
  };

  render(): string {
    const {
      isFlyoutVisible,
      currentTask,
      edit,
      mailErrorMessages,
      dashboardErrorMessages,
      spaceErrorMessages,
      receivers,
    } = this.state;
    const { dashboards, frequencies, admin, spaces } = this.props;

    let dashboardList: Array<ISelectedDashboard> = dashboards.map((dashboard) => ({
      value: dashboard.id,
      label: dashboard.name,
    }));

    let currentSpaces: Array<ISelectedSpace> = [];
    if (admin && currentTask.id.length > 0) {
      currentSpaces =  spaces.filter((space: ISpace) => space.name === currentTask.space)
        .map((space: ISpace) => ({
          value: space.id,
          label: space.name,
          color: space.color,
        }));

      dashboardList = dashboards.filter((dashboard) => dashboard.namespace === currentTask.space)
        .map((dashboard) => ({
          value: dashboard.id,
          label: dashboard.name,
        }));
    }

    const invalidMail: boolean = mailErrorMessages.length > 0;
    const invalidDashboard: boolean = dashboardErrorMessages.length > 0;
    const invalidSpace: boolean = spaceErrorMessages.length > 0;
    const invalidForm: boolean = invalidDashboard || receivers.length === 0;

    let saveBtn: string;
    if (capabilities.create) {
      saveBtn = (
        <EuiFormRow fullWidth={true}>
          <EuiButton
            fill
            iconType="save"
            type="submit"
            onClick={() => this.saveOrUpdate()}
            disabled={invalidForm}
            fullWidth={true}
          >
            <FormattedMessage id="ezReporting.save" defaultMessage="Save" />
          </EuiButton>
        </EuiFormRow>
      );
    }

    if (!isFlyoutVisible) {
      return <Fragment />;
    }

    let title: string;

    if (edit) {
      title = (
        <FormattedMessage id="ezReporting.editingTask" defaultMessage="Editing a reporting task" />
      );
    } else {
      title = (
        <FormattedMessage
          id="ezReporting.creatingTask"
          defaultMessage="Creating a reporting task"
        />
      );
    }

    const receiverItems: Array<string> = receivers.map((email, index) => (
      <EuiListGroupItem
        key={index}
        label={email}
        extraAction={{
          iconType: 'trash',
          iconSize: 's',
          'aria-label': `remove receiver ${email}`,
          onClick: () => {
            this.removeReceiver(email);
          },
        }}
      />
    ));

    let receiversList: string;
    if (receiverItems.length > 0) {
      receiversList = (
        <EuiFormRow fullWidth={true}>
          <EuiListGroup maxWidth={false} bordered={true}>
            {receiverItems}
          </EuiListGroup>
        </EuiFormRow>
      );
    }
    
    if (!edit && admin && currentTask.id.length === 0) {
      dashboardList = [];
      currentSpaces =  spaces.filter((space: ISpace) => space.name === currentTask.space)
        .map((space: ISpace) => ({
          value: space.id,
          label: space.name,
          color: space.color,
        }));

      dashboardList = dashboards.filter((dashboard) => dashboard.namespace === currentTask.space)
        .map((dashboard) => ({
          value: dashboard.id,
          label: dashboard.name,
        }));
    }

    const selectedDashboards: Array<IDashboard> = dashboardList.filter((d) => d.value === currentTask.dashboardId);

    let spaceSelector;
    if (admin) {
      let spacesList: Array<ISelectedSpace> = [];
      if (spaces.length > 0) {
        spacesList = spaces.map((space: ISpace) => ({
          value: space.id,
          label: space.name,
          color: space.color,
        }));
      }

      const renderOption = (option: { color: string, label: string }, searchValue: string, contentClassName: string): string => {
        const { color, label } = option;
        return (
          <EuiHealth color={color}>
            <span className={contentClassName}>
              <EuiHighlight search={searchValue}>{label}</EuiHighlight>
            </span>
          </EuiHealth>
        );
      };

      spaceSelector = (
        <EuiFormRow
          fullWidth
          label={<FormattedMessage id="ezReporting.space" defaultMessage="Space" />}
          isInvalid={invalidSpace}
          error={spaceErrorMessages}
        >
          <EuiComboBox
            fullWidth
            placeholder={i18n.translate('ezReporting.selectSpace', {
              defaultMessage: 'Select a space',
            })}
            singleSelection
            options={spacesList}
            selectedOptions={currentSpaces}
            onChange={this.onChangeSpace}
            renderOption={renderOption}
            isClearable={true}
            isInvalid={invalidSpace}
            data-test-subj="spaceSearch"
          />
        </EuiFormRow>
      );
    }

    const flyOutContent: string = (
      <EuiForm>
        {spaceSelector}

        <EuiFormRow
          fullWidth={true}
          label={<FormattedMessage id="ezReporting.dashboard" defaultMessage="Dashboard" />}
          isInvalid={invalidDashboard}
          error={dashboardErrorMessages}
        >
          <EuiComboBox
            fullWidth={true}
            placeholder={i18n.translate('ezReporting.selectDashboard', {
              defaultMessage: 'Select a dashboard',
            })}
            singleSelection={{ asPlainText: true }}
            options={dashboardList}
            selectedOptions={selectedDashboards}
            onChange={this.onChangeDashboard}
            isClearable={true}
            isInvalid={invalidDashboard}
          />
        </EuiFormRow>

        <EuiFormRow
          fullWidth={true}
          label={<FormattedMessage id="ezReporting.frequency" defaultMessage="Frequency" />}
        >
          <EuiSelect
            fullWidth={true}
            options={frequencies}
            value={currentTask.reporting.frequency}
            aria-label={i18n.translate('ezReporting.frequency', {
              defaultMessage: 'Frequency',
            })}
            onChange={this.onChangeFrequency}
          />
        </EuiFormRow>

        <EuiSpacer size="m" />

        <form onSubmit={this.addReceiver}>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFormRow
                label={
                  <FormattedMessage
                    id="ezReporting.receiversEmails"
                    defaultMessage="Receivers' email addresses"
                  />
                }
                fullWidth={true}
                isInvalid={invalidMail}
                error={mailErrorMessages}
              >
                <EuiFieldText
                  fullWidth={true}
                  placeholder="Email"
                  value={this.state.email}
                  onChange={this.onChangeEmail}
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFormRow hasEmptyLabelSpace>
                <EuiButton iconType="plusInCircle" type="submit">
                  <FormattedMessage id="ezReporting.add" defaultMessage="Add" />
                </EuiButton>
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>
        </form>

        <EuiSpacer size="m" />

        {receiversList}

        <EuiFormRow fullWidth={true}>
          <EuiCheckbox
            id="optimize-checkbox"
            checked={currentTask.reporting.print}
            label={
              <FormattedMessage
                id="ezReporting.optimizedForPrinting"
                defaultMessage="Optimized for printing"
              />
            }
            onChange={this.onChangeLayout}
          />
        </EuiFormRow>

        {saveBtn}
      </EuiForm>
    );

    return (
      <EuiFlyout onClose={this.close} size="m" aria-labelledby="flyoutSmallTitle">
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2>{title}</h2>
          </EuiTitle>
        </EuiFlyoutHeader>

        <EuiFlyoutBody>{flyOutContent}</EuiFlyoutBody>
      </EuiFlyout>
    );
  }
}
