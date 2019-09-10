import React, { Component } from 'react';
import { EuiInMemoryTable, EuiLink } from '@elastic/eui';
import { convertTimeSpan } from '../lib/reporting';
import { addToast } from './toast';
import { openFlyOut } from './flyout';
import $jQ from 'jquery';

export default class Table extends Component {
  constructor(props) {
    super(props);

    this.state = {
      reporting: [],
      columns: [
        {
          name: 'Dashboard',
          render: ({ dashboard }) => <EuiLink href={`/dashboard/${dashboard.value}`}>{dashboard.text}</EuiLink>,
          sortable: false,
        },
        {
          name: 'Time span',
          render: ({ reporting }) => reporting.timeSpan ? convertTimeSpan(reporting.timeSpan) : 'error',
          sortable: false,
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
              onClick: (el) => {
                openFlyOut(el, true);
              },
            },
            {
              name: 'Delete',
              description: 'Remove task',
              icon: 'trash',
              type: 'icon',
              color: 'danger',
              onClick: (el) => {
                addToast(
                  'grrrrrrrr',
                  'aaaaaaaaaaaaaaaaa',
                  'success'
                );
              },
            },
          ],
        },
      ],
    };
  }

  componentDidMount() {
    const { httpClient } = this.props;

    const currentUrl = $jQ(location).attr('pathname');
    let space = '';
    if (/^\/kibana\/s\/([a-z0-9\-]+)/i.test(currentUrl)) {
      space = currentUrl.split('/')[3];
    }

    httpClient.get(`../api/ezmesure/reporting/list/${space}`).then(res => {
      this.setState({ reporting: res.data.reporting });
      console.log(res.data)
    }).catch(err => console.log(err));
  }

  render() {
    const { reporting, columns } = this.state;
    return (
      <EuiInMemoryTable
        items={reporting}
        columns={columns}
        pagination={false}
      />
    );
  }
};
