import React from 'react'
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { Button, Card, List, Form, Input, Typography } from 'antd';
import { searchMovieFiles } from '@/utils/DiskScanDB/dao';
import { useState } from 'react';
import { SingleFileType } from '@/utils/DiskScanDB/bean';
const electron = window.require('electron')

type Props = {} & ConnectState;
function FuzzySearchFileCard(props: Props) {
  const [fileList, setFileList] = useState<Array<SingleFileType>>([])
  const [searchValue, setSearchValue] = useState<string>('')
  return (<>
    <Card
      title="模糊搜索文件名字"
    >
      <Input.Search onSearch={(value) => {
        setSearchValue(value)
        searchMovieFiles(value)
          .then(_data => setFileList(_data))
      }}></Input.Search>
      <List
        dataSource={fileList}
        renderItem={(item) => {
          return (<List.Item>
            <WithHighlight p={item.fileName} target={searchValue} />
            <Button onClick={()=>{
              electron.shell.openPath(item.filePath)
            }}>Watch</Button>
          </List.Item>)
        }}
      />
      {/* <WithHighlight p="hhhhhh" target="hh" /> */}
    </Card>
  </>)
}


type HighlightProps = {
  p: string,
  target: string,
};
function WithHighlight(props: HighlightProps) {
  const re = new RegExp(props.target, 'ig')
  if (!re.test(props.p)) {
    return <span>{props.p}</span>
  }

  const splitter = '\u0001\u0003' //  使用的特殊字符作为分割标记
  const matchArray = props.p
    .replace(re, m => `${splitter}${m}${splitter}`) // 将匹配到的文字使用特殊字符包裹
    .split(splitter)
    .filter(Boolean) // 处理关键字在起始位置的时候留下的空字符串（这里不处理也可以）

  return (
    < div >
      {
        matchArray.map(node => {
          if (!re.test(node)) {
            return node;
          }
          return <span style={{backgroundColor: 'yellow'}}>{node}</span>
        })
      }
    </div >
  )
}
export default connect((state: ConnectState) => ({ ...state }))(FuzzySearchFileCard);
