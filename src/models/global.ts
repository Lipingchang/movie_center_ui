import { Subscription, Reducer, Effect } from 'umi';
import { message } from 'antd';
import { MongooseType, connectToDB } from '@/utils/connect_db';

export interface GlobalModelState {
  collapsed: boolean;
  mongoose: MongooseType;
}

export interface GlobalModelType {
  namespace: 'global';
  state: GlobalModelState;
  effects: { [key in string]: Effect };
  reducers: { [key in string]: Reducer };
  subscriptions: { setup: Subscription };
}

const GlobalModel: GlobalModelType = {
  namespace: 'global',

  state: {
    collapsed: false,
    mongoose: undefined,
  },

  effects: {},

  reducers: {
    setMongoose(state, { payload: { mongoose } }): GlobalModelState {
      return {
        ...state,
        mongoose,
      }
    },
    // changeLayoutCollapsed(state = { collapsed: true }, { payload }): GlobalModelState {
    //   return {
    //     ...state,
    //     collapsed: payload,
    //   };
    // },
  },

  subscriptions: {
    setup({ history }): void {
      // Subscribe history(url) change, trigger `load` action if pathname is `/`
      // history.listen(({ pathname, search }): void => {
      //   if (typeof window.ga !== 'undefined') {
      //     window.ga('send', 'pageview', pathname + search);
      //   }
      // });
      // 连接数据库
      connectToDB()
        .then(() => {
          message.success('Connect To DB Success');
        })
        .catch((error) => {
          console.error(error);
          message.error('Failed to Connect to DB');
        });
    },
  },
};

export default GlobalModel;
