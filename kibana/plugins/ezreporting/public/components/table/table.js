import React, { Component } from 'react';
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
import { RIGHT_ALIGNMENT, LEFT_ALIGNMENT, CENTER_ALIGNMENT } from '@elastic/eui/lib/services';
import { FormattedMessage } from '@kbn/i18n/react';
import { capabilities } from 'ui/capabilities';
import { convertFrequency, convertDate } from '../../lib/reporting';
import { openFlyOut } from '../flyout';
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
        description: convertDate(reporting.createdAt),
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

    const columns = [
      {
        name: <FormattedMessage id="ezReporting.dashboard" defaultMessage="Dashboard" />,
        description: <FormattedMessage id="ezReporting.dashboardName" defaultMessage="Dashboard name" />,
        render: ({ dashboardId, reporting }) => {
          if (dashboardId) {
            const dashboard = dashboards.find(({ id }) => id === dashboardId);
            if (dashboard) {
              if (reporting.print) {
                const content = <FormattedMessage id="ezReporting.optimizedForPrinting" defaultMessage="Optimized for printing" />
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

            return (
              <EuiTextColor color="warning"><EuiIcon type="alert" />
                <FormattedMessage id="ezReporting.dashboardNotFound" values={{ DASHBOARD_ID: dashboardId }} defaultMessage="Dashboard nof found or remove (id: {DASHBOARD_ID})" />
              </EuiTextColor>
            );
          }

          return (
            <EuiTextColor color="warning"><EuiIcon type="alert" />
              <FormattedMessage id="ezReporting.dashboardNotFound" values={{ DASHBOARD_ID: dashboardId }} defaultMessage="Dashboard nof found or remove (id: {DASHBOARD_ID})" />
            </EuiTextColor>
          );
        },
        sortable: false,
        align: LEFT_ALIGNMENT,
      },
      {
        name: <FormattedMessage id="ezReporting.frequency" defaultMessage="Frequency" />,
        description: <FormattedMessage id="ezReporting.frequency" defaultMessage="Frequency" />,
        render: ({ reporting }) => convertFrequency(frequencies, reporting.frequency),
        sortable: true,
        align: CENTER_ALIGNMENT,
      },
      {
        name: <FormattedMessage id="ezReporting.sentAt" defaultMessage="Sending date" />,
        description: <FormattedMessage id="ezReporting.sentAt" defaultMessage="Sending date" />,
        render: ({ reporting }) => {
          if (reporting.sentAt && reporting.sentAt !== '1970-01-01T12:00:00.000Z') {
            return convertDate(reporting.sentAt);
          }

          return '-';
        },
        sortable: true,
        align: CENTER_ALIGNMENT,
      },
      {
        name: 'Actions',
        actions: [],
      },
      {
        align: RIGHT_ALIGNMENT,
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

    if (capabilities.get().ezreporting.edit) {
      columns[3].actions.push({
        name: <FormattedMessage id="ezReporting.edit" defaultMessage="Edit" />,
        description: <FormattedMessage id="ezReporting.edit" defaultMessage="Edit" />,
        icon: 'pencil',
        type: 'icon',
        color: 'primary',
        onClick: el => {
          if (el.exists) {
            return openFlyOut(el, true);
          }

          return addToast(
            'Error',
            <FormattedMessage id="ezReporting.dashboardNotFound" values={{ DASHBOARD_ID: el.dashboardId }} defaultMessage="Dashboard nof found or remove (id: {DASHBOARD_ID})" />,
            'danger'
          );
        },
      });
    }

    if (capabilities.get().ezreporting.delete) {
      columns[3].actions.push({
        name: <FormattedMessage id="ezReporting.delete" defaultMessage="Delete" />,
        description: <FormattedMessage id="ezReporting.delete" defaultMessage="Delete" />,
        icon: 'trash',
        type: 'icon',
        color: 'danger',
        onClick: el => {
          this.props.removeTaskHandler(el);
        },
      });
    }

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
