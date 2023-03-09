import React, { useReducer, useEffect, useState } from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { fuzzyQueryIdolName, idolMovieType, loadIdolListByPage, loadIdolMovies, loadIdolListByMovieCount } from '@/utils/DiskScanDB/dao';
import { AutoComplete, Button, Input, List, Typography } from 'antd'
import { JavbusIdolType } from '@/utils/DiskScanDB/bean'
const electron = window.require('electron')

type Props = {} & ConnectState;
function IdolList(props: Props) {
  function goPage(pageNum: number, pageSize: number) {
    loadIdolListByMovieCount(pageNum, pageSize).then((_data) => {
  // loadIdolListByPage(pageNum, pageSize).then((_data) => {
      // console.log(_data.docs) // 数据格式
      setIdolList(_data.docs)
      setListTotal(_data.pageinfo.total)
    })
  }
  function queryTheName(name: string) {
    loadIdolMovies(name)
      .then(list => setIdolMovieList(list))
  }
  async function fuzzyQueryIdolNameIntoOption(_value:string) {
    if (_value.length<=0 || _value.includes('\'')) return;    // 去掉输入法
    let names = await fuzzyQueryIdolName(_value)
    let options = names.map(n => {return {value: n}})
    setCompletedIdolNameOptions(options)
  }
  useEffect(() => {
    goPage(1, 5)
    // queryTheName('里美ゆりあ')
  }, [props.dispatch])
  const [idolList, setIdolList] = useState<Array<JavbusIdolType> | []>([])
  const [idolListTotal, setListTotal] = useState<number>(0)
  const [queryName, setQueryName] = useState<string>("")
  const [idolMovieList, setIdolMovieList] = useState<Array<idolMovieType>>([])
  const [completedIdolNameOptions, setCompletedIdolNameOptions] = useState<Array<{value:string}>>([])

  return (
    <div>
      <div>
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 2,
            md: 4,
            lg: 4,
            xl: 6,
            xxl: 3,
          }}
          bordered
          pagination={{
            onChange: (pageNum: number, pageSize?: number) => {
              goPage(pageNum, pageSize !== undefined ? pageSize : 5)
            },
            total: idolListTotal,
            // showTotal:  (total: number, range: [number,number]) => {return `${range[0]}-${range[1]} of ${total} items`}
            responsive: true,
            defaultPageSize: 5,
          }}
          dataSource={idolList}
          renderItem={(_doc) => {
            // console.log(_doc)
            return (
              <List.Item key={_doc.name} style={{margin:"8px",}}>
                <Button onClick={() => { queryTheName(_doc.name); setQueryName(_doc.name) }}>{_doc.name} Query!{_doc.m_count}</Button>
              </List.Item>
            )
          }}
        >
        </List>
      </div>
      <div>
        <Typography.Title>Find Idol Presentations:</Typography.Title>
        <Typography.Paragraph>{queryName}</Typography.Paragraph>
        <AutoComplete   // 模糊查询偶像名字
          options={completedIdolNameOptions}
          onSearch={fuzzyQueryIdolNameIntoOption}>
          <Input.Search
            onSearch={(value) => { setQueryName(value); queryTheName(value) }}
          />
        </AutoComplete>
        <List
          dataSource={idolMovieList}
          renderItem={(i,num) => {
            return (
              <List.Item
                key={i.serial}
                style={{ justifyContent: 'space-between' }}
              >
                <span>No.{num+1}</span>
                <Typography.Title level={4}>{i.serial}</Typography.Title>
                {Object.keys(i.diskscan).map(collectionName => {
                  if (i.diskscan[collectionName].length === 0) {
                    return <div key={collectionName}>none</div>
                  } else {
                    return <div key={collectionName}><Button onClick={() => {
                      electron.shell.openPath(i.diskscan[collectionName][0].filePath)
                    }}>Go</Button></div>
                  }
                })}
              </List.Item>
            )
          }}></List>
      </div>
    </div >
  )
}
export default connect((state: ConnectState) => ({ ...state }))(IdolList);