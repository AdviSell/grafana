import React, { PureComponent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Alert, InlineFieldRow, VerticalGroup } from '@grafana/ui';
import { DataSourceRef, SelectableValue } from '@grafana/data';

import { AdHocVariableModel } from '../types';
import { VariableEditorProps } from '../editor/types';
import { changeVariableDatasource, initAdHocVariableEditor } from './actions';
import { StoreState } from 'app/types';
import { VariableSectionHeader } from '../editor/VariableSectionHeader';
import { VariableSelectField } from '../editor/VariableSelectField';
import { getAdhocVariableEditorState } from '../editor/selectors';

const mapStateToProps = (state: StoreState) => ({
  extended: getAdhocVariableEditorState(state.templating.editor),
});

const mapDispatchToProps = {
  initAdHocVariableEditor,
  changeVariableDatasource,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export interface OwnProps extends VariableEditorProps<AdHocVariableModel> {}

type Props = OwnProps & ConnectedProps<typeof connector>;

export class AdHocVariableEditorUnConnected extends PureComponent<Props> {
  componentDidMount() {
    this.props.initAdHocVariableEditor();
  }

  onDatasourceChanged = (option: SelectableValue<DataSourceRef>) => {
    this.props.changeVariableDatasource(option.value);
  };

  render() {
    const { variable, extended } = this.props;
    const dataSources = extended?.dataSources ?? [];
    const infoText = extended?.infoText ?? null;
    const options = dataSources.map((ds) => ({ label: ds.text, value: ds.value }));
    const value = options.find((o) => o.value?.uid === variable.datasource?.uid) ?? options[0];

    return (
      <VerticalGroup spacing="xs">
        <VariableSectionHeader name="Options" />
        <VerticalGroup spacing="sm">
          <InlineFieldRow>
            <VariableSelectField
              name="Data source"
              value={value}
              options={options}
              onChange={this.onDatasourceChanged}
              labelWidth={10}
            />
          </InlineFieldRow>

          {infoText ? <Alert title={infoText} severity="info" /> : null}
        </VerticalGroup>
      </VerticalGroup>
    );
  }
}

export const AdHocVariableEditor = connector(AdHocVariableEditorUnConnected);
