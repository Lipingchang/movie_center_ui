import React, { useState } from 'react';
import { ConnectState } from '@/models/connect';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { Button, Card, Form, Input, List, message, Typography, Spin } from 'antd';
import { useForm } from 'antd/lib/form/Form';
// import { pickOutFilesOneLevel, pickOutMoives } from '@/models/DiskScanUtils';
// import { ScreenShot, loadBase64ImageFiles, CutPrefix, DeleteFile } from '@/utils/FFmpeg';
import electron from 'electron';
// import SuffixPicker, { movieSuffixList } from '@/components/SuffixPicker';
// import { PresistClassStateType, PresistClass } from '@/utils/presist';
// import { DoubleRightOutlined } from '@ant-design/icons';
// import { DeleteFilled } from '@ant-design/icons';
import ScanResultPicker from '../DiskScan/ScanResultPicker';
import { connect } from "react-redux";
import FormItem from 'antd/lib/form/FormItem';
import styles from './FilePicker.less'
import { PaginationProps } from 'antd/lib/pagination';

const dialog: typeof electron.remote.dialog = window.require('electron').remote.dialog;

type PropsType = {} & ConnectState;
type State = {
  scanresult: string[],
  page: PaginationProps
}
function FilePicker(props: PropsType) {
  const [form] = useForm();
  const [state,setState] = useState<State>({
    scanresult: [],
    page: {}
  });
  const formValues = form.getFieldsValue()
  function loadFileListByPage() {

  }
  return (
    <>
      <PageHeaderWrapper>
        <Form
          form={form}
          onValuesChange={(_dir)=>{
            setState({
              ...state,
              scanresult: _dir['scanresult']
            })
            if (_dir['scanresult']!==undefined) {
              loadFileListByPage()  // TODO 从数据库中分页查询文件列表
              // TODO   添加 isJav 查询过滤开关
            }
          }}
        >
          <FormItem name="scanresult">
            <ScanResultPicker />
          </FormItem>
          <div className={styles.main}>
            <div className={styles.a}>
              <p>文件列表<span>{state?.scanresult}</span></p>
              <List></List>
            </div>
            <div className={styles.b}>
              <p>文件详情</p>
            </div>
          </div>
        </Form>
      </PageHeaderWrapper>
    </>
  );
}

export default connect((state: ConnectState) => ({ ...state }))(FilePicker);
