import React from 'react';
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

const dialog: typeof electron.remote.dialog = window.require('electron').remote.dialog;

type PropsType = {} & ConnectState;
function FilePicker(props: PropsType) {
  const [form] = useForm();
  return (
    <>
      <PageHeaderWrapper>
        <Form>
          <FormItem name="scanresult">
            <ScanResultPicker />
          </FormItem>
        </Form>
      </PageHeaderWrapper>
    </>
  );
}

export default connect((state: ConnectState) => ({ ...state }))(FilePicker);
// export default FilePicker;
