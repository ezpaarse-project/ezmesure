/* eslint-disable @kbn/eslint/require-license-header */
import React, { Component } from 'react';
import { EuiInMemoryTable, EuiDescriptionList, EuiButtonIcon, EuiLink } from '@elastic/eui';
import { RIGHT_ALIGNMENT, LEFT_ALIGNMENT, CENTER_ALIGNMENT } from '@elastic/eui/lib/services';
import { FormattedMessage } from '@kbn/i18n/react';
import { convertFrequency } from '../../lib/reporting';
import { openFlyOut } from '../flyout';

export class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
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
        title: <FormattedMessage id="ezmesureReporting.receiversEmails" defaultMessage="Receivers' email addresses" />,
        description: reporting.emails,
      },
      {
        title: <FormattedMessage id="ezmesureReporting.createdAt" defaultMessage="Creation date" />,
        description: reporting.createdAt,
      },
    ];
    itemIdToExpandedRowMap[item._id] = (
      <EuiDescriptionList listItems={listItems} />
    );

    return this.setState({ itemIdToExpandedRowMap });
  };

  render() {
    const { itemIdToExpandedRowMap } = this.state;
    const { reporting } = this.props;

    const columns = [
      {
        name: <FormattedMessage id="ezmesureReporting.dashboard" defaultMessage="Dashboard" />,
        description: <FormattedMessage id="ezmesureReporting.dashboardName" defaultMessage="Dashboard name" />,
        render: ({ dashboard }) => (<EuiLink href={`kibana#/dashboard/${dashboard.value}`}>{dashboard.text}</EuiLink>),
        sortable: false,
        align: LEFT_ALIGNMENT,
      },
      {
        name: <FormattedMessage id="ezmesureReporting.frequency" defaultMessage="Frequency" />,
        description: <FormattedMessage id="ezmesureReporting.frequency" defaultMessage="Frequency" />,
        render: ({ reporting }) => convertFrequency(reporting.frequency),
        sortable: true,
        align: CENTER_ALIGNMENT,
      },
      {
        name: 'Actions',
        actions: [
          {
            name: <FormattedMessage id="ezmesureReporting.edit" defaultMessage="Edit" />,
            description: <FormattedMessage id="ezmesureReporting.edit" defaultMessage="Edit" />,
            icon: 'pencil',
            type: 'icon',
            color: 'primary',
            onClick: el => {
              this.toggleDetails(el);
              openFlyOut(el, true);
            },
          },
          {
            name: <FormattedMessage id="ezmesureReporting.delete" defaultMessage="Delete" />,
            description: <FormattedMessage id="ezmesureReporting.delete" defaultMessage="Delete" />,
            icon: 'trash',
            type: 'icon',
            color: 'danger',
            onClick: el => {
              this.props.removeTaskHandler(el);
            },
          },
        ],
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

    return (
      <EuiInMemoryTable
        items={reporting}
        itemId="_id"
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        isExpandable={true}
        hasActions={true}
        columns={columns}
        pagination={false}
      />
    );
  }
}
