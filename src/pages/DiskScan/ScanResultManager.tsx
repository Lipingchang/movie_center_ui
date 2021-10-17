import React, { useState, useEffect } from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { message, Card, Form, Input, Button, Spin, List, Typography, Popconfirm } from 'antd';
import { useForm } from 'antd/es/form/util';
import {
  saveSingleFilesToCollection,
  saveScanResult,
  loadScanResult,
  removeScanResult,
} from '@/utils/DiskScanDB/dao';
import {
  ScanResultType,
} from '@/utils/DiskScanDB/bean'

type Props = {
  movieFilePaths: Array<string>;
  filePaths: Array<string>;
  timestamp: string;
  rootPath: string;
} & ConnectState;

function FormerScanResult(props: Props) {
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

  // 删除一个扫描
  function del(item: ScanResultType) {
    setloading(true);
    // 删除这个扫描的摘要和collection
    removeScanResult(item._id, item.collectionName)
      .then(({ deletedCount }) => {
        message.success(`del ${deletedCount}`);
        load();
      })
      .catch((error) => {
        console.error(error);
        message.error('del fail');
      })
      .finally(() => {
        setloading(false);
      });
  }

  useEffect(() => {
    load();
  }, [props.dispatch]);

  return (
    <>
      <Card title="往期扫描结果" extra={<Button onClick={load}>load</Button>}>
        <Spin spinning={loading}>
          <List
            bordered
            dataSource={dataSource}
            renderItem={(item, index) => (
              <List.Item
                extra={
                  <Popconfirm
                    title="del?"
                    onConfirm={() => {
                      del(item);
                    }}
                  >
                    <Button size="small" danger>
                      del
                    </Button>
                  </Popconfirm>
                }
              >
                <Typography.Text mark>
                  [{index + 1}] {item.rootPath}
                </Typography.Text>
                普通文件{item.fileCount}个 movie文件{item.movieFileCount}个
              </List.Item>
            )}
          />
        </Spin>
      </Card>
    </>
  );
}

function ScanResultManager(props: Props) {
  const [form] = useForm();
  const [loading, setloading] = useState<boolean>(false);
  useEffect(() => {
    loadScanResult().then((res) => {
      // console.log(res);
    });
  }, [props.dispatch]);

  let saveBlock;
  if (props.filePaths.length === 0) {
    saveBlock = <Card>请先扫描</Card>;
  } else {
    saveBlock = (
      <Card title="保存扫描结果">
        <Spin spinning={loading}>
          <Form>
            <Form.Item label="一共找到文件">{props.filePaths.length}个</Form.Item>
            <Form.Item label="一共找到movie文件">{props.movieFilePaths.length}个</Form.Item>
            <Form.Item label="collection名字">
              <Input disabled value={props.timestamp} />
            </Form.Item>
            <Button
              onClick={() => {
                setloading(true);
                // 保存到数据库中
                // 保存文件列表
                saveSingleFilesToCollection(props.filePaths, props.movieFilePaths, props.timestamp)
                  // 保存扫描结果
                  .then(() => {
                    saveScanResult(
                      props.timestamp,
                      props.rootPath,
                      props.filePaths,
                      props.movieFilePaths,
                      props.timestamp,
                    );
                  })
                  .then(() => {
                    message.success('save success');
                  })
                  .catch((error) => {
                    console.error(error);
                    message.error('save fail');
                  })
                  .finally(() => {
                    setloading(false);
                  });
              }}
            >
              Save to DB
            </Button>
          </Form>
        </Spin>
      </Card>
    );
  }

  return (
    <>
      {saveBlock}
      <FormerScanResult {...props} />
    </>
  );
}

export default connect((state: ConnectState) => ({ ...state }))(ScanResultManager);
