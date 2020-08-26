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
} from '@elastic/eui';
import { get, set } from 'lodash';
import { FormattedMessage } from '@kbn/i18n/react';
import { i18n } from '@kbn/i18n';

import { httpClient, toasts, ms2Str, defaultTask, capabilities } from '../../../lib/reporting';

interface Props {
  dashboards: any[];
  frequencies: any[];
  editTaskHandler(task: object): Promise<object>;
  saveTaskHandler(task: object): Promise<object>;
}

interface State {
  isFlyoutVisible: boolean;
  edit: boolean;
  currentTask: object;
  email: string;
  receivers: any[];
  mailErrorMessages: any[];
  dashboardErrorMessages: any[];
}

let openFlyOutHandler;
export function openFlyOut(dashboard, edit) {
  openFlyOutHandler(dashboard, edit);
}

let closeFlyOutHandler;
export function closeFlyOut() {
  closeFlyOutHandler();
}

export class EzreportingTaskEditFlyout extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isFlyoutVisible: false,
      edit: false,
      currentTask: null,
      email: '',
      receivers: [],
      mailErrorMessages: [],
      dashboardErrorMessages: [],
    };

    openFlyOutHandler = this.open;
    closeFlyOutHandler = this.close;
  }

  open = (dashboard, edit) => {
    const currentTask = JSON.parse(
      JSON.stringify(dashboard || defaultTask(this.props.dashboards[0].id))
    );
    const currentFrequency = get(currentTask, 'reporting.frequency');
    const frequency = this.props.frequencies.find((f) => f.value === currentFrequency);
    let receivers = get(currentTask, 'reporting.emails', []);

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

  close = () => {
    this.setState({ isFlyoutVisible: false });
  };

  onChangeDashboard = (selectedDashboards) => {
    const dashboard = selectedDashboards[0];
    const currentTask = { ...this.state.currentTask };
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

  onChangeFrequency = (event) => {
    const currentTask = { ...this.state.currentTask };
    currentTask.reporting.frequency = event.target.value;
    this.setState({ currentTask });
  };

  onChangeEmail = (event) => {
    this.setState({ email: event.target.value });
  };

  onChangeLayout = (event) => {
    const currentTask = { ...this.state.currentTask };
    currentTask.reporting.print = event.target.checked;
    this.setState({ currentTask });
  };

  addReceiver = async (event) => {
    event.preventDefault();
    const { email, receivers } = this.state;

    try {
      const body = JSON.stringify({ email });
      const resp = await httpClient.post('/api/ezreporting/email', { body });

      const exists = receivers.includes(email);

      this.setState({
        email: '',
        mailErrorMessages: [],
        receivers: exists ? receivers : receivers.concat([email]),
      });
    } catch (error) {
      this.setState({
        mailErrorMessages: [
          i18n.translate('ezReporting.pleaseEnterValidEmail', {
            defaultMessage: 'Please enter a valid email address',
          }),
        ],
      });
    }
  };

  removeReceiver = (email) => {
    this.setState({
      receivers: this.state.receivers.filter((r) => r !== email),
    });
  };

  saveOrUpdate = () => {
    if (capabilities.save) {
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

  render() {
    const {
      isFlyoutVisible,
      currentTask,
      edit,
      mailErrorMessages,
      dashboardErrorMessages,
      receivers,
    } = this.state;
    const { dashboards, frequencies } = this.props;

    const flytOut = (
      <EuiFlyout onClose={this.close} size="m">
        <EuiFlyoutHeader hasBorder>
          <EuiFlexGroup alignItems="center">
            <EuiFlexItem>
              <EuiTitle size="s">
                <h3 id="flyoutTitle">
                  <FormattedMessage
                    defaultMessage="Log event document details"
                    id="xpack.infra.logFlyout.flyoutTitle"
                  />
                </h3>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>lortem</EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>lorem</EuiFlyoutBody>
      </EuiFlyout>
    );

    const dashboardList = dashboards.map((dashboard) => ({
      value: dashboard.id,
      label: dashboard.name,
    }));

    const invalidMail = mailErrorMessages.length > 0;
    const invalidDashboard = dashboardErrorMessages.length > 0;
    const invalidForm = invalidDashboard || receivers.length === 0;

    let saveBtn;
    if (capabilities.save) {
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

    let title;

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

    const receiverItems = receivers.map((email, index) => (
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

    let receiversList;
    if (receiverItems.length > 0) {
      receiversList = (
        <EuiFormRow fullWidth={true}>
          <EuiListGroup maxWidth={false} bordered={true}>
            {receiverItems}
          </EuiListGroup>
        </EuiFormRow>
      );
    }

    const selectedDashboards = dashboardList.filter(d => d.value === currentTask.dashboardId);

    const flyOutContent = (
      <EuiForm>
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
            aria-label={<FormattedMessage id="ezReporting.frequency" defaultMessage="Frequency" />}
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
