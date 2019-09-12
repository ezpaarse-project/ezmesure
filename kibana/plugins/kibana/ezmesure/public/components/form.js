import React, { Component, Fragment } from 'react';
import {
  EuiSelect,
  EuiTextArea,
  EuiFormRow,
  EuiForm,
  EuiButton,
} from '@elastic/eui';
import { addToast } from './toast';
import { editReportingTask, saveReportingTask } from './table';
import { frequenciesData } from '../lib/reporting';

export default class Form extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dashboards: [],
      currentDashboard: props.currentDashboard,
      space: props.space,
      httpClient: props.httpClient,
      edit: props.edit,
      errors: {
        show: false,
        messages: [],
      },
      editReporting: props.editReporting,
    };
  }

  componentDidMount() {
    const { httpClient, space } = this.props;

    httpClient.get(`../api/ezmesure/reporting/tasks/${space}`).then(res => {
      this.setState({ dashboards: res.data.dashboards });
    }).catch(err => console.log(err));
  }

  onChangeDashboard = (event) => {
    const currentDashboard = {...this.state.currentDashboard};
    currentDashboard.dashboard.value = event.target.value
    this.setState({ currentDashboard });
  }

  onChangeFrequency = (event) => {
    const currentDashboard = {...this.state.currentDashboard};
    currentDashboard.reporting.frequency = event.target.value
    this.setState({ currentDashboard });
  }

  onChangeEmails = (event) => {
    const currentDashboard = {...this.state.currentDashboard};
    currentDashboard.reporting.emails = event.target.value
    this.setState({ currentDashboard });
  }

  saveOrUpdate = () => {
    const { httpClient, currentDashboard, edit, space, dashboards } = this.state;

    const reportingData = {
      dashboardId: currentDashboard.dashboard.value || dashboards[0].value,
      emails: currentDashboard.reporting.emails,
      frequency: currentDashboard.reporting.frequency,
    };

    if (edit) {
      httpClient.patch(`../api/ezmesure/reporting/tasks/${currentDashboard._id}`, reportingData).then(res => {
        addToast(
          'Success',
          'Task updated successfully.',
          'success',
        );

        editReportingTask(currentDashboard);

        this.forceUpdate();
      }).catch(err => {
        return addToast(
          'Error',
          'An error occurred when updating the task.',
          'error',
        );
      });
    }

    if (!edit) {
      if (space) {
        reportingData = { ...reportingData, space };
      }
      httpClient.post('../api/ezmesure/reporting/tasks', reportingData).then(res => {
        console.log(res)
        addToast(
          'Success',
          'Task addedd successfully.',
          'success',
        );
        
        this.setState({ edit: true });

        currentDashboard._id = res.data._id;
        currentDashboard.reporting.createdAt = res.data.createdAt;

        const dashboard = this.state.dashboards.find(({ value }) => value === currentDashboard.dashboard.value);
        
        if (dashboard) {
          currentDashboard.dashboard.text = dashboard.text;  

          saveReportingTask(currentDashboard);

          this.forceUpdate();
        }
      }).catch(err => {
        console.log(err)
        return addToast(
          'Error',
          'An error occurred when adding the task.',
          'error',
        );
      });
    }
  }

  render() {
    const { currentDashboard, edit, errors, dashboards } = this.state;

    return (
      <Fragment>
        <EuiForm isInvalid={errors.show} error={errors.messages}>
          <EuiFormRow label="Dashboard" fullWidth isInvalid={edit ? false : errors.show}>
            <EuiSelect
              options={dashboards}
              value={currentDashboard.dashboard.value}
              aria-label="Dashboard"
              onChange={this.onChangeDashboard}
              fullWidth="true"
              disabled={edit}
              isInvalid={edit ? false : errors.show}
              name="selectedDashboard"
            ></EuiSelect>
          </EuiFormRow>

          <EuiFormRow label="Frequency" fullWidth isInvalid={errors.show}>
            <EuiSelect
              options={frequenciesData}
              value={currentDashboard.reporting.frequency}
              aria-label="Frequency"
              onChange={this.onChangeFrequency}
              fullWidth
              isInvalid={errors.show}
              name="selectedFrequency"
            ></EuiSelect>
          </EuiFormRow>

          <EuiFormRow label="E-mail addresses for recipients" fullWidth isInvalid={errors.show}>
            <EuiTextArea
              placeholder="E-mail addresses for recipients (ex: john@doe.com,jane@doe.com)"
              value={currentDashboard.reporting.emails}
              onChange={this.onChangeEmails}
              fullWidth
              isInvalid={errors.show}
              name="selectedEmails"
            />
          </EuiFormRow>

          <EuiFormRow fullWidth>
            <EuiButton
              fill
              iconType="save"
              type="submit"
              onClick={() => this.saveOrUpdate()}
            >
              Save
            </EuiButton>
          </EuiFormRow>
        </EuiForm>
      </Fragment>
    );
  }
};