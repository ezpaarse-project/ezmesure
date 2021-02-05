/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { Component, Fragment } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import {
  EuiBasicTable,
  EuiDescriptionList,
  EuiButtonIcon,
  EuiLink,
  EuiTextColor,
  EuiIcon,
  EuiImage,
  EuiToolTip,
  EuiBadge,
  EuiLoadingSpinner,
} from '@elastic/eui';
import moment from 'moment';

import { openFlyOut as openEditFlyOut } from './flyout/edit';
import { openFlyOut as openHistoryFlyOut } from './flyout/history';
import { convertFrequency, toasts, capabilities, httpClient } from '../../lib/reporting';
import printer from '../../public/images/printer.png';

interface Props {
  tasks: any[];
  tasksInProgress: object;
  spaces: any[];
  frequencies: any[];
  dashboards: any[];
  admin: boolean;
  onSelectionChangeHandler(tasksId: any[]): void;
}

interface State {
  itemIdToExpandedRowMap: object;
  pageIndex: number;
  pageSize: number;
  sortField: string;
  sortDirection: string;
  tasksInProgress: object;
}

export class EzReportingTable extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      itemIdToExpandedRowMap: {},
      pageIndex: 0,
      pageSize: 10,
      sortField: 'namespace',
      sortDirection: 'asc',
      tasksInProgress: {},
    };
  }

  toggleDetails = (item) => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };

    if (itemIdToExpandedRowMap[item._id]) {
      delete itemIdToExpandedRowMap[item._id];
      return this.setState({ itemIdToExpandedRowMap });
    }

    const { reporting } = item;
    const receivers = Array.isArray(reporting.emails)
      ? reporting.emails.join(', ')
      : reporting.emails;

    const dsh = this.props.dashboards.find(({ id, namespace }) => {
      if (id !== item.dashboardId && namespace !== item.namespace) {
        return false;
      }
      return true;
    });

    const listItems = [
      {
        title: (
          <FormattedMessage id="ezReporting.dashboardDescription" defaultMessage="Description" />
        ),
        description: dsh.description || 'N/A',
      },
      {
        title: (
          <FormattedMessage
            id="ezReporting.receiversEmails"
            defaultMessage="Receivers' email addresses"
          />
        ),
        description: receivers,
      },
      {
        title: <FormattedMessage id="ezReporting.nextReport" defaultMessage="Next report" />,
        description: reporting.runAt ? moment(reporting.runAt).format('YYYY-MM-DD hh:mm') : 'N/A',
      },
      {
        title: <FormattedMessage id="ezReporting.createdAt" defaultMessage="Creation date" />,
        description: reporting.createdAt ? moment(reporting.createdAt).format('YYYY-MM-DD') : 'N/A',
      },
    ];
    itemIdToExpandedRowMap[item._id] = <EuiDescriptionList listItems={listItems} />;

    return this.setState({ itemIdToExpandedRowMap });
  };

  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;

    this.setState({
      pageIndex,
      pageSize,
      sortField,
      sortDirection,
    });
  };

  render() {
    const { pageIndex, pageSize, itemIdToExpandedRowMap, sortField, sortDirection, } = this.state;
    const {
      tasks,
      tasksInProgress,
      spaces,
      dashboards,
      frequencies,
      onSelectionChangeHandler,
    } = this.props;

    const actions = [];

    if (capabilities.edit) {
      actions.push({
        name: i18n.translate('ezReporting.edit', { defaultMessage: 'Edit' }),
        description: i18n.translate('ezReporting.edit', { defaultMessage: 'Edit' }),
        icon: 'pencil',
        type: 'icon',
        color: 'primary',
        onClick: (el) => {
          if (el.exists) {
            return openEditFlyOut(el, true);
          }

          return toasts.addDanger({
            title: 'Error',
            text: (
              <FormattedMessage
                id="ezReporting.dashboardNotFound"
                values={{ DASHBOARD_ID: el.dashboardId }}
                defaultMessage="Dashboard nof found or remove (id: {DASHBOARD_ID})"
              />
            ),
          });
        },
      });
    }

    if (capabilities.edit) {
      actions.push({
        name: i18n.translate('ezReporting.clone', { defaultMessage: 'Clone' }),
        description: i18n.translate('ezReporting.clone', { defaultMessage: 'Clone' }),
        icon: 'copy',
        type: 'icon',
        color: 'primary',
        onClick: (el) => {
          if (el.exists) {
            return openEditFlyOut(el, false);
          }

          return toasts.addDanger({
            title: 'Error',
            text: (
              <FormattedMessage
                id="ezReporting.dashboardNotFound"
                values={{ DASHBOARD_ID: el.dashboardId }}
                defaultMessage="Dashboard nof found or remove (id: {DASHBOARD_ID})"
              />
            ),
          });
        },
      });
    }

    if (capabilities.show) {
      actions.push({
        name: i18n.translate('ezReporting.history', { defaultMessage: 'History' }),
        description: i18n.translate('ezReporting.history', { defaultMessage: 'History' }),
        icon: 'clock',
        type: 'icon',
        color: 'primary',
        onClick: (el) => {
          if (el.exists) {
            openHistoryFlyOut(el._id, false);
          }
        },
      });
    }

    const columns = [
      {
        field: 'dashboardId',
        name: i18n.translate('ezReporting.dashboard', { defaultMessage: 'Dashboard' }),
        description: i18n.translate('ezReporting.dashboardName', {
          defaultMessage: 'Dashboard name',
        }),
        align: 'left',
        render: (dashboardId, { _id, reporting }) => {
          if (dashboardId) {
            const dashboard = dashboards.find(({ id }) => id === dashboardId);
            if (dashboard) {
              let print;
              if (reporting.print) {
                print = (
                  <Fragment>
                    {' '}
                    <EuiToolTip
                      position="right"
                      content={i18n.translate('ezReporting.optimizedForPrinting', {
                        defaultMessage: 'Optimized for printing',
                      })}
                    >
                      <EuiImage
                        alt={i18n.translate('ezReporting.optimizedForPrinting', {
                          defaultMessage: 'Optimized for printing',
                        })}
                        size={14}
                        url={printer}
                      />
                    </EuiToolTip>
                  </Fragment>
                );
              }

              let dashboardLink = `/app/kibana#/dashboard/${dashboardId}`;
              if (this.props.admin && dashboard.namespace !== 'default') {
                dashboardLink = `/s/${dashboard.namespace}${dashboardLink}`;
              }

              const taskStatus = tasksInProgress[_id];
              let statusIcon;

              if (taskStatus) {
                const { status, log } = taskStatus;

                if (status) {
                  if (status === 'pending' || status === 'ongoing') {
                    statusIcon = <EuiLoadingSpinner size="m" />;
                  } else if (status === 'error') {
                    statusIcon = (
                      <EuiToolTip position="bottom" content={log}>
                        <EuiIcon type="alert" />
                      </EuiToolTip>
                    );
                  } else {
                    statusIcon = '';
                  }
                }
              }

              return (
                <Fragment>
                  {statusIcon}
                  &nbsp;
                  <EuiLink href={httpClient.basePath.prepend(dashboardLink)}>
                    {dashboard.name}
                  </EuiLink>
                  &nbsp;{print}
                </Fragment>
              );
            }
          }

          return (
            <EuiTextColor color="warning">
              <EuiIcon type="alert" />
              <FormattedMessage
                id="ezReporting.dashboardNotFound"
                values={{ DASHBOARD_ID: dashboardId }}
                defaultMessage="Dashboard nof found or remove (id: {DASHBOARD_ID})"
              />
            </EuiTextColor>
          );
          return '';
        },
      },
      {
        field: 'reporting.frequency',
        name: i18n.translate('ezReporting.frequency', { defaultMessage: 'Frequency' }),
        description: i18n.translate('ezReporting.frequency', { defaultMessage: 'Frequency' }),
        render: (frequency) => convertFrequency(frequencies, frequency),
        sortable: true,
        align: 'center',
      },
      {
        field: 'reporting.sentAt',
        name: i18n.translate('ezReporting.sentAt', { defaultMessage: 'Last sent' }),
        description: i18n.translate('ezReporting.sentAt', { defaultMessage: 'Last sent' }),
        align: 'center',
        render: (sentAt) => {
          if (sentAt && sentAt !== '1970-01-01T12:00:00.000Z') {
            return moment(sentAt).format('YYYY-MM-DD');
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
        render: (item) => (
          <EuiButtonIcon
            onClick={() => this.toggleDetails(item)}
            aria-label={itemIdToExpandedRowMap[item._id] ? 'Collapse' : 'Expand'}
            iconType={itemIdToExpandedRowMap[item._id] ? 'arrowUp' : 'arrowDown'}
          />
        ),
      },
    ];

    if (this.props.admin) {
      columns.splice(1, 0, {
        field: 'namespace',
        name: i18n.translate('ezReporting.space', { defaultMessage: 'Space' }),
        description: i18n.translate('ezReporting.space', { defaultMessage: 'Space' }),
        render: (namespace) => {
          const space = spaces.find(({ name }) => name === namespace);
          return <EuiBadge color={space.color}>{namespace || '-'}</EuiBadge>;
        },
        sortable: true,
        align: 'center',
      });
    }

    const pagination = {
      pageIndex,
      pageSize,
      totalItemCount: tasks.length,
      pageSizeOptions: [10, 20, 30],
      hidePerPageOptions: false,
    };

    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    };

    const startIndex = pageIndex * pageSize;
    const endIndex = Math.min(startIndex + pageSize, tasks.length);

    const selection = {
      selectable: (task) => task?._id,
      selectableMessage: (selectable) =>
        !selectable
          ? i18n.translate('ezReporting.invalidTask', { defaultMessage: 'Invalid task' })
          : undefined,
      onSelectionChange: onSelectionChangeHandler,
    };

    const items = tasks.slice(startIndex, endIndex).sort((a, b) => {
      let first = sortField.split('.').reduce((o, i) => o[i], a);
      let second = sortField.split('.').reduce((o, i) => o[i], b);

      if (sortField === 'reporting.frequency') {
        first = convertFrequency(frequencies, first);
        second = convertFrequency(frequencies, second);
      }

      if (sortDirection === 'asc') {
        return first > second;
      }
      return first < second;
    });

    return (
      <EuiBasicTable
        items={items}
        itemId="_id"
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        isExpandable={true}
        hasActions={true}
        columns={columns}
        pagination={pagination}
        sorting={sorting}
        isSelectable={true}
        selection={selection}
        onChange={this.onTableChange}
      />
    );
  }
}
