import { MenuDataItem, Settings as ProSettings } from '@ant-design/pro-layout';
import { DefaultSettings } from 'config/defaultSettings'
import { GlobalModelState } from './global';
import { Dispatch } from 'umi';

export { GlobalModelState, UserModelState };

export interface Loading {
  global: boolean;
  effects: { [key: string]: boolean | undefined };
  models: {
    global?: boolean;
    menu?: boolean;
    setting?: boolean;
  };
}

export interface ConnectState {
  global: GlobalModelState;
  loading: Loading;
  settings: DefaultSettings;//ProSettings;
  dispatch: Dispatch;
}

export interface Route extends MenuDataItem {
  routes?: Route[];
}
