import React from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { Card, Form, Input } from 'antd';
import ScanResultPicker from '@/pages/DiskScan/ScanResultPicker';
import Button from 'antd/es/button';
const useForm = Form.useForm;

type Props = {} & ConnectState;
function SerialNo(props: Props) {
  const [form] = useForm();

  return (
    <>
      <PageHeaderWrapper>
        <Card title="SerialNo Picker">
          <Form>
            <Form.Item label="pick" name="scanResultId" rules={[{ required: true }]}>
              <ScanResultPicker />
            </Form.Item>
            <Form.Item
              label="regex"
              name="regex"
              rules={[{ required: true }]}
              initialValue={"[0-9a-zA-Z]+[-\\s][0-9]+"}
            >
              <Input />
            </Form.Item>
            <Button>start</Button>
          </Form>
        </Card>
      </PageHeaderWrapper>
    </>
  );
}

export default connect((state: ConnectState) => ({ ...state }))(SerialNo);
