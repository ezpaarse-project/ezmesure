import React, { Component, Fragment } from 'react';
import {
  EuiSelect,
  EuiTextArea,
  EuiFormRow,
  EuiForm,
  EuiButton,
} from '@elastic/eui';
import { timesSpanData } from '../lib/reporting';
import $jQ from 'jquery';

export default class Form extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dashboards: [],
      currentDashboard: props.currentDashboard,
      edit: props.edit,
      errors: {
        show: false,
        messages: [
          // 'You must select a dashboard',
          // 'You must select a time span',
          // 'You must at least enter an email address',
          // 'The email address format does not match',
        ],
      },
    };
  }

  componentDidMount() {
    const { httpClient } = this.props;

    const currentUrl = $jQ(location).attr('pathname');
    let space = '';
    if (/^\/kibana\/s\/([a-z0-9\-]+)/i.test(currentUrl)) {
      space = currentUrl.split('/')[3];
    }

    httpClient.get(`../api/ezmesure/reporting/list/${space}`).then(res => {
      this.setState({ dashboards: res.data.dashboards });
    }).catch(err => console.log(err));
  }

  onChange = (el) => {
    console.log(el);
  }

  render() {
    const { currentDashboard, edit, errors, dashboards } = this.state;

    return (
      <Fragment>
        <EuiForm isInvalid={errors.show} error={errors.messages}>
          <EuiFormRow label="Dashboard" fullWidth isInvalid={edit ? false : errors.show}>
            <EuiSelect
              options={dashboards}
              value={currentDashboard.dashboard.text}
              aria-label="Dashboard"
              onChange={this.onChange}
              fullWidth="true"
              disabled={edit}
              isInvalid={edit ? false : errors.show}
              name="selectedDashboard"
            ></EuiSelect>
          </EuiFormRow>

          <EuiFormRow label="Time span" fullWidth isInvalid={errors.show}>
            <EuiSelect
              options={timesSpanData}
              value={currentDashboard.reporting.timeSpan}
              aria-label="Time span"
              onChange={this.onChange}
              fullWidth
              isInvalid={errors.show}
              name="selectedTimeSpan"
            ></EuiSelect>
          </EuiFormRow>

          <EuiFormRow label="E-mail addresses for recipients" fullWidth isInvalid={errors.show}>
            <EuiTextArea
              placeholder="E-mail addresses for recipients (ex: john@doe.com,jane@doe.com)"
              value={currentDashboard.reporting.emails}
              onChange={this.onChange}
              fullWidth
              isInvalid={errors.show}
              name="selectedEmails"
            />
          </EuiFormRow>

          <EuiFormRow fullWidth>
            <EuiButton
              fill
              iconType="save"
              onClick={() => alert('Saved')}>
              Save
            </EuiButton>
          </EuiFormRow>
        </EuiForm>
      </Fragment>
    );
  }
};