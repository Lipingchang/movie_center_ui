import React, { useReducer, useEffect, useState } from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { idolMovieType, loadIdolListByPage, loadIdolMovies } from '@/utils/DiskScanDB/dao';
import { Button, List, Typography } from 'antd'
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
    goPage(1, 10)
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
          bordered
          pagination={{
            onChange: (pageNum: number, pageSize?: number) => {
              goPage(pageNum, pageSize !== undefined ? pageSize : 10)
            },
            total: idolListTotal,
          }}
          dataSource={idolList}
          renderItem={(_doc) => {
            // console.log(_doc)
            return (
              <List.Item key={_doc.href}>
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
        <List
          dataSource={idolMovieList}
          renderItem={(i) => {
            return (
              <List.Item
                key={i.serial}
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
    </div>
  )
}
export default connect((state: ConnectState) => ({ ...state }))(IdolList);