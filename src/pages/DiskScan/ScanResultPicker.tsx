import React, { useState, useEffect } from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import {
  message,
  Card,
  Form,
  Input,
  Button,
  Spin,
  List,
  Typography,
  Popconfirm,
  Radio,
} from 'antd';
import { useForm } from 'antd/es/form/util';
import {
  saveSingleFilesToCollection,
  saveScanResult,
  loadScanResult,
  removeScanResult,
} from '@/utils/DiskScanDB/dao';
import { ScanResultType } from '@/utils/DiskScanDB/bean';
import RadioGroup from 'antd/lib/radio/group';
import { ObjectId } from 'mongodb';

type Props = {
  // movieFilePaths: Array<string>;
  // filePaths: Array<string>;
  // timestamp: string;
  // rootPath: string;
  onChange: Function;
  value: ObjectId;
} & ConnectState;

function ScanResultPicker(props: Props) {
  const [loading, setloading] = useState<boolean>(false);
  const [dataSource, setDateSource] = useState<Array<ScanResultType>>([]);

  // 查询以前的扫描情况
  function load() {
    setloading(true);
    loadScanResult()
      .then((res) => {
        setDateSource(res);
        message.success('load former');
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setloading(false);
      });
  }

  useEffect(() => {
    load();
  }, [props.dispatch]);

  const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
  };

  return (
    <>
      <Card title="往期扫描结果" extra={<Button onClick={load}>reload</Button>}>
        <Spin spinning={loading}>
          <Radio.Group
            value={props.value}
            onChange={(e) => {
              props.onChange(e.target.value);
            }}
          >
            {dataSource.map((item, index) => {
              return (
                // <Radio key={item._id.toHexString()} value={item._id} style={radioStyle}>
                <Radio key={item._id.toHexString()} value={item.collectionName} style={radioStyle}>
                  <Typography.Text mark>
                    [{index + 1}] {item.rootPath}
                  </Typography.Text>
                  普通文件{item.fileCount}个 movie文件{item.movieFileCount}个
                </Radio>
              );
            })}
          </Radio.Group>
        </Spin>
      </Card>
    </>
  );
}

export default connect((state: ConnectState) => ({ ...state }))(ScanResultPicker);
