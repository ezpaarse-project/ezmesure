import React, { Component } from 'react';
import {
  EuiSelect,
  EuiTextArea,
  EuiFormRow,
  EuiButton,
} from '@elastic/eui';
import { timeSpanData, dashboards } from '../../lib/reporting'

export default class Form extends Component {
  constructor (props) {
    super(props);

    this.state = {
      currentDashboard: props.currentDashboard,
      edit: props.edit,
    };
  }

  onChange = (el) => {
    console.log(el)
  }

  render() {
    const { currentDashboard, edit } = this.state;

    return (
      <React.Fragment>
        <EuiFormRow label="Tableau de bord" fullWidth>
          <EuiSelect
            options={dashboards}
            value={currentDashboard.dashboard.name}
            aria-label="Tableau de bord"
            onChange={this.onChange}
            fullWidth="true"
            disabled={edit}
          ></EuiSelect>
        </EuiFormRow>

        <EuiFormRow label="Période" fullWidth>
          <EuiSelect
            options={timeSpanData}
            value={currentDashboard.reporting.timeSpan}
            aria-label="Période"
            onChange={this.onChange}
            fullWidth="true"
          ></EuiSelect>
        </EuiFormRow>

        <EuiFormRow label="Adresses électroniques destinataires" fullWidth>
          <EuiTextArea
            placeholder="Adresses électroniques destinataires, séparés par une virgule (ex john@doe.com,jane@doe.com)"
            aria-label="Adresses électroniques destinataires, séparés par une virgule (ex john@doe.com,jane@doe.com)"
            value={currentDashboard.reporting.emails}
            onChange={this.onChange}
            fullWidth="true"
          />
        </EuiFormRow>

        <EuiFormRow fullWidth>
          <EuiButton
            fill
            iconType="save"
            onClick={() => alert('Saved')}>
            Sauvegarder
          </EuiButton>
        </EuiFormRow>
      </React.Fragment>
    );
  }
};