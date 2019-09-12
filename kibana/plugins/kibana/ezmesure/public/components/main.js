import React, { Fragment } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiTitle,
  EuiButton,
} from '@elastic/eui';

import Table from './table';
import Flyout, { openFlyOut } from './flyout';
import Toast from './toast';

export const Main = (props) => (
  <Fragment>
    <Toast />
    <Flyout httpClient={props.httpClient} space={props.space} />
    <EuiPage>
      <EuiPageBody className="euiPageBody--restrictWidth-default">
        <EuiPageContent verticalPosition="top" horizontalPosition="center">
          <EuiPageContentHeader>
            <EuiPageContentHeaderSection>
              <EuiTitle>
                <h2>Reporting</h2>
              </EuiTitle>
            </EuiPageContentHeaderSection>
            <EuiPageContentHeaderSection>
              <EuiButton
                fill
                iconType="plusInCircle"
                onClick={() => openFlyOut(null, false)}>
                Create new reporting task
              </EuiButton>
            </EuiPageContentHeaderSection>
          </EuiPageContentHeader>

          <EuiPageContentBody>
            <Table httpClient={props.httpClient} space={props.space} />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  </Fragment>
);
