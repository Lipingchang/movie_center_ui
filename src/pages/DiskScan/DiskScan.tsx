import React, { useReducer, useEffect, useState } from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { Card, Form, Input, Typography } from 'antd';
import Button from 'antd/es/button';
import Checkbox from 'antd/es/checkbox';
import electron from 'electron';
import ScanResultManager from './ScanResultManager';
import FuzzySearchFileCard from './FuzzySearchFile';
// import { remote as fakeremote } from 'electron';
// const { dialog: fakeDialog } = fakeremote;
const dialog: typeof electron.remote.dialog = window.require('electron').remote.dialog;

const movieSuffixList = ['FLV', 'VOB', 'RMVB', 'M4V', 'AVI', '3GP', 'MOV', 'WMV', 'MKV', 'MP4'];
const movieSuffixOpt = movieSuffixList.map((suffix) => {
  return { value: suffix, label: suffix };
});

type Props = {} & ConnectState;
function DiskScan(props: Props) {
  const [form] = Form.useForm();
  const [scanResult, setScanResult] = useState<{
    movieFilePaths: Array<string>;
    filePaths: Array<string>;
    timestamp: string,
    rootPath: string,
  }>({
    movieFilePaths: [],
    filePaths: [],
    timestamp: "",
    rootPath: "",
  });

  // 调用文件管理器 选择一个文件夹
  function chooseFolder() {
    dialog
      .showOpenDialog({
        defaultPath: 'E:/',
        properties: ['openDirectory'],
      })
      .then(({ canceled, filePaths }) => {
        if (canceled) {
          return;
        }
        form.setFieldsValue({
          rootPath: filePaths[0],
        });
      });
  }

  // 搜索一个文件夹下面所有的视频文件
  function loadMovies() {
    const { rootPath, suffixList } = form.getFieldsValue();
    props
      .dispatch({
        type: 'diskscan/getFolderTree',
        payload: {
          rootPath,
          suffixList,
        },
      })
      .then(({ movieFilePaths, filePaths }: any) => {
        // 显示文件列表
        form.setFieldsValue({
          result: `${movieFilePaths.length}\n` + movieFilePaths.join('\n'),
        });
        setScanResult({
          movieFilePaths,
          filePaths,
          timestamp: `diskscan-${Date.now().toString()}`,
          rootPath: rootPath,
        });
      })
      .catch((err: any) => {
        console.error('error:', err);
      });
  }

  useEffect(() => {
    const json = window.localStorage.getItem('DiskScan') || '{}';
    try {
      form.setFieldsValue(JSON.parse(json));
    } catch (e) { }
    return () => {
      window.localStorage.setItem('DiskScan', JSON.stringify(form.getFieldsValue()));
    };
  }, [props.dispatch]);

  return (
    <>
      <PageHeaderWrapper>
        <Card>
          <Form
            form={form}
            onSubmitCapture={(e) => {
              e.preventDefault();
              loadMovies();
            }}
          >
            <Form.Item
              label="根文件夹"
              name="rootPath"
              rules={[{ required: true, whitespace: true }]}
            >
              <Input />
            </Form.Item>
            <Button
              onClick={() => {
                chooseFolder();
              }}
            >
              choose folder
            </Button>
            <Form.Item
              label="后缀列表"
              name="suffixList"
              rules={[{ required: true }]}
              initialValue={movieSuffixList}
            >
              <Checkbox.Group options={movieSuffixOpt}></Checkbox.Group>
            </Form.Item>
            <Button htmlType="submit">scan</Button>
            <Form.Item label="结果列表" name="result">
              <Input.TextArea />
            </Form.Item>
          </Form>
        </Card>
        <ScanResultManager
          {...scanResult}
        />
        <Typography>
          <Typography.Paragraph>
            扫描结果用时间戳命名, 保存为collection
          </Typography.Paragraph>
          <Typography.Paragraph>
            扫描结果概述保存在scanResult集合中
          </Typography.Paragraph>
        </Typography>
        <FuzzySearchFileCard></FuzzySearchFileCard>
      </PageHeaderWrapper>
    </>
  );
}

export default connect((state: ConnectState) => ({ ...state }))(DiskScan);
