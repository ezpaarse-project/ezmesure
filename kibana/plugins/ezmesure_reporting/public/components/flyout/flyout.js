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
  EuiCheckbox,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import { capabilities } from 'ui/capabilities';
import { defaultTask } from '../../lib/reporting';

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
      currentTask: null,
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
    if (dashboard) {
      defaultTask.dashboardId = this.props.dashboards[0].id;
    }
    this.setState({ currentTask: JSON.parse(JSON.stringify(dashboard || defaultTask)) });
  }

  close = () => {
    this.setState({ isFlyoutVisible: false });
  }

  onChangeDashboard = event => {
    console.log(event.target.value)
    const currentTask = { ...this.state.currentTask };
    currentTask.dashboardId = event.target.value;
    this.setState({ currentTask });
  }

  onChangeFrequency = event => {
    const currentTask = { ...this.state.currentTask };
    currentTask.reporting.frequency = event.target.value;
    this.setState({ currentTask });
  }

  onChangeEmails = event => {
    const currentTask = { ...this.state.currentTask };
    currentTask.reporting.emails = event.target.value;
    this.setState({ currentTask });
  }

  onChangeLayout = event => {
    const currentTask = { ...this.state.currentTask };
    currentTask.reporting.print = event.target.checked;
    this.setState({ currentTask });
  }

  saveOrUpdate = () => {
    if (capabilities.get().ezmesure_reporting.save) {
      const { edit, currentTask } = this.state;

      this.close();

      if (edit) {
        return this.props.editTaskHandler(currentTask);
      }

      return this.props.saveTaskHandler(currentTask);
    }
  }

  render() {
    const { isFlyoutVisible, currentTask, edit, errors } = this.state;
    const { dashboards, frequencies } = this.props;

    let flyOutRender;

    let options = dashboards.map(dashboard => ({ value: dashboard.id, text: dashboard.name }));

    let saveBtn;
    if (capabilities.get().ezmesure_reporting.save) {
      saveBtn = (<EuiFormRow fullWidth={true}>
        <EuiButton
          fill
          iconType="save"
          type="submit"
          onClick={() => this.saveOrUpdate()}
        >
          <FormattedMessage id="ezmesureReporting.save" defaultMessage="Save" />
        </EuiButton>
      </EuiFormRow>);
    }

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
                  options={options}
                  value={currentTask.dashboardId}
                  aria-label={<FormattedMessage id="ezmesureReporting.dashboard" defaultMessage="Dashboard" />}
                  onChange={this.onChangeDashboard}
                  disabled={edit}
                  isInvalid={edit ? false : errors.show}
                />
              </EuiFormRow>

              <EuiFormRow
                fullWidth={true}
                label={<FormattedMessage id="ezmesureReporting.frequency" defaultMessage="Frequency" />}
                isInvalid={errors.show}
              >
                <EuiSelect
                  fullWidth={true}
                  options={frequencies}
                  value={currentTask.reporting.frequency}
                  aria-label={<FormattedMessage id="ezmesureReporting.frequency" defaultMessage="Frequency" />}
                  onChange={this.onChangeFrequency}
                  isInvalid={errors.show}
                />
              </EuiFormRow>

              <EuiFormRow
                fullWidth={true}
                label={<FormattedMessage id="ezmesureReporting.receiversEmails" defaultMessage="Receivers' email addresses" />}
                isInvalid={errors.show}
              >
                <EuiTextArea
                  fullWidth={true}
                  placeholder="(ex: john@doe.com,jane@doe.com)"
                  value={currentTask.reporting.emails}
                  onChange={this.onChangeEmails}
                  isInvalid={errors.show}
                />
              </EuiFormRow>

              <EuiFormRow fullWidth={true} >
                <EuiCheckbox
                  checked={currentTask.reporting.print}
                  label={<FormattedMessage id="ezmesureReporting.optimizedForPrinting" defaultMessage="Optimized for printing" />}
                  onChange={this.onChangeLayout}
                />
              </EuiFormRow>

              {saveBtn}
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
