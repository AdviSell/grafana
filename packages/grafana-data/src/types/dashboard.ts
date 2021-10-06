import { FieldConfigSource } from './fieldOverrides';
import { DataQuery, DataSourceRef } from './query';

export enum DashboardCursorSync {
  Off,
  Crosshair,
  Tooltip,
}

/** The scuemata version for the panel plugin */
export type ModelVersion = [number, number];

/**
 * @public
 */
export interface PanelModel<TOptions = any, TCustomFieldConfig extends object = any> {
  /** ID of the panel within the current dashboard */
  id: number;

  /** Panel title */
  title?: string;

  /** Description */
  description?: string;

  /** Panel options */
  options: TOptions;

  /** Field options configuration */
  fieldConfig: FieldConfigSource<TCustomFieldConfig>;

  /** Version of the panel plugin */
  pluginVersion?: string;

  /** The plugin model version */
  modelVersion?: ModelVersion;

  /** The datasource used in all targets */
  datasource?: DataSourceRef | null;

  /** The queries in a panel */
  targets?: DataQuery[];

  /** alerting v1 object */
  alert?: any;
}
