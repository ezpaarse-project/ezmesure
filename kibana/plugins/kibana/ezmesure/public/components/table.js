import React, { Component } from 'react';
import { EuiInMemoryTable, EuiDescriptionList, EuiButtonIcon, EuiLink } from '@elastic/eui';
import { RIGHT_ALIGNMENT } from '@elastic/eui/lib/services';
import { convertFrequency } from '../lib/reporting';
import { addToast } from './toast';
import { openFlyOut } from './flyout';

let editTask;
export function editReportingTask(taskData) {
  editTask(taskData);
}

let saveTask;
export function saveReportingTask(taskData) {
  saveTask(taskData);
}

export default class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
      httpClient: props.httpClient,
      space: props.space,
      reporting: [],
      dashboards: [],
      itemIdToExpandedRowMap: {},
    };

    editTask = this.editReporting;
    saveTask = this.saveReporting;
  }

  componentDidMount() {
    const { httpClient, space } = this.props;

    httpClient.get(`../api/ezmesure/reporting/tasks/${space}`).then(res => {
      this.setState({ reporting: res.data.reporting });
      this.setState({ dashboards: res.data.dashboards });
    }).catch(err => console.log(err));
  }

  editReporting = reportingData => {
    const reportings = this.state.reporting.find(({ _id }) => _id === reportingData._id);

    if (reportings) {
      reportings.push(reportingData);
      this.setState({ reporting: reportings });

      this.forceUpdate();
    }
  }

  saveReporting = reportingData => {
    const reporting = this.state.reporting;

    reporting.push(reportingData);
    this.setState({ reporting });

    this.forceUpdate();
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
        title: 'Receivers\' email addresses :',
        description: reporting.emails,
      },
      {
        title: 'Creation date :',
        description: reporting.createdAt,
      },
    ];
    itemIdToExpandedRowMap[item._id] = (
      <EuiDescriptionList listItems={listItems} />
    );

    return this.setState({ itemIdToExpandedRowMap });
  };

  deleteTask = el => {
    this.state.httpClient.delete(`../api/ezmesure/reporting/tasks/${el._id}`).then(res => {
      addToast(
        'Success',
        'Task removed successfully.',
        'success',
      );

      const reporting = this.state.reporting.filter(({ _id }) => _id !== el._id);
      this.setState({ reporting });

      this.forceUpdate();
    }).catch(err => {
      addToast(
        'Error',
        'An error occurred during the removal of the task',
        'error'
      );
    });
  }

  render() {
    const { reporting, itemIdToExpandedRowMap } = this.state;

    const columns = [
      {
        name: 'Dashboard',
        render: ({ dashboard }) => <EuiLink href={`/dashboard/${dashboard.value}`}>{dashboard.text}</EuiLink>,
        sortable: false,
      },
      {
        name: 'Frequency',
        render: ({ reporting }) => convertFrequency(reporting.frequency),
        sortable: true,
      },
      {
        name: 'Actions',
        actions: [
          {
            name: 'Edit',
            description: 'Edit task',
            icon: 'pencil',
            type: 'icon',
            color: 'primary',
            onClick: el => {
              openFlyOut(el, true, this.editReporting);
            },
          },
          {
            name: 'Delete',
            description: 'Remove task',
            icon: 'trash',
            type: 'icon',
            color: 'danger',
            onClick: el => {
              this.deleteTask(el);
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
};
