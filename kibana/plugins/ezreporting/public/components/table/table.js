import React, { Component } from 'react';
import moment from 'moment';
import {
  EuiBasicTable,
  EuiDescriptionList,
  EuiButtonIcon,
  EuiLink,
  EuiTextColor,
  EuiIcon,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import { capabilities } from 'ui/capabilities';
import { convertFrequency } from '../../lib/reporting';
import { openFlyOut, openFlyOutHistory } from '../flyout';
import { addToast } from '../toast';

export class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pageIndex: 0,
      pageSize: 10,
      itemIdToExpandedRowMap: {},
    };
  }

  toggleDetails = item => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };

    if (itemIdToExpandedRowMap[item._id]) {
      delete itemIdToExpandedRowMap[item._id];
      return this.setState({ itemIdToExpandedRowMap });
    }

    const { reporting } = item;
    const listItems = [
      {
        title: <FormattedMessage id="ezReporting.receiversEmails" defaultMessage="Receivers' email addresses" />,
        description: reporting.emails,
      },
      {
        title: <FormattedMessage id="ezReporting.createdAt" defaultMessage="Creation date" />,
        description: moment(reporting.createdAt).format('YYYY-MM-DD'),
      },
    ];
    itemIdToExpandedRowMap[item._id] = (
      <EuiDescriptionList listItems={listItems} />
    );

    return this.setState({ itemIdToExpandedRowMap });
  };

  onTableChange = ({ page = {} }) => {
    const { index: pageIndex, size: pageSize } = page;

    this.setState({
      pageIndex,
      pageSize,
    });
  };

  render() {
    const { pageIndex, pageSize, itemIdToExpandedRowMap } = this.state;
    const { tasks, dashboards, frequencies } = this.props;

    const actions = [];

    if (capabilities.get().ezreporting.edit) {
      actions.push({
        name: i18n.translate('ezReporting.edit', { defaultMessage: 'Edit' }),
        description: i18n.translate('ezReporting.edit', { defaultMessage: 'Edit' }),
        icon: 'pencil',
        type: 'icon',
        color: 'primary',
        onClick: el => {
          if (el.exists) {
            return openFlyOut(el, true);
          }

          return addToast(
            'Error',
            <FormattedMessage
              id="ezReporting.dashboardNotFound"
              values={{ DASHBOARD_ID: el.dashboardId }}
              defaultMessage="Dashboard nof found or remove (id: {DASHBOARD_ID})"
            />,
            'danger'
          );
        },
      });
    }

    if (capabilities.get().ezreporting.save) {
      actions.push({
        name: i18n.translate('ezReporting.download', { defaultMessage: 'Download' }),
        description: i18n.translate('ezReporting.download', { defaultMessage: 'Download' }),
        icon: 'importAction',
        type: 'icon',
        color: 'primary',
        onClick: el => {
          if (el.exists) {
            return this.props.downloadReport(el._id).then(() => {
              return addToast(
                'Information',
                <FormattedMessage id="ezReporting.downloaded" defaultMessage="Your report will be sent to you by email" />,
                'info'
              );
            }).catch(() => {
              return addToast(
                'Error',
                <FormattedMessage id="ezReporting.downloadError" defaultMessage="An error occurred while downloading report." />,
                'danger'
              );
            });
          }
        },
      });
    }

    if (capabilities.get().ezreporting.show) {
      actions.push({
        name: i18n.translate('ezReporting.history', { defaultMessage: 'History' }),
        description: i18n.translate('ezReporting.history', { defaultMessage: 'History' }),
        icon: 'clock',
        type: 'icon',
        color: 'primary',
        onClick: el => {
          if (el.exists) {
            return this.props.loadHistory(el._id).then((res) => {
              if (res && res.data) {
                if (res.data.historiesData.length <= 0) {
                  return addToast(
                    'Information',
                    <FormattedMessage id="ezReporting.noHistories" defaultMessage="This task has no history." />,
                    'info'
                  );
                }

                return openFlyOutHistory(res.data);
              }
            }).catch(() => {
              return addToast(
                'Error',
                <FormattedMessage id="ezReporting.historyError" defaultMessage="An error occurred while loading the history." />,
                'danger'
              );
            });
          }
        },
      });
    }

    if (capabilities.get().ezreporting.delete) {
      actions.push({
        name: i18n.translate('ezReporting.delete', { defaultMessage: 'Delete' }),
        description: i18n.translate('ezReporting.delete', { defaultMessage: 'Delete' }),
        icon: 'trash',
        type: 'icon',
        color: 'danger',
        onClick: el => {
          this.props.removeTaskHandler(el);
        },
      });
    }

    const columns = [
      {
        name: i18n.translate('ezReporting.dashboard', { defaultMessage: 'Dashboard' }),
        description: i18n.translate('ezReporting.dashboardName', { defaultMessage: 'Dashboard name' }),
        align: 'left',
        render: ({ dashboardId, reporting }) => {
          if (dashboardId) {
            const dashboard = dashboards.find(({ id }) => id === dashboardId);
            if (dashboard) {
              if (reporting.print) {
                const content = <FormattedMessage id="ezReporting.optimizedForPrinting" defaultMessage="Optimized for printing" />;
                return (
                  <span>
                    <EuiLink href={`kibana#/dashboard/${dashboardId}`}>{dashboard.name}</EuiLink> {' '}
                    <EuiToolTip position="right" content={content}>
                      <EuiText>&#128438;</EuiText>
                    </EuiToolTip>
                  </span>
                );
              }
              return (<EuiLink href={`kibana#/dashboard/${dashboardId}`}>{dashboard.name}</EuiLink>);
            }
          }

          return (
            <EuiTextColor color="warning"><EuiIcon type="alert" />
              <FormattedMessage
                id="ezReporting.dashboardNotFound"
                values={{ DASHBOARD_ID: dashboardId }}
                defaultMessage="Dashboard nof found or remove (id: {DASHBOARD_ID})"
              />
            </EuiTextColor>
          );
        },
      },
      {
        name: i18n.translate('ezReporting.frequency', { defaultMessage: 'Frequency' }),
        description: i18n.translate('ezReporting.frequency', { defaultMessage: 'Frequency' }),
        render: ({ reporting }) => convertFrequency(frequencies, reporting.frequency),
        align: 'center',
      },
      {
        name: i18n.translate('ezReporting.sentAt', { defaultMessage: 'Last sent' }),
        description: i18n.translate('ezReporting.sentAt', { defaultMessage: 'Last sent' }),
        align: 'center',
        render: ({ reporting }) => {
          if (reporting.sentAt && reporting.sentAt !== '1970-01-01T12:00:00.000Z') {
            return moment(reporting.sentAt).format('YYYY-MM-DD');
          }

          return '-';
        },
      },
      {
        actions,
        align: 'right',
        width: '32px',
      },
      {
        align: 'right',
        width: '40px',
        isExpander: true,
        render: item => (
          <EuiButtonIcon
            onClick={() => this.toggleDetails(item)}
            aria-label={itemIdToExpandedRowMap[item._id] ? 'Collapse' : 'Expand'}
            iconType={itemIdToExpandedRowMap[item._id] ? 'arrowUp' : 'arrowDown'}
          />
        ),
      },
    ];

    const pagination = {
      pageIndex,
      pageSize,
      totalItemCount: tasks.length,
      pageSizeOptions: [10, 20, 30],
      hidePerPageOptions: false,
    };

    const startIndex = (pageIndex * pageSize);
    const endIndex = Math.min(startIndex + pageSize, tasks.length);

    return (
      <EuiBasicTable
        items={tasks.slice(startIndex, endIndex)}
        itemId="_id"
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        isExpandable={true}
        hasActions={true}
        columns={columns}
        pagination={pagination}
        onChange={this.onTableChange}
      />
    );
  }
}
