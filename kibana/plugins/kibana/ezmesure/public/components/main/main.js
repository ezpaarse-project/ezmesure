import React, { Component } from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
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
import Toast from '../toast';
import Table from '../table';
import Flyout, { openFlyOut } from '../flyout';

export class Main extends Component {
  <React.Fragment>
    <Toast />
    <Flyout />
    <EuiPage>
      <EuiPageBody className="euiPageBody--restrictWidth-default">
        <EuiPageContent verticalPosition="top" horizontalPosition="center">
          <EuiPageContentHeader>
            <EuiPageContentHeaderSection>
              <EuiTitle>
                <h2>{props.title}</h2>
              </EuiTitle>
            </EuiPageContentHeaderSection>
            <EuiPageContentHeaderSection>
              <EuiButton
                fill
                iconType="plusInCircle"
                onClick={() => openFlyOut(null, false)}>
                <FormattedMessage id="reporting.createTask" defaultMessage="Créer une nouvelle tâche de reporting"></FormattedMessage>
              </EuiButton>
            </EuiPageContentHeaderSection>
          </EuiPageContentHeader>

          <EuiPageContentBody>
            <Table />
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  </React.Fragment>
);
