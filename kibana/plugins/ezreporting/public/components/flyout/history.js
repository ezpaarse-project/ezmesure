import React, { Component, Fragment } from 'react';
import moment from 'moment';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiSelect,
  EuiFormRow,
  EuiForm,
  EuiText,
  EuiBasicTable,
  EuiHorizontalRule,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import { ms2Str } from '../../lib/reporting';

let openFlyOutHandler;
export function openFlyOut(dashboard, edit) {
  openFlyOutHandler(dashboard, edit);
}

let closeFlyOutHandler;
export function closeFlyOut() {
  closeFlyOutHandler();
}

export class HistoryFlyout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isFlyoutVisible: false,
      historiesData: [],
      histories: [],
      currentHistory: null,
      pageIndex: 0,
      pageSize: 10,
    };

    openFlyOutHandler = this.open;
    closeFlyOutHandler = this.close;
  }

  open = (history) => {
    this.setState({ historiesData: history.historiesData });
    this.setState({ histories: history.histories });
    this.setState({ currentHistory: JSON.parse(JSON.stringify(history.historiesData[0])) });
    this.setState({ isFlyoutVisible: true });
  };

  close = () => {
    this.setState({ isFlyoutVisible: false });
    this.setState({ currentHistory: null });
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

  render() {
    const {
      isFlyoutVisible,
      histories,
      currentHistory,
      pageIndex,
      pageSize
    } = this.state;

    let flyOutContent;

    if (!isFlyoutVisible) {
      return <Fragment />;
    }

    if (currentHistory) {

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

    return (
      <EuiFlyout
        onClose={this.close}
        size="m"
        aria-labelledby="flyoutSmallTitle"
      >
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2><FormattedMessage id="ezReporting.history" defaultMessage="History" /></h2>
          </EuiTitle>
        </EuiFlyoutHeader>

        <EuiFlyoutBody>
          { flyOutContent }
        </EuiFlyoutBody>
      </EuiFlyout>
    );
  }
}
