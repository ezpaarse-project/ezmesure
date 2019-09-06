import React, { Component } from 'react';
import { EuiInMemoryTable, EuiLink } from '@elastic/eui';
import { convertTimeSpan, dataReporting } from '../../lib/reporting';
import { addToast } from '../toast';
import { openFlyOut } from '../flyout';

export default class Table extends Component {
  constructor (props) {
    super(props);

    this.state = {
      data: dataReporting,
      columns: [
        {
          name: 'Tableau de bord',
          render: ({ dashboard }) => <EuiLink href={`/dashboard/${dashboard.id}`}>{dashboard.name}</EuiLink>,
          sortable: false,
        },
        {
          name: 'Période',
          render: ({ reporting }) => convertTimeSpan(reporting.timeSpan) || reporting.timeSpan,
          sortable: false,
        },
        {
          name: 'Actions',
          actions: [
            {
              name: 'Edit',
              description: 'Editer la tâche',
              icon: 'pencil',
              type: 'icon',
              color: 'primary',
              onClick: (el) => {
                openFlyOut(el, true);
              },
            },
            {
              name: 'Delete',
              description: 'Supprimer la tâche',
              icon: 'trash',
              type: 'icon',
              color: 'danger',
              onClick: (el) => {
                addToast(
                  'grrrrrrrr',
                  `aaaaaaaaaaaaaaaaa`,
                  'success'
                )
              },
            },
          ],
        },
      ],
    };
  }
  
  render() {
    const { data, columns } = this.state;
    return (
      <EuiInMemoryTable
        items={data}
        columns={columns}
        pagination={false}
      />
    )
  }
};
