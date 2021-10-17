import React, { useReducer, useEffect, useState } from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { idolMovieType, loadIdolListByPage, loadIdolMovies } from '@/utils/DiskScanDB/dao';
import { AutoComplete, Button, Input, List, Typography } from 'antd'
import { JavbusIdolType } from '@/utils/DiskScanDB/bean'
const electron = window.require('electron')

type Props = {} & ConnectState;
function IdolList(props: Props) {
  function goPage(pageNum: number, pageSize: number) {
    loadIdolListByPage(pageNum, pageSize).then((_data) => {
      // console.log(_data.docs) // 数据格式
      setIdolList(_data.docs)
      setListTotal(_data.pageinfo.total)
    })
  }
  function queryTheName(name: string) {
    loadIdolMovies(name)
      .then(list => setIdolMovieList(list))
  }
  useEffect(() => {
    goPage(1, 20)
    // queryTheName('里美ゆりあ')
  }, [props.dispatch])
  const [idolList, setIdolList] = useState<Array<JavbusIdolType> | []>([])
  const [idolListTotal, setListTotal] = useState<number>(0)
  const [queryName, setQueryName] = useState<string>("")
  const [idolMovieList, setIdolMovieList] = useState<Array<idolMovieType>>([])

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
              goPage(pageNum, pageSize !== undefined ? pageSize : 20)
            },
            total: idolListTotal,
            // showTotal:  (total: number, range: [number,number]) => {return `${range[0]}-${range[1]} of ${total} items`}
            responsive: true,
            defaultPageSize: 20,
          }}
          dataSource={idolList}
          renderItem={(_doc) => {
            // console.log(_doc)
            return (
              <List.Item key={_doc.href} >
                <Typography.Text>{_doc.name}</Typography.Text>
                <Button onClick={() => { queryTheName(_doc.name); setQueryName(_doc.name) }}>Query!</Button>
              </List.Item>
            )
          }}
        >
        </List>
      </div>
      <div>
        <Typography.Title>Find Idol Presentations:</Typography.Title>
        <Typography.Paragraph>{queryName}</Typography.Paragraph>
        <AutoComplete onSearch={(_value)=>{
          console.log(_value)
        }}>
          <Input.Search
            onSearch={(value) => { setQueryName(value); queryTheName(value) }}
          />
        </AutoComplete>
        <List
          dataSource={idolMovieList}
          renderItem={(i) => {
            return (
              <List.Item
                key={i.serial}
                style={{ justifyContent: 'space-between' }}
              >
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