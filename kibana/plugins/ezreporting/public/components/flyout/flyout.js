import React, { Component, Fragment } from 'react';
import { get, set } from 'lodash';
import moment from 'moment';
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
  EuiText,
  EuiBasicTable,
  EuiHorizontalRule,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import { capabilities } from 'ui/capabilities';
import { defaultTask, ms2Str } from '../../lib/reporting';
import { addToast } from '../toast';

let openFlyOutHandler;
export function openFlyOut(dashboard, edit) {
  openFlyOutHandler(dashboard, edit);
}

let openFlyOutHistoryHandler;
export function openFlyOutHistory(history) {
  openFlyOutHistoryHandler(history);
}

let closeFlyOutHandler;
export function closeFlyOut() {
  closeFlyOutHandler();
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
      historiesData: [],
      histories: [],
      currentHistory: null,
      pageIndex: 0,
      pageSize: 10,
    };

    openFlyOutHandler = this.open;
    openFlyOutHistoryHandler = this.openHistory;
    closeFlyOutHandler = this.close;
    updateEdit = this.updateEdit;
  }

  open = (dashboard, edit) => {
    this.setState({ currentHistory: null });
    this.setState({ isFlyoutVisible: true });
    this.setState({ edit });

    const currentTask = JSON.parse(JSON.stringify(dashboard || defaultTask(this.props.dashboards[0].id)));
    const currentFrequency = get(currentTask, 'reporting.frequency.value');
    const frequency = this.props.frequencies.find((f) => f.value === currentFrequency);

    if (!frequency && this.props.frequencies.length > 0) {
      // If the task frequency doesn't exist anymore, auto-select first frequency
      set(currentTask, 'reporting.frequency', this.props.frequencies[0].value);
    }

    this.setState({ currentTask });
  };

  openHistory = (history) => {
    this.setState({ historiesData: history.historiesData });
    this.setState({ histories: history.histories });
    this.setState({ currentHistory: JSON.parse(JSON.stringify(history.historiesData[0])) });
    this.setState({ isFlyoutVisible: true });
  };

  close = () => {
    this.setState({ isFlyoutVisible: false });
    this.setState({ currentHistory: null });
  };

  onChangeDashboard = (event) => {
    const currentTask = { ...this.state.currentTask };
    currentTask.dashboardId = event.target.value;
    this.setState({ currentTask });
  };

  onChangeFrequency = (event) => {
    const currentTask = { ...this.state.currentTask };
    currentTask.reporting.frequency = event.target.value;
    this.setState({ currentTask });
  };

  onChangeEmails = (event) => {
    const currentTask = { ...this.state.currentTask };
    currentTask.reporting.emails = event.target.value;
    this.setState({ currentTask });
  };

  onChangeLayout = (event) => {
    const currentTask = { ...this.state.currentTask };
    currentTask.reporting.print = event.target.checked;
    this.setState({ currentTask });
  };

  onChangeHistory = (event) => {
    const tmp = this.state.historiesData.find(({ id }) => id === event.target.value);
    this.setState({ currentHistory: tmp });
  };

  onTableChange = ({ page = {} }) => {
    const { index: pageIndex, size: pageSize } = page;

    this.setState({
      pageIndex,
      pageSize,
    });
  };

  saveOrUpdate = () => {
    if (capabilities.get().ezreporting.save) {
      const { edit, currentTask } = this.state;

      if (edit) {
        return this.props.editTaskHandler(currentTask).catch((err) => addToast(
          'Error',
          err && err.data && err.data.error || 'Error',
          'danger'
        ));
      }

      return this.props.saveTaskHandler(currentTask).catch((err) => addToast(
        'Error',
        err && err.data && err.data.error || 'Error',
        'danger'
      ));
    }
  };

  render() {
    const { isFlyoutVisible, currentTask, edit, errors, histories, currentHistory, pageIndex, pageSize } = this.state;
    const { dashboards, frequencies } = this.props;

    const options = dashboards.map(dashboard => ({ value: dashboard.id, text: dashboard.name }));

    let saveBtn;
    if (capabilities.get().ezreporting.save) {
      saveBtn = (
        <EuiFormRow fullWidth={true}>
          <EuiButton
            fill
            iconType="save"
            type="submit"
            onClick={() => this.saveOrUpdate()}
          >
            <FormattedMessage id="ezReporting.save" defaultMessage="Save" />
          </EuiButton>
        </EuiFormRow>
      );
    }

    let flyOutContent;

    if (!isFlyoutVisible) {
      return <Fragment />;
    }

    let title;

    if (currentHistory) {
      title = <FormattedMessage id="ezReporting.history" defaultMessage="History" />;

      const columns = [
        {
          field: 'date',
          name: 'Date',
          sortable: true,
          align: 'left',
          width: '200px',
          render: (date) => {
            return moment(date).format('YYYY-MM-DD HH:mm:ss');
          },
        },
        {
          field: 'status',
          name: 'Status',
          sortable: true,
          align: 'left',
          width: '100px',
        },
        {
          field: 'message',
          name: 'Message',
          sortable: false,
          align: 'left',
        }
      ];

      const pagination = {
        pageIndex,
        pageSize,
        totalItemCount: currentHistory.data.length,
        pageSizeOptions: [10, 20, 30],
        hidePerPageOptions: false,
      };

      const startIndex = (pageIndex * pageSize);
      const endIndex = Math.min(startIndex + pageSize, currentHistory.data.length);

      flyOutContent = (
        <Fragment>
          <EuiForm>
            <EuiFormRow
              fullWidth={true}
              label={<FormattedMessage id="ezReporting.reportingDate" defaultMessage="Reporting date" />}
            >
              <EuiSelect
                fullWidth={true}
                options={histories}
                value={currentHistory.id}
                onChange={this.onChangeHistory}
                aria-label={<FormattedMessage id="ezReporting.reportingDate" defaultMessage="Reporting date" />}
              />
            </EuiFormRow>
          </EuiForm>

          <EuiHorizontalRule margin="m" />
          <EuiText>
            <strong>
              <FormattedMessage
                id="ezReporting.executionTime"
                defaultMessage="Execution time"
              />
            </strong> : { ms2Str(currentHistory.executionTime) }
          </EuiText>

          <EuiHorizontalRule margin="m" />
          <EuiBasicTable
            items={currentHistory.data.slice(startIndex, endIndex)}
            columns={columns}
            onChange={this.onTableChange}
            pagination={pagination}
          />
        </Fragment>
      );
    }

    if (!currentHistory) {
      if (edit) {
        title = <FormattedMessage id="ezReporting.editing" defaultMessage="Editing" />;
      } else {
        title = <FormattedMessage id="ezReporting.creating" defaultMessage="Creating" />;
      }

      title = (<Fragment>{ title }  <FormattedMessage id="ezReporting.reportingTask" defaultMessage="a reporting task" /></Fragment>);

      flyOutContent = (
        <EuiForm isInvalid={errors.show} error={errors.messages}>
          <EuiFormRow
            fullWidth={true}
            label={<FormattedMessage id="ezReporting.dashboard" defaultMessage="Dashboard" />}
            isInvalid={edit ? false : errors.show}
          >
            <EuiSelect
              fullWidth={true}
              options={options}
              value={currentTask.dashboardId}
              aria-label={<FormattedMessage id="ezReporting.dashboard" defaultMessage="Dashboard" />}
              onChange={this.onChangeDashboard}
              disabled={edit}
              isInvalid={edit ? false : errors.show}
            />
          </EuiFormRow>

          <EuiFormRow
            fullWidth={true}
            label={<FormattedMessage id="ezReporting.frequency" defaultMessage="Frequency" />}
            isInvalid={errors.show}
          >
            <EuiSelect
              fullWidth={true}
              options={frequencies}
              value={currentTask.reporting.frequency}
              aria-label={<FormattedMessage id="ezReporting.frequency" defaultMessage="Frequency" />}
              onChange={this.onChangeFrequency}
              isInvalid={errors.show}
            />
          </EuiFormRow>

          <EuiFormRow
            fullWidth={true}
            label={<FormattedMessage id="ezReporting.receiversEmails" defaultMessage="Receivers' email addresses" />}
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
              id="optimize-checkbox"
              checked={currentTask.reporting.print}
              label={<FormattedMessage id="ezReporting.optimizedForPrinting" defaultMessage="Optimized for printing" />}
              onChange={this.onChangeLayout}
            />
          </EuiFormRow>

          {saveBtn}
        </EuiForm>
      );
    }

    return (
      <EuiFlyout
        onClose={this.close}
        size="m"
        aria-labelledby="flyoutSmallTitle"
      >
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2>{ title }</h2>
          </EuiTitle>
        </EuiFlyoutHeader>

        <EuiFlyoutBody>
          { flyOutContent }
        </EuiFlyoutBody>
      </EuiFlyout>
    );
  }
}
