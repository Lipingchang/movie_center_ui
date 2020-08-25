import React from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { Card, Form, Input, Checkbox, Radio } from 'antd';
// import { CheckboxValueType } from 'antd/lib/checkbox/Group';
// import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox';
import { RadioChangeEvent } from 'antd/lib/radio';

// export const movieSuffixList = ['FLV', 'VOB', 'RMVB', 'M4V', 'AVI', '3GP', 'MOV', 'WMV', 'MKV', 'MP4'];
// const movieSuffixOpt = movieSuffixList.map((suffix) => {
// return { value: suffix, label: suffix };
// });
export const prefixTypeList = [
  '澳门巴黎人',
  '澳门顶级赌场',
  '凤凰',
  '长-凤凰',
  '狐狸+为你而骚',
  'pornhub',
  '每日更新50b',
  '亚博体育',
  '狐狸视频',
  'none',
];
export const prefixLengthList = [29, 110, 192, 200 ,109, 4, 69, 85, 100, 0];
const prefixOpt = prefixTypeList.map((key, index) => {
  return {
    label: key,
    value: prefixLengthList[index],
  };
});

type Props = {
  // value?: Array<CheckboxValueType>;
  value: any;
  onChange?: (e: RadioChangeEvent) => void;
} & ConnectState;

class PrefixSelect extends React.PureComponent<Props> {
  // value = 0;
  constructor(props: Props) {
    super(props);
    // this.value = props.value
  }
  // // 加快长列表渲染 TODO 代码有问题, bug 改不了....
  // shouldComponentUpdate(nextProps, nextState) {
  //   if (nextProps.value===this.value) {
  //     // console.log('false!')
  //   console.log('false','from',this.value,'to',nextProps.value,'current',this.props.value)
  //     return false;
  //   }
  //   // console.log('true', nextProps.value, this.props.value, this.value)
  //   console.log('true','from',this.value,'to',nextProps.value,'current',this.props.value)
  //   this.value = nextProps.value
  //   return true;
  // }

  render() {
    return (
      <>
        {/* <Checkbox.Group */}
        <Radio.Group
          style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '40%' }}
          value={this.props.value}
          onChange={this.props.onChange}
          options={prefixOpt}
        ></Radio.Group>
      </>
    );
  }
}

export default connect((state: ConnectState) => ({ ...state }))(PrefixSelect);
