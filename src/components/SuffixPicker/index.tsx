import React from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { Card, Form, Input, Checkbox } from 'antd';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox';

export const movieSuffixList = ['FLV', 'VOB', 'RMVB', 'M4V', 'AVI', '3GP', 'MOV', 'WMV', 'MKV', 'MP4'];
const movieSuffixOpt = movieSuffixList.map((suffix) => {
  return { value: suffix, label: suffix };
});

type Props = {
  value?: Array<CheckboxValueType>;
  // onChange: (e: CheckboxChangeEvent) => void;
  onChange?: (checkedValue: Array<CheckboxValueType>) => void;
} & ConnectState;
function SuffixPicker(props: Props) {
  return (
    <>
      <Checkbox.Group
        value={props.value}
        onChange={props.onChange}
        options={movieSuffixOpt}
      ></Checkbox.Group>
    </>
  );
}

export default connect((state: ConnectState) => ({ ...state }))(SuffixPicker);
