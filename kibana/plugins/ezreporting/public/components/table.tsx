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

import React, { useState, Component } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
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
import moment from 'moment';

import { openFlyOut as openEditFlyOut } from './flyout/edit';
import { openFlyOut as openHistoryFlyOut } from './flyout/history';
import { convertFrequency, toasts, capabilities } from '../../lib/reporting';

interface Props {
  tasks: any[];
  frequencies: any[];
  dashboards: any[];
  removeTaskHandler(task: object): void;
  downloadReport(taskId: string): any;
}

interface State {
  itemIdToExpandedRowMap: object;
  pageIndex: number;
  pageSize: number;
}

export class EzreportingTable extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      itemIdToExpandedRowMap: {},
      pageIndex: 0,
      pageSize: 10,
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

    const listItems = [
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

    if (capabilities.save) {
      actions.push({
        name: i18n.translate('ezReporting.generate', { defaultMessage: 'Generate' }),
        description: i18n.translate('ezReporting.generate', { defaultMessage: 'Generate' }),
        icon: 'importAction',
        type: 'icon',
        color: 'primary',
        onClick: (el) => {
          if (el.exists) {
            return this.props
              .downloadReport(el._id)
              .then(() => {
                return toasts.addInfo({
                  title: 'Information',
                  text: (
                    <FormattedMessage
                      id="ezReporting.generated"
                      defaultMessage="Your report will be sent to you by email"
                    />
                  ),
                });
              })
              .catch(() => {
                return toasts.addDanger({
                  title: 'Error',
                  text: (
                    <FormattedMessage
                      id="ezReporting.generationError"
                      defaultMessage="An error occurred while downloading report."
                    />
                  ),
                });
              });
          }
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

    if (capabilities.delete) {
      actions.push({
        name: i18n.translate('ezReporting.delete', { defaultMessage: 'Delete' }),
        description: i18n.translate('ezReporting.delete', { defaultMessage: 'Delete' }),
        icon: 'trash',
        type: 'icon',
        color: 'danger',
        onClick: (el) => {
          this.props.removeTaskHandler(el);
        },
      });
    }

    const columns = [
      {
        name: i18n.translate('ezReporting.dashboard', { defaultMessage: 'Dashboard' }),
        description: i18n.translate('ezReporting.dashboardName', {
          defaultMessage: 'Dashboard name',
        }),
        align: 'left',
        render: ({ dashboardId, reporting }) => {
          if (dashboardId) {
            const dashboard = dashboards.find(({ id }) => id === dashboardId);
            if (dashboard) {
              if (reporting.print) {
                const content = (
                  <FormattedMessage
                    id="ezReporting.optimizedForPrinting"
                    defaultMessage="Optimized for printing"
                  />
                );
                return (
                  <span>
                    <EuiLink href={`kibana#/dashboard/${dashboardId}`}>{dashboard.name}</EuiLink> {' '}
                    <EuiToolTip position="right" content={content}>
                      <EuiText>&#128438;</EuiText>
                    </EuiToolTip>
                  </span>
                );
              }
              return <EuiLink href={`kibana#/dashboard/${dashboardId}`}>{dashboard.name}</EuiLink>;
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
        render: (item) => (
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

    const startIndex = pageIndex * pageSize;
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
