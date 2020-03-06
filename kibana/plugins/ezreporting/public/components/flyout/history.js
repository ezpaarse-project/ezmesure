import React, { Component, Fragment } from 'react';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiBadge,
  EuiBasicTable,
  EuiButtonIcon,
  EuiHealth,
  EuiFlyoutFooter,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { capabilities } from 'ui/capabilities';
import { FormattedMessage } from '@kbn/i18n/react';
import { addToast } from '../toast';
import { ms2Str, httpClient } from '../../lib/reporting';
import { i18n } from '@kbn/i18n';

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
      taskId: null,
      refreshing: false,
      isFlyoutVisible: false,
      historyItems: [],
      pageIndex: 0,
      pageSize: 10,
      expandedRows: {},
    };

    openFlyOutHandler = this.open;
    closeFlyOutHandler = this.close;
  }

  showDetails = (historyItem) => {
    const expandedRows = { ...this.state.expandedRows };
    const { logs = [] } = historyItem;

    const columns = [
      {
        field: 'date',
        name: i18n.translate('ezReporting.date', { defaultMessage: 'Date' }),
        align: 'left',
        dataType: 'date',
        width: '180px',
      },
      {
        field: 'type',
        name: i18n.translate('ezReporting.type', { defaultMessage: 'Type' }),
        width: '80px',
        render: (type) => {
          const colors = {
            'error': 'danger',
            'info': 'primary',
            'warn': 'warning'
          };
          return <EuiBadge color={colors[type] || 'hollow'}>{type}</EuiBadge>;
        },
      },
      {
        field: 'message',
        name: i18n.translate('ezReporting.message', { defaultMessage: 'Message' }),
        align: 'left',
      },
    ];
    expandedRows[historyItem.id] = (
      <Fragment>
        <EuiBasicTable
          items={logs}
          columns={columns}
        />

      </Fragment>
    );

    this.setState({ expandedRows });
  }

  hideDetails = (historyId) => {
    const expandedRows = { ...this.state.expandedRows };
    delete expandedRows[historyId];
    this.setState({ expandedRows });
  }

  toggleDetails = (historyItem) => {
    const expandedRows = { ...this.state.expandedRows };

    if (expandedRows[historyItem.id]) {
      this.hideDetails(historyItem.id);
    } else {
      this.showDetails(historyItem);
    }
  }

  refresh = async () => {
    const { taskId, expandedRows } = this.state;

    this.setState({ refreshing: true });

    let historyItems;
    try {
      const resp = await httpClient.get(`../api/ezreporting/reporting/tasks/${taskId}/history`);
      historyItems = resp && resp.data;
    } catch (e) {
      addToast(
        'Error',
        <FormattedMessage id="ezReporting.historyError" defaultMessage="An error occurred while loading the history." />,
        'danger'
      );
    }

    historyItems = historyItems || [];

    // Refresh history logs
    Object.keys(expandedRows).forEach((historyId) => {
      const historyItem = historyItems.find(item => item.id === historyId);

      if (historyItem) {
        this.showDetails(historyItem);
      } else {
        this.hideDetails(historyId);
      }
    });

    this.setState({
      refreshing: false,
      historyItems,
    });
  }

  open = async (taskId) => {
    if (!taskId || !capabilities.get().ezreporting.show) {
      return;
    }

    this.setState({
      taskId,
      historyItems: [],
      isFlyoutVisible: true
    }, this.refresh);
  };

  close = () => {
    this.setState({ isFlyoutVisible: false });
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
      refreshing,
      isFlyoutVisible,
      historyItems,
      expandedRows,
      pageIndex,
      pageSize,
    } = this.state;

    if (!isFlyoutVisible) {
      return <Fragment />;
    }

    const columns = [
      {
        field: 'startTime',
        name: i18n.translate('ezReporting.date', { defaultMessage: 'Date' }),
        sortable: true,
        dataType: 'date',
        align: 'left',
      },
      {
        field: 'status',
        name: i18n.translate('ezReporting.status', { defaultMessage: 'Status' }),
        sortable: true,
        align: 'left',
        width: '140px',
        render: (status) => {
          switch (status) {
            case 'error':
              return <EuiHealth color="danger">{ i18n.translate('ezReporting.error', { defaultMessage: 'Error' })}</EuiHealth>;
            case 'completed':
              return <EuiHealth color="success">{ i18n.translate('ezReporting.completed', { defaultMessage: 'Completed' })}</EuiHealth>;
            case 'ongoing':
              return <EuiHealth color="primary">{ i18n.translate('ezReporting.ongoing', { defaultMessage: 'Ongoing' })}</EuiHealth>;
            default:
              return <EuiHealth color="subdued">{ i18n.translate('ezReporting.unknown', { defaultMessage: 'Unknown' })}</EuiHealth>;
          }
        },
      },
      {
        field: 'executionTime',
        name: i18n.translate('ezReporting.executionTime', { defaultMessage: 'Execution time' }),
        sortable: true,
        align: 'right',
        width: '140px',
        render: (executionTime) => {
          return ms2Str(executionTime);
        },
      },
      {
        align: 'right',
        width: '40px',
        isExpander: true,
        render: item => (
          <EuiButtonIcon
            onClick={() => this.toggleDetails(item)}
            aria-label={expandedRows[item.id] ? 'Collapse' : 'Expand'}
            iconType={expandedRows[item.id] ? 'arrowUp' : 'arrowDown'}
          />
        ),
      }
    ];

    const pagination = {
      pageIndex,
      pageSize,
      totalItemCount: historyItems.length,
      pageSizeOptions: [10, 20, 30],
      hidePerPageOptions: false,
    };

    const startIndex = (pageIndex * pageSize);
    const endIndex = Math.min(startIndex + pageSize, historyItems.length);

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
          <EuiBasicTable
            items={historyItems.slice(startIndex, endIndex)}
            itemId="id"
            itemIdToExpandedRowMap={this.state.expandedRows}
            isExpandable={true}
            columns={columns}
            pagination={pagination}
            onChange={this.onTableChange}
          />
        </EuiFlyoutBody>

        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButton
                iconType="refresh"
                onClick={this.refresh}
                isLoading={refreshing}
                fill
              >
                <FormattedMessage id="ezReporting.refresh" defaultMessage="Refresh" />
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlyout>
    );
  }
}
