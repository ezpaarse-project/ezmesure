/* eslint-disable @kbn/eslint/require-license-header */
import React, { Component, Fragment } from 'react';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiSelect,
  EuiTextArea,
  EuiFormRow,
  EuiForm,
  EuiButton,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import { defaultDashboard, frequenciesData } from '../../lib/reporting';

let openFlyOutHandler;
export function openFlyOut(dashboard, edit) {
  openFlyOutHandler(dashboard, edit);
}

let updateEdit;
export function updateEditData(edit) {
  updateEdit(edit);
}

export class Flyout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isFlyoutVisible: false,
      edit: false,
      currentDashboard: null,
      errors: {
        show: false,
        messages: [],
      },
    };

    openFlyOutHandler = this.open;
    updateEdit = this.updateEdit;
  }

  open = (dashboard, edit) => {
    this.setState({ isFlyoutVisible: true });
    this.setState({ edit });
    if (!dashboard) {
      defaultDashboard.dashboard = this.props.dashboards[0];
    }
    this.setState({ currentDashboard: JSON.parse(JSON.stringify(dashboard || defaultDashboard)) });
  }

  close = () => {
    this.setState({ isFlyoutVisible: false });
  }

  onChangeDashboard = event => {
    const currentDashboard = { ...this.state.currentDashboard };
    currentDashboard.dashboard.value = event.target.value;
    this.setState({ currentDashboard });
  }

  onChangeFrequency = event => {
    const currentDashboard = { ...this.state.currentDashboard };
    currentDashboard.reporting.frequency = event.target.value;
    this.setState({ currentDashboard });
  }

  onChangeEmails = event => {
    const currentDashboard = { ...this.state.currentDashboard };
    currentDashboard.reporting.emails = event.target.value;
    this.setState({ currentDashboard });
  }

  saveOrUpdate = () => {
    const { edit, currentDashboard } = this.state;

    this.close();

    if (edit) {
      return this.props.editTaskHandler(currentDashboard);
    }

    return this.props.saveTaskHandler(currentDashboard);
  }

  render() {
    const { isFlyoutVisible, currentDashboard, edit, errors } = this.state;
    const { dashboards } = this.props;

    let flyOutRender;

    if (isFlyoutVisible) {
      let title = <FormattedMessage id="ezmesureReporting.creating" defaultMessage="Creating" />;
      if (edit) {
        title = <FormattedMessage id="ezmesureReporting.editing" defaultMessage="Editing" />;
      }
      flyOutRender = (
        <EuiFlyout
          onClose={this.close}
          size="m"
          aria-labelledby="flyoutSmallTitle"
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2>{ title } <FormattedMessage id="ezmesureReporting.reportingTask" defaultMessage="a reporting task" /></h2>
            </EuiTitle>
          </EuiFlyoutHeader>

          <EuiFlyoutBody>
            <EuiForm isInvalid={errors.show} error={errors.messages}>
              <EuiFormRow
                fullWidth={true}
                label={<FormattedMessage id="ezmesureReporting.dashboard" defaultMessage="Dashboard" />}
                isInvalid={edit ? false : errors.show}
              >
                <EuiSelect
                  fullWidth={true}
                  options={dashboards}
                  value={currentDashboard.dashboard.value}
                  aria-label={<FormattedMessage id="ezmesureReporting.dashboard" defaultMessage="Dashboard" />}
                  onChange={this.onChangeDashboard}
                  disabled={edit}
                  isInvalid={edit ? false : errors.show}
                  name="selectedDashboard"
                />
              </EuiFormRow>

              <EuiFormRow
                fullWidth={true}
                label={<FormattedMessage id="ezmesureReporting.frequency" defaultMessage="Frequency" />}
                isInvalid={errors.show}
              >
                <EuiSelect
                  fullWidth={true}
                  options={frequenciesData}
                  value={currentDashboard.reporting.frequency}
                  aria-label={<FormattedMessage id="ezmesureReporting.frequency" defaultMessage="Frequency" />}
                  onChange={this.onChangeFrequency}
                  isInvalid={errors.show}
                  name="selectedFrequency"
                />
              </EuiFormRow>

              <EuiFormRow
                fullWidth={true}
                label={<FormattedMessage id="ezmesureReporting.frequency" defaultMessage="Receivers' email addresses" />}
                isInvalid={errors.show}
              >
                <EuiTextArea
                  fullWidth={true}
                  placeholder="(ex: john@doe.com,jane@doe.com)"
                  value={currentDashboard.reporting.emails}
                  onChange={this.onChangeEmails}
                  isInvalid={errors.show}
                  name="selectedEmails"
                />
              </EuiFormRow>

              <EuiFormRow fullWidth={true}>
                <EuiButton
                  fill
                  iconType="save"
                  type="submit"
                  onClick={() => this.saveOrUpdate()}
                >
                  <FormattedMessage id="ezmesureReporting.save" defaultMessage="Save" />
                </EuiButton>
              </EuiFormRow>
            </EuiForm>
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
